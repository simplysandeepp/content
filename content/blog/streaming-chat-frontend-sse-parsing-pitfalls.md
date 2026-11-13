---
title: "Reading a Stream in the Browser — Chunk Boundaries, Markdown Re-renders and an innerHTML Risk"
description: "A review of the front end of a small streaming chatbot: reading an SSE response with fetch and getReader, why splitting each network chunk on newlines can drop tokens, the cost of re-rendering Markdown on every chunk, and why model output should be sanitised before innerHTML."
metaDescription: "Browser-side handling of an LLM streaming response — fetch ReadableStream, SSE line buffering, Markdown re-rendering cost and sanitising model output before innerHTML."
date: "2026-08-30"
tags: ["JavaScript", "Streaming", "Server-Sent Events", "Security", "Frontend", "Dev Log"]
published: true
---

The back end of my study-partner chatbot streams replies as server-sent events. The front end is about 320 lines of plain HTML and JavaScript. Reviewing it afterwards, I found a working typing effect and three things I'd fix. This post is that review, written down so I stop making the same mistakes.

## How the Client Reads the Stream

Because the request is a `POST` with a JSON body, the browser's built-in `EventSource` (GET-only) isn't an option. The client uses `fetch` and reads the body directly:

```js
const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  ...
}
```

`{ stream: true }` matters: a multi-byte character (an emoji, a non-Latin letter) can be split across two network chunks, and the decoder needs to hold the partial bytes until the rest arrives. Without it you get replacement characters in the middle of a word.

Each chunk is split into lines; lines beginning with `data: ` are JSON-parsed, and `content` is appended to the running text. Errors from the server arrive as an event with an `error` field and are appended to the message so the user sees something.

## Pitfall 1: A Network Chunk Is Not an SSE Event

The loop splits **each chunk** on `\n` and parses every `data:` line it finds. That assumes every network chunk contains whole events. It usually does on a local connection, but TCP and proxies make no such promise: a chunk can end halfway through a JSON line. The next chunk then starts with the remainder, which doesn't begin with `data: ` and is ignored, while the first half fails `JSON.parse`. The result is a silently dropped token or two.

The standard fix is a small buffer: append the decoded chunk to a string, process only complete lines (up to the last `\n\n`), and keep the remainder for the next read. It's a few lines and removes a bug that only appears on slower or proxied connections — which is exactly where you don't want to debug it.

## Pitfall 2: Re-parsing the Whole Message Each Time

After every chunk, the code does `markdownContainer.innerHTML = marked.parse(fullText)`. That re-parses and rebuilds the full message on every update, so the work grows with the answer's length. For short answers it's invisible; for a long, code-heavy answer it is wasted effort and can cause flicker on a phone. Options, in increasing effort: render at most once per animation frame, show plain text while streaming and render Markdown at the end, or use an incremental renderer.

## Pitfall 3: Model Output Is Untrusted HTML

Setting `innerHTML` from `marked` output means any HTML the model emits — or is tricked into emitting — becomes live markup. Markdown parsers deliberately pass raw HTML through. For a personal tool the risk is small, but the habit isn't: treat model output as untrusted, run it through a sanitiser such as DOMPurify (or configure the renderer to escape HTML) before assigning it to `innerHTML`. If a user's *shared* conversation ever renders in someone else's browser, this stops being theoretical.

## Deployment, Briefly

The app deploys to Render with a `render.yaml`, a `build.sh` that installs requirements and runs migrations, and Gunicorn as the start command. Static files are served via WhiteNoise. The environment variable for the API key is marked `sync: false`, so it is set in the dashboard rather than committed. The only wrinkle was pinning a Python version that supports the Django release in use.

## Summary

| Issue | Impact | Fix |
|---|---|---|
| Per-chunk line splitting | Rare dropped tokens | Buffer until a full event |
| Re-render all Markdown per chunk | Cost grows with length | Throttle or render at end |
| Unsanitised `innerHTML` | XSS if output is hostile | Sanitise before insert |

None of these showed up in a quick manual test, which is the point: streaming code needs to be reviewed for what happens on a *bad* network, not a good one.
