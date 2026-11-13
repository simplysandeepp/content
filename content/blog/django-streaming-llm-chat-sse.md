---
title: "Streaming an LLM Reply Through Django — SSE, Session Memory and the Save That Didn't Happen"
description: "Notes from building a small Django chatbot: proxying a streaming model API with StreamingHttpResponse, why session memory must be saved manually after a stream, how multi-chat state fits in the session, and what changed when free model limits kept shifting."
metaDescription: "How to stream LLM responses through Django with server-sent events, keep multi-chat memory in the session, and handle the session-save pitfall of StreamingHttpResponse."
date: "2026-08-29"
tags: ["Django", "Python", "Server-Sent Events", "LLM", "Streaming", "Dev Log"]
published: true
---

I built a small study-partner chatbot to understand the entire path of a streaming chat app: browser, web framework, model API, and back. The back end ended up as one view module. This post covers the parts that were not obvious.

## From Script to Django in Small Steps

The git history reads like a ladder: a script calling OpenRouter, then a switch of model and an explicit 401 handler, then a web UI, then Django, then one feature per branch — clear-chat button, persisted history, markdown rendering, streaming, a speed tweak, session memory, chat tabs, chat deletion, a landing page, Render deployment. Every rung was a small PR. That cadence made it easy to see which change introduced which bug.

## Streaming With `StreamingHttpResponse`

The view opens a streaming request to the model API (`stream: True`) and returns a generator wrapped in `StreamingHttpResponse(..., content_type='text/event-stream')`. Inside the generator each upstream line is processed like this:

1. Ignore blank lines; only handle those starting with `data: `.
2. Stop at `[DONE]`.
3. Parse the JSON chunk, read `choices[0].delta.content`.
4. Yield it as `data: {"content": "..."}\n\n` — the SSE framing the browser expects.

Malformed chunks are skipped rather than allowed to break the stream, and a non-200 upstream response is reported as a single SSE error event so the UI can show something instead of hanging. On the client, reading the response body incrementally and appending text to the current bubble gives the typing effect. I turned off the model's explicit reasoning output for chat, which noticeably reduced time to first token.

## The Bug: Session Not Saved

Memory was first stored in a Python variable, which is shared by every visitor — fine for one person testing, wrong for anyone else. The fix was to move history into the Django **session**, keyed per chat id:

```python
request.session['chats'] = {'Chat 1': [SYSTEM_PROMPT, ...], 'Chat 2': [...]}
```

The subtle part: Django's session middleware saves modified sessions when it builds the response, but with a streaming response the generator keeps running **after** that point. The assistant's reply, appended at the end of the generator, was therefore never persisted by the middleware. The view calls `request.session.save()` explicitly at the end of the stream (and the user's message is saved before streaming starts). A code comment records why, since it's the kind of line a future cleanup would otherwise delete.

## One Session, Many Chats

The sidebar's tabs are just keys in that session dict. Rules that fell out of it: a new chat id creates an empty history starting from the system prompt; "clear" resets one key; "delete" removes one but refuses to remove the last chat; and the history endpoint filters out the system message so the UI never shows the prompt.

## Model Churn

Free models come and go. The default moved from one provider's model to another because of rate-limit errors, then to a different one again. Putting the model id in one place made each swap a one-line change, but the lesson is stronger: **treat the model name as configuration and expect it to change.**

## What I'd Harden Before Real Use

- Remove `csrf_exempt` and send the CSRF token from the front end.
- Turn debug off, restrict allowed hosts, and keep the secret key in the environment.
- Cap history length per chat (it grows unbounded, so token cost and latency do too).
- Handle upstream timeouts and client disconnects in the generator.
- Add a real test around the stream parsing.
- If "chat with my notes" is the goal, add actual retrieval — this app does not do that despite the original repository name.
