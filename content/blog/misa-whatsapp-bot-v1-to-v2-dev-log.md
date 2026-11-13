---
title: "Misa Dev Log — From a Reminder Script (v1) to a Modular Assistant (v2)"
description: "A version-by-version log of a WhatsApp bot: a small Express reminder service in September, a guarded multi-provider chatbot in October, modular role-based prompts, an admin dashboard, and what each stage taught me about structuring a growing Node.js project."
metaDescription: "Dev log of a Node.js WhatsApp bot evolving from a scheduled reminder script to a modular LLM assistant with guardrails, roles and an admin dashboard."
date: "2026-11-10"
tags: ["Node.js", "WhatsApp", "LLM", "Architecture", "Dev Log"]
published: true
---

Looking back at the commit history of this bot (54 commits between 21 September and 10 November), it split cleanly into versions. This is a short log of what each one was, and the engineering pattern that appeared at each stage.

## v1 — A Reminder Service (late September)

The first commit was an Express server plus a Baileys connection, and the job was small: send a scheduled message. The first week of commits is operational, not clever:

- add crash logging and a reconnect wait to the manual-trigger endpoint,
- add a self keep-alive ping because the free host sleeps,
- make the message template match the one used by an existing reminder script elsewhere.

**Pattern:** a service that runs unattended needs to log its own failures and survive its host's quirks before it needs more features.

## v1.5 — Controls for Humans (October)

Next came preview and test options on the reminder endpoint, so the message could be checked without sending it to a real chat. Small, but it is the origin of a principle used later: every automatic action should have a *dry-run* path.

## v2 — The Chatbot (mid-October)

The chatbot landed in one day and then went through rapid iteration. A few commits describe the technical lessons:

- **Stop bot loops.** The first version could be tricked into replying to chatty senders endlessly, so senders got a cooldown, a burst mute and a single warning per cooldown.
- **Stop calling the API after the free limit.** Once a provider's daily limit is hit, the bot replies with a short limit notice instead of making more calls.
- **Drop duplicate deliveries.** WhatsApp can deliver the same message more than once; the gate dedupes before any model call.
- **Stop echoing the bot's own replies** into the context it uses for later answers.
- **JSON errors from emoji.** Truncated strings could contain a lone surrogate half, which some APIs reject.

**Pattern:** a bot that talks to other systems needs *loop prevention, de-duplication and budgets* before it needs personality.

## v2.1 — Modularising the Prompt

As behaviours multiplied, one giant prompt became unmaintainable. The prompt moved into a `prompts/` folder with roles, shared parts and a build step (`npm run build-prompts`) that generates the final text. A role (`friend`, `study`, `work`, `hybrid`) can be set per chat. Guardrails, hint mode for long problem statements and reply-length planning landed as separate modules (`chat-rules.js`, `chat-modes.js`) instead of more conditionals in `chat.js`.

**Pattern:** when a prompt grows past a screen, treat it like code — split it, name the parts, generate the whole.

## v2.2 — An Admin Dashboard

A small web dashboard, reached through a link sent over a direct message, added usage meters, a kill switch, feature flags and a provider status panel with a live test. The motivation was practical: restarting the service to change a setting is slow, and during rate-limit trouble I wanted to see which provider was paused and why.

**Pattern:** operators need visibility and a kill switch. Build them before the first incident, not after.

## v2.3 — Reliability Polish (late October – November)

The latest commits are all about edges: a manual-run command and dashboard button that call the *same* functions as the scheduler, controls and previews for the personal reminder, and — most recently — clearing a dead login and showing a fresh QR when WhatsApp logs the bot out.

## What the Whole History Shows

- The code grew in the order that failures appeared, which is honest but means some structure was retrofitted. `chat.js` is the clear next candidate to split further.
- There are no automated tests wired into `npm test` yet; pure-function modules like the scheduler decision are ready for them.
- The two most valuable changes were not features: provider fallback and the guardrail layer.

If I started again, I'd write the dry-run path, the budget and the kill switch first.
