---
title: "Building Aegis — A Guardrail Gateway You Can Actually Measure"
description: "Notes from building a two-tier LLM guardrail gateway and the 127-case red-team harness that scores it — the escalation-router design, a streaming guard that catches leaks spanning chunk boundaries, and the calibration bugs that fell out of actually running it."
metaDescription: "Notes from building an LLM guardrail gateway and the red-team harness that scores it — the escalation router, a streaming guard, and the calibration bugs that fell out of running it."
date: "2026-09-09"
tags: ["LLM Security", "Next.js", "TypeScript", "Prompt Injection", "Groq", "Dev Log"]
published: true
---

Wanted a genuine answer to a question that comes up in every LLM app conversation: if you put a
guardrail in front of a model, does it actually work, or does it just look like it does? Built
Aegis to answer that — a gateway that detects prompt injection, secret/PII leakage, and
exfiltration on both sides of the call, and a red-team harness that measures it against a
hand-authored attack corpus rather than taking the gateway's word for it.

## The Core Design Decision: Two Tiers, Not One

The naive options both fail. Rules-only regex matching misses anything that depends on intent
rather than surface pattern — "how do I defend against prompt injection?" and "ignore all previous
instructions" share vocabulary but not intent, and no regex tells them apart reliably. Always
calling an LLM to judge every request is accurate but slow, expensive, and burns a free-tier daily
quota in an afternoon of testing.

So: nine deterministic detectors run on every request in sub-millisecond time and combine into a
single score via noisy-OR (`1 - Π(1 - weight_i)`, so independent weak signals accumulate rather than
needing one detector to be fully confident alone). Two policy-configured thresholds partition the
score into confident-allow, confident-block, and an escalation band in the middle — only requests
landing in that band pay for an LLM-tier judge call. Measured: 22–28% escalation rate, 72–78% fewer
judge tokens than an always-LLM baseline, 0% attack success rate on the shipped policies.

## The Bug the Escalation Band Found

Building the corpus and harness surfaced a real calibration bug, not a code bug. A test asserting a
specific multi-signal attack should land above the block threshold failed at 0.7986 against a 0.80
threshold. The cause: a single detector's contribution is capped at `score × severityWeights.high =
0.8`, so a case relying on one high-severity detector could never reach a `critical`-gated
threshold no matter how confident that detector was. Fixed by promoting severity to `critical` when
three or more independent injection families co-occur with a combined score above 0.85 — multiple
weak-to-moderate signals agreeing is itself a strong signal, and the router now treats it as one.

## The Streaming Guard: Chunk Boundaries Are the Whole Problem

A secret or an exfiltration URL doesn't respect where the tokenizer decides to split a streamed
response. A naive per-chunk scan checks each chunk in isolation and misses anything straddling a
boundary — I kept `scanPerChunk` in the codebase specifically as a test fixture proving this, next
to the real implementation that withholds the last N characters and rescans the *entire*
accumulated text on every new chunk. On a trigger it aborts the upstream call, discards the
withheld tail (where the leak lives), and closes the stream with a clean refusal.

The trade-off is real and I measured it rather than asserting it: a 240-character window adds
roughly 75ms to time-to-first-token at a generation rate this build actually observed against
Groq's free tier; a 1024-character window adds roughly 290ms. Smaller window, faster first token,
smaller margin against a leak that's longer than the window. That's a policy knob now, not a
hardcoded constant.

## The Mock Provider Almost Lied to Me

`--mock` mode needed to work with zero API keys so CI never touches the network — but a mock that
just refuses everything reports a perfect 0% attack success rate and proves nothing. So the mock
models a genuinely injection-susceptible target: it complies with a bare instruction-override
attempt, and complies less often when spotlighting or sandwiching is active, so mitigation
comparisons have something real to measure.

That realism cut both ways. Early runs showed an 11–23% false-positive rate that looked too high —
turned out the mock was treating any text containing "system prompt" as an attack, including
benign questions like "is a system prompt a security boundary?" It needed the same
performing-versus-discussing distinction the real detectors make, or the offline false-positive
rate was measuring the mock's crudeness, not the guard's behavior. Once fixed, the measured
permissive → balanced → strict trade-off came out exactly where it should: 14.5% ASR / 2.3% FPR →
0% / 11.4% → 0% / 22.7%. A clean monotone curve like that from a corpus that size is a good sign
the scoring itself isn't the thing that's broken.

## Never Hardcode a Model ID

Groq deprecates models with no warning, so every model ID in the repo is resolved live at build
time from the provider's own API and written to one generated file with a timestamp — never typed
from memory anywhere else in the codebase. Getting the resolver's own selection logic right took
two passes: comparing version numbers across model families ranked a Qwen 3.8 build above a GPT-OSS
build on numeric version alone, and matching model names by substring meant "gemini" scored as a
"lite" model because it contains the string "mini." Fixed both with token-based, family-scoped
matching instead of naive string comparisons.

## Deploying: SQLite Meets Serverless

Shipped it to Vercel expecting a config change and nothing more. `better-sqlite3` works fine there —
Node runtime, native modules are supported — but the filesystem is read-only everywhere except
`/tmp`, and `/tmp` isn't durable across cold starts. The gateway and playground work exactly as they
do locally; the dashboard's traffic history resets periodically because of where the database
physically lives. Documented rather than hidden — swapping in a real hosted Postgres or LibSQL store
is next.

## What's Left

The harness is built to answer questions it hasn't been given the quota to answer yet: where the
escalation band should actually sit across live models rather than the mock, how much each
mitigation buys per attack family rather than in aggregate, and how well any of this generalizes
across model families. The corpus and scorer are built for exactly that kind of ablation — just
needs the runs.
