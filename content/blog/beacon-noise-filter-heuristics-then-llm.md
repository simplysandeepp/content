---
title: "Separating Signal From Noise in Project Chatter — A Two-Phase Heuristic and LLM Classifier"
description: "How Beacon's noise filter works: cheap regex and rule heuristics decide the obvious cases in parallel, only ambiguous chunks go to batched Groq LLM calls, a confidence threshold routes uncertain labels to human review, and a local keyword fallback keeps the pipeline alive without an API key."
metaDescription: "A two-phase text classifier for requirements extraction — parallel heuristics, batched LLM calls with rate-safe concurrency, confidence thresholds and a local fallback."
date: "2026-06-05"
tags: ["LLM", "Classification", "Python", "Groq", "Pydantic", "Rate Limiting", "Dev Log"]
published: true
---

Beacon is a team project that turns scattered project messages — Slack threads, emails, meeting notes — into a draft Business Requirements Document. Before any document can be written, you have to decide which messages **matter**. A lot of workplace chatter is "ok thanks", calendar invites and automated mail. This post covers the noise filter that sits at the front of the pipeline, and the engineering decisions around cost, rate limits and uncertainty.

## Five Labels and a Chunk

Every message is a *chunk* and gets exactly one label (a Pydantic enum):

`requirement`, `decision`, `stakeholder_feedback`, `timeline_reference`, or `noise`.

The model also stores a confidence (0–1), a short reasoning string, the speaker and a source reference, so every downstream statement can be traced to a message. A chunk labelled `noise` is auto-suppressed, but a `manually_restored` flag lets a human override that — suppression is a default, not a deletion.

## Phase 1: Free Decisions First

Calling an LLM for every message is slow, rate-limited and wasteful when many messages are trivially junk. So phase 1 is a rule engine, run across all chunks in a thread pool (8 workers, since it is CPU-bound):

- **System mail** (auto-generated notifications) — by pattern on the text or the sender → noise.
- **Short social filler** under ten words ("sounds good!") → noise.
- **Meeting logistics.** Strict patterns such as dial-in details are noise *unless* they also contain a project-timeline phrase. Weaker "meeting" patterns are noise only when the message is short (under 50 words), so "let's discuss the requirements in the meeting on Monday…" isn't thrown away.
- **Ultra-short** messages under a minimum word count → noise.
- **Project deadlines** matching a timeline pattern → `timeline_reference`.
- Anything else returns `None`: *inconclusive, ask the model.*

The important design property is that the heuristics are **conservative in both directions** and have an explicit "I don't know" output. A rule that guesses is worse than one that defers. The "unless it's a project deadline" exceptions exist precisely so that real signal isn't thrown away by the meeting rules.

## Phase 2: Batched LLM Calls, Rate-Safe

Inconclusive chunks go to the model in batches of 10. Two batches run concurrently in a small thread pool, then the loop sleeps a second before the next pair. That is a simple form of rate control: **concurrency is capped, and the pause happens between groups rather than between individual calls**, which keeps throughput up while staying under requests-per-minute limits. Batching also cuts the per-message overhead of the prompt, since one prompt carries ten messages.

The LLM responses are parsed as JSON and mapped back to the original chunk positions, and results are reassembled **in the original order** so the output doesn't depend on which batch finished first.

## Phase 3: What To Do With Uncertainty

An LLM label with no calibration is dangerous, so confidence drives behaviour:

| Confidence | Behaviour |
|---|---|
| ≥ 0.85 | Accept automatically |
| 0.55 – 0.84 | Accept, but **flag for review** |
| < 0.55 | Keep the label, flag for review, and annotate the reasoning as low-confidence |

Note the last row: a low-confidence chunk is *not* forced to `noise`. Quietly discarding something the system isn't sure about is the failure mode that hurts a requirements tool most, because a missed requirement is invisible.

## When There Is No API Key

If no key is configured, the classifier falls back to a local keyword classifier — sets of signal nouns ("dashboard", "integration", "endpoint"), requirement verbs ("must", "shall", "support"), and hints for timeline, decision and feedback. Its outputs get fixed low confidences (about 0.58 and 0.52) and are always flagged for review. This lets the app be developed and demoed offline, and it fails *visibly* instead of labelling everything as noise.

## Testing Data

The module has a parser for the public Enron email corpus, which is a convenient realistic source of messy business email to test on without using anyone's private data. Each decision is also logged with its path (heuristic or LLM), label, confidence and reasoning, which makes it possible to audit why a chunk was suppressed.

## What I'd Improve

- Measure precision and recall on a hand-labelled sample rather than judging by feel.
- Tune the heuristic word-count thresholds from data.
- Make the keyword fallback configurable per project vocabulary.
