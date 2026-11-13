---
title: "Wrapping a Slow Generative-Music API — Submit, Poll, Callback, Download, Trim"
description: "How Echo Echo integrates a third-party music generation API in an async FastAPI backend: building the prompt from structured inputs, a bounded polling loop with explicit failure states, why a public callback URL is validated at startup, and post-processing with pydub and ffmpeg."
metaDescription: "Async integration pattern for slow generative AI APIs — task submission, bounded polling, failure status sets, public callback validation, audio download and trimming."
date: "2026-06-14"
tags: ["FastAPI", "Python", "Async", "httpx", "Generative Audio", "Dev Log"]
published: true
---

Echo Echo is a songwriting-inspiration tool built by a small team: you pick a mood, theme, style, instruments, tempo and energy, and it returns a short instrumental sketch. The interesting engineering is not the UI; it's wrapping a **slow, third-party, asynchronous** generation API so that the rest of the app can treat it like a function call. This post covers that integration layer.

## Structured Input, Then a Prompt

The frontend sends structured fields, not free text:

```python
@dataclass
class GenerationInput:
    mood: str; theme: str; style: str
    instruments: list[str]; tempo: int; energy: int
```

`build_prompt` turns these into a single instruction ("a 30 second instrumental songwriting inspiration sketch…") plus a style string, with a fallback phrase when no instruments are chosen. For the alternative ACE-Step backend, the same inputs become a comma-separated tag prompt, with the 1–10 energy slider mapped to words (`1 → "very calm"` … `10 → "extreme"`) and tempo expressed as `"90 BPM"`. Keeping one structured input and several prompt *builders* means a different model needs a new function, not a new UI.

## The Job Lifecycle

Generation takes much longer than a normal HTTP request, so the provider's API is job-based:

1. **Submit** a task and receive a `task_id`.
2. **Wait** for completion, either by polling or by the provider calling you back.
3. **Download** the resulting audio URL.
4. **Post-process** it.

The code is a small `async` pipeline using `httpx.AsyncClient`: `submit_to_suno` → `poll_suno` → `download_audio`, each timed and logged.

## A Polling Loop With a Deadline and a Failure Set

`poll_suno` checks the task's `record-info` endpoint every five seconds until a deadline (ten minutes). Three rules make it robust:

- A status of `SUCCESS` returns the record.
- Any status in a **known failure set** — task creation failed, audio generation failed, callback exception, sensitive-word rejection — raises immediately with the provider's error message. Waiting out a timeout for a job you already know has failed is wasted time for the user.
- Falling out of the loop raises a `TimeoutError`.

`asyncio.sleep` yields to the event loop between polls, so one slow generation doesn't block other requests. `response.raise_for_status()` and a per-request timeout keep a failing provider from hanging the loop.

## Why the Callback URL Is Validated at Startup

The API can POST to a callback URL when it finishes. That only works if the URL is publicly reachable, and a very common local-development mistake is configuring `localhost`. Instead of letting that fail mysteriously minutes later, `build_callback_url()` raises a configuration error immediately if `PUBLIC_BASE_URL` is missing or contains `localhost` or `127.0.0.1`, and the error message tells you to use a tunnel such as ngrok or cloudflared. `validate_kieai_config()` runs it at startup.

This is the general principle: **turn a late, confusing runtime failure into an early, specific configuration error.** The callback path itself is configurable and normalised to start with `/`.

## Post-Processing

The provider's audio may be longer than the product's 30-second target. After downloading, `trim_audio` uses `pydub` (backed by ffmpeg) to cut to a configurable duration and export an MP3. The code first locates an audio converter and raises a clear error if none is installed, rather than failing deep inside `pydub`. Original and trimmed filenames are stored separately so the original is never destroyed.

Song ids are short generated codes checked against the set of existing ids to avoid collisions; the result record stores the task id, the prompt, the source URL and the creation time so any track can be traced back to the request that produced it.

## Error Handling Details

- The provider's error body is **sanitised** before logging, so secrets in a response aren't written to logs.
- Missing API keys produce a direct message ("add it to .env") instead of an unhelpful 401.
- Vocal generation reuses the same polling code, and attaches a callback URL only if one is configured.

## What I'd Improve

- Polling plus callbacks is redundant if one is reliable; choose callback with polling as a fallback and persist task state so a server restart doesn't lose an in-flight job.
- Exponential backoff on the poll interval.
- Cache identical requests so repeated parameter combinations don't spend credits.
