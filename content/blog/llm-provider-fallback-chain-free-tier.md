---
title: "Running an LLM Bot on Free Tiers — A Provider Fallback Chain With Automatic Pausing"
description: "How a WhatsApp assistant stays up on free-tier model endpoints: an ordered provider chain, classifying 401/403/429 errors differently, pausing a provider until its quota resets, streaming for slow reasoning models, and the lone-surrogate JSON bug that only showed up with emoji."
metaDescription: "Designing an LLM provider fallback chain for free tiers — error classification, timed provider blocking, per-day quota detection, SSE streaming and a surrogate-pair JSON bug."
date: "2026-10-13"
tags: ["LLM", "Node.js", "Reliability", "Rate Limiting", "Streaming", "Dev Log"]
published: true
---

Free-tier model endpoints are generous and unreliable in equal measure: they rate-limit, run out of daily quota, rotate model names and occasionally return nothing. A chatbot that depends on one of them will be down often. This is how I made a small WhatsApp bot resilient to that without paying for anything.

## The Chain

Providers are listed in an order set by an environment variable, each with a base URL, key, model list and an `extra()` hook for provider-specific request fields. Because most of them expose an OpenAI-compatible `/chat/completions` endpoint, one request function serves all of them. "Hard" questions use a separate set of stronger reasoning models, tried first; everything else goes down the normal chain.

Adding a provider is a config entry, not a code change — which is the property you want when free offerings change every few weeks.

## Not All Errors Mean the Same Thing

The function that handles a failed call looks at the status code, because the right response differs:

| Status | Meaning | Response |
|---|---|---|
| 429 | Rate limited | Pause the provider for a minute; if the error text says *per day / quota*, pause until the provider's reset header, or an hour if there isn't one |
| 401 / 403 | Bad key or no access | Stop trying the other models on that provider (they share the account) and pause it for an hour |
| 404 | Model removed | Pause for an hour and log it |
| Other | Transient | Try the next model, then the next provider |

Two details make this work. First, an account-level error (401/403/429) **breaks out of the per-model loop** — retrying other models on a key that is wrong or exhausted just burns time. Second, a daily limit is detected from the response *text*, with `x-ratelimit-reset` used when present, so a provider that is out of quota is skipped for hours rather than retried every request.

Blocked state is a `Map` of provider → `{ until, daily }`. `availableProviders()` simply filters it by the current time. There is also a live test command and dashboard button that sends a tiny request to each provider and resumes any that were paused automatically, while leaving manual pauses alone.

## Streaming for Slow Models

Reasoning models can think for a minute before saying anything. A normal request with a short timeout would abort them. For heavy questions the request sets `stream: true` and reads the server-sent-events response chunk by chunk, keeping the connection alive and concatenating only `delta.content`. Reasoning chunks are ignored, and any `<think>…</think>` text that leaks into the content is stripped. Heavy requests get a longer timeout and a much larger token budget, since thinking tokens count against `max_tokens`.

## A Bug That Only Appeared With Emoji

Replies are trimmed by character count in several places. Cutting a string in the middle of an emoji leaves a **lone UTF-16 surrogate**, and some APIs reject a JSON body containing one with an unhelpful error. It only happened occasionally because only some cut points land inside an emoji. The fix was a tiny `wellFormed()` helper that strips unpaired surrogates from every message before the request is serialised. If you truncate strings that may contain emoji, do it on code points or sanitise afterwards.

## Budget and Fairness

The chain protects against provider limits; a separate daily budget protects the *whole* system from any one user. Everyone has cooldowns and a burst mute, there is a concurrency cap, and the daily total has a reserve so the owner can always get through. When the budget is exhausted, the bot replies with a short "limit reached" message instead of calling any provider.

## What I Would Improve

- Persist the blocked map so a restart doesn't forget a provider is out of quota.
- Track per-provider latency and prefer the faster healthy one, not just the first.
- Add automated tests around `blockProvider` — it's one of the most consequential functions in the file, and the project has no test script wired up yet.
