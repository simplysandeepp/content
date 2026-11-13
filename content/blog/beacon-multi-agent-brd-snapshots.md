---
title: "Generating a BRD With Parallel Agents — Frozen Snapshots, Explicit Gaps and a Last-Step Summary"
description: "The structure of Beacon's document generator: a frozen snapshot of classified signals, six section agents running in a thread pool with progress events, an executive summary that runs last, and a rule that missing data produces an explicit placeholder instead of invention."
metaDescription: "Multi-agent document generation design — snapshot isolation, parallel agents in a ThreadPoolExecutor, progress events, retry with backoff and explicit insufficient-data placeholders."
date: "2026-06-06"
tags: ["LLM", "Multi-Agent", "Python", "FastAPI", "Groq", "Architecture", "Dev Log"]
published: true
---

Once Beacon has classified a pile of messages into requirements, decisions, stakeholder feedback and timeline references, the second half of the system writes the document. This post is about how that generation is structured. "Multi-agent" here is deliberately unglamorous: each agent is **one Python function** with a clear input and output.

## Agents as Plain Functions

The design notes made a choice early: no classes, no microservices. Each agent is a function that takes a session id and a snapshot id, reads only the signals it needs, calls the model, and writes one BRD section. Six agents write sections — functional requirements, stakeholder analysis, timeline, decisions, assumptions, success metrics — and a seventh writes the executive summary.

Keeping agents as plain functions makes them easy to test with a fake model client, easy to re-run individually (there is a `run_single_agent` for regenerating one section), and impossible to have hidden coupling: **agents never call each other**.

## The Frozen Snapshot

A document run can take a minute, and during that minute new messages may be ingested or a human may restore a suppressed one. If agents read live data, the "functional requirements" section and the "decisions" section could be built from **different views of the world**, and the validator would then flag contradictions that are really just timing differences.

So generation starts by creating a **snapshot**: the ids of all active signal chunks at that moment are stored in `brd_snapshots`. Every agent reads through one function that returns only chunks in that snapshot (optionally filtered by label). The sections it writes are tagged with the snapshot id. It's the same idea as snapshot isolation in a database: a consistent read view for the duration of the job.

## Parallel Where It's Safe, Serial Where It Isn't

The six section agents are independent, so they run in a `ThreadPoolExecutor` (four workers, as the spec called for) and results are consumed with `as_completed`. The executive summary depends on the other sections, so it runs **after** them. The orchestrator `emit`s structured progress events — snapshot created, agents launched, agent started, completed or failed, generation completed — through a callback, which the API turns into a stream for the UI. Reporting is wrapped so an error in the progress callback can never break generation.

If an agent fails, the others continue; the agent writes an error placeholder into its section and the failure is reported as an event. A partially complete document is more useful than a failed job.

## Missing Data Is Not an Invitation to Invent

When an agent finds no relevant signals — say, there is no timeline information in the data — the instruction is to write an explicit placeholder such as "Insufficient data to generate this section" rather than let the model fill the gap. This matters because language models will happily produce a plausible timeline from nothing. The placeholder is also machine-readable: the validator later looks for it and turns it into a "gap" flag (see the validation post).

## A Resilient Model Caller

All agents share one `call_llm_with_retry` function:

- up to three attempts with backoff,
- temperature 0 for reproducible drafts,
- a model name taken from an environment variable with a sensible default,
- optional JSON mode,
- stripping of stray HTML tags the model sometimes emits (while preserving `<https://…>` autolinks),
- removal of internal source-id annotations so they never leak into the final text.

Centralising this means one place to fix when a provider changes behaviour.

## Source Traceability

Each section stores the chunk ids it was built from. That lets the UI show, for any statement, the messages and speakers behind it — the feature that makes a generated BRD reviewable rather than just plausible-sounding.

## What I'd Change

- Parallel agents multiply API calls, so on a free tier the rate limiter matters; a shared token bucket would be better than per-call retries.
- Prompts are long strings inside the pipeline file; moving them to versioned files would make them easier to review and test.
- Add evaluation: compare generated sections against a small set of hand-written BRDs.
