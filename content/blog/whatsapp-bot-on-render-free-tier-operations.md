---
title: "Keeping a WhatsApp Bot Alive on a Free Host — Reconnects, SIGTERM Flushes and TTL Memory"
description: "Operational notes for a long-running Baileys bot on Render's free tier: reconnect versus logged-out handling, a self keep-alive ping, saving state on SIGTERM, MongoDB TTL indexes for short-lived data, and pure scheduler functions that are easy to reason about."
metaDescription: "Running a Baileys WhatsApp bot on Render's free tier — reconnect logic, keep-alive pings, flush on SIGTERM, MongoDB TTL indexes and testable scheduler logic."
date: "2026-10-27"
tags: ["Node.js", "Baileys", "MongoDB", "Render", "Operations", "Dev Log"]
published: true
---

The interesting problems in a chatbot service are often not about the chat. They are about staying up, not losing state, and not keeping more data than you should. These are the operational decisions behind a small WhatsApp bot running on a free host.

## Reconnect vs. Logged Out

A Baileys socket emits `connection.update`. On `close`, the important question is **why**:

```js
const shouldReconnect =
  lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
```

If it is anything but a logout (network blip, server restart), wait five seconds and reconnect. If it *is* a logout — the linked device was removed from the phone — reconnecting forever with a dead session is pointless and noisy. Originally the service just stopped. The later fix was to **clear the saved login records and start a fresh connection**, so a new QR code appears in the logs and re-linking is a single scan instead of a manual database cleanup.

Auth state is kept in MongoDB, not on disk, because the host's filesystem is ephemeral. That is also why clearing it is a database operation.

## Free Tier Means Sleeping

Render's free instances sleep after about 15 minutes without inbound traffic, which would drop the WhatsApp connection. The service pings its own public URL every 10 minutes when `RENDER_EXTERNAL_URL` is set. It's a pragmatic workaround rather than something I'd rely on for anything important; external uptime monitoring is a cleaner alternative.

Scheduled jobs are also guarded with `if (process.env.RENDER)`, so a local development run can never post to a real chat on its own timer. That one line has prevented at least one embarrassing mistake.

## Flush State When You're Told to Die

Every deploy stops the old instance with `SIGTERM`. The bot's memory — standing rules, modes, recent replies, counters — is saved a few seconds after each reply (debounced to avoid hammering the database). On `SIGTERM` the handler calls `flushMemory()` before `process.exit(0)`, so a deploy right after a conversation doesn't lose the last few changes. It's three lines and easy to forget.

## Data That Expires Itself

Anything that might contain user text is short-lived by design, and the database enforces it:

- **Recent chat lines** used for a "what did I miss" recap are stored with links, long numbers and mentions redacted, and a TTL index deletes them after **48 hours**.
- **Contacts who message the bot directly** keep only a few recent messages (truncated, links removed) and expire **7 days** after the last message, unless explicitly trusted or blocked.

MongoDB TTL indexes mean no cleanup job to write or forget about. The README also states plainly that text placed in a prompt is sent to the model provider, because that is a privacy fact users should know, not an implementation detail.

## Scheduler Logic as Pure Functions

The daily reminder logic is the sort of code that goes wrong on the one day it matters: time zones, restarts, double sends. The decision is kept in two tiny pure functions:

```js
isDue(gate, nowTime, lastDate, today) // switch on, time reached, not already sent today
cronDecision(gate, force)             // should the external cron endpoint run?
```

`lastDate !== today` is what prevents a duplicate send after a restart on the same day. Because they take plain values and return booleans, they can be tested without a clock, a database or WhatsApp. The same functions back the in-process scheduler, the cron endpoint and the dashboard's manual buttons, so there is one definition of "due".

## Reminders From Natural Language

Chat reminders ("tomorrow 9am submit assignment", "10 min baad …") are parsed with `chrono-node`, plus a small layer that maps romanised Hindi time words to English before parsing — "5 baje" becomes "5:00 pm" using nearby period words, with sensible defaults for bare hours. Reminders are bounded (at least 20 seconds ahead, at most 90 days) and all times are interpreted in IST. A 30-second interval checks for due reminders while connected.

## Lessons

1. Distinguish *recoverable* from *terminal* disconnects, and make the terminal path a one-step recovery.
2. Anything the host can kill needs a shutdown flush.
3. Let the database expire short-lived data.
4. Put scheduling decisions in pure functions; keep timers dumb.
