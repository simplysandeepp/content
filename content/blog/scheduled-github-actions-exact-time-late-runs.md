---
title: "Making a Scheduled GitHub Action Fire at an Exact Time — Late Runs, Backup Crons and Honest Status"
description: "Lessons from a small daily-reminder bot: why GitHub's cron can start hours late, a start-early-and-sleep pattern with a send cutoff, backup schedules protected by a concurrency group, UTC day boundaries for the check itself, and reporting 'unavailable' instead of guessing."
metaDescription: "Reliable scheduled GitHub Actions — compensating for delayed cron, sleep-until-time pattern, backup crons with concurrency, UTC boundaries and honest unavailable states."
date: "2026-09-24"
tags: ["GitHub Actions", "Cron", "Node.js", "GraphQL", "Reliability", "Dev Log"]
published: true
---

The bot is simple: once a day, check who has solved LeetCode's daily problem and post a summary to Telegram. The script took an hour. Getting the message to arrive **at the right time** took longer — and it's a pattern I expect to reuse.

## Problem 1: `schedule:` Is a Hint, Not a Promise

GitHub Actions documents that scheduled workflows can be delayed during periods of high load, and in practice the delay for a given cron entry can be large and inconsistent. If you schedule `0 17 * * *` and need a message at 17:00 sharp, you will sometimes be late, and occasionally a run is skipped entirely.

The workflow here compensates in three ways.

**1. Start early, sleep until the target.** The jobs are scheduled in the afternoon UTC. Each run computes the exact target time, sleeps until it, then sends:

```bash
now=$(date -u +%s)
wake=$(date -u -d "today $WHATSAPP_WAKE_UTC" +%s)
if [ "$now" -lt "$wake" ]; then sleep $((wake - now)); fi
```

A late start only matters if it is later than the target, which a generous lead time makes unlikely. The cost is a runner idling for a few hours, which is fine for a small public-repository job but not something to do casually on a metered plan.

**2. A cutoff.** After a defined time (here, just before midnight in the user's time zone) a late run skips the day instead of sending a message for a deadline that has already passed. A `MAX_WAIT_SECONDS` guard stops a job from sleeping absurdly long.

**3. Backup crons, deduplicated.** Several cron entries one hour apart cover the case where GitHub drops one. A `concurrency` group with `cancel-in-progress: false` serialises them, and a duplicate check makes the later runs no-ops once the message has gone. Redundancy plus idempotency is the usual recipe for unreliable triggers.

## Problem 2: A Manual Escape Hatch

`workflow_dispatch` with a `channel` input (`both`, `telegram`, `whatsapp`) lets me trigger a send immediately. It is an unglamorous feature that pays for itself the first time the schedule misbehaves: you can verify the whole path without waiting for tomorrow.

## Problem 3: Define "Today" Precisely

The check is "did this user solve *today's* problem?". LeetCode returns the challenge date as `YYYY-MM-DD`, and its day is UTC-based. The script builds the boundary explicitly:

```js
Date.parse(`${dateString}T00:00:00Z`)
```

and compares each accepted submission's timestamp to it, **and** matches on the problem's `titleSlug`, so solving a different problem doesn't count. Appending the `Z` is the important part: without it, `Date.parse` interprets the string in the runner's local zone, which can differ between your laptop and CI.

## Problem 4: Don't Guess From Missing Data

LeetCode sometimes returns an empty submission list even for a public profile, and some profiles genuinely hide history. The first version treated "no submissions found" as "pending", which publicly accuses someone of skipping a day because of an API quirk.

The fix has two parts: retry an empty result a few times with backoff (it's often transient), and if it stays empty, report a third state — **"couldn't verify"** — rather than pending. The general rule I took from it: *a missing signal is not a negative signal.* If your automation sends messages to people, the wording and the failure states are part of the design.

## Problem 5: The Flaky Upstream

The GraphQL call has a 15-second abort signal and three attempts with increasing delay (2 s, then 4 s). Each user's check is isolated in a `try/catch`, so one failing profile doesn't prevent the others from being reported. A `DRY_RUN=1` mode prints the message instead of sending it, which made the formatting iterations painless.

## Caveats

- The endpoint is public but undocumented; it can change without notice.
- Sleeping inside a workflow is a workaround. If exact timing really matters, a scheduler that you control — or a small always-on service — is more appropriate.
- Secrets (bot token, chat id, usernames) belong in repository secrets and environment variables, never in the script.

## Takeaways

1. Treat platform cron as approximate; build in a lead time, a cutoff and idempotency.
2. Add a manual trigger early.
3. Put explicit timezone markers on every date you parse.
4. Model "unknown" as a first-class state.
