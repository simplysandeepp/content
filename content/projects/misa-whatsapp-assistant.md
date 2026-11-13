---
title: "Misa — WhatsApp Assistant Bot"
description: "A Node.js WhatsApp assistant built on Baileys with a multi-provider free-tier LLM chain, per-user rate limiting and a daily request budget, prompt-injection and leak guardrails, TTL-based MongoDB memory, natural-language reminders, and an admin dashboard — designed to run at zero cost."
metaDescription: "WhatsApp chatbot in Node.js with Baileys, an automatic LLM provider fallback chain, rate limits and a daily budget, guardrails, MongoDB TTL memory and an admin dashboard."
date: "2026-10-12"
tags: ["Node.js", "Express", "Baileys", "MongoDB", "LLM", "Prompt Injection", "Rate Limiting", "Render", "chrono-node"]
featured: false
---

## Overview

Misa is a WhatsApp chatbot I run as a personal assistant. It is a long-running Node.js service that stays connected to WhatsApp through the Baileys library, decides which messages deserve a reply, calls a language model, post-processes the answer, and keeps a small, privacy-conscious memory in MongoDB.

The engineering goal was a **bot that costs nothing to run and degrades gracefully**: it uses only free-tier model endpoints, switches providers automatically when one is rate-limited, caps its own daily usage, and never exposes its own setup. The repository is private, so this page describes the design rather than linking to code.

## What It Does

- **Message gating:** drops system events, replays, duplicates and its own messages; in groups it only continues when tagged or replied to
- **Provider fallback chain:** several free-tier LLM providers tried in order, with automatic pausing on rate limits and bad keys
- **Rate limiting and budget:** per-sender cooldown, burst muting, concurrency limits and a daily request budget with a reserve for the owner
- **Guardrails:** forged-header sanitising, secret/internal-question detection before the model is called, and an output filter that blocks leaks
- **Reply planning:** length classes, a hint mode for long problem statements, a repeat-avoidance tracker and response cleanup
- **Reminders:** natural-language reminders ("tomorrow 9am …") parsed to a time and text with `chrono-node`
- **Scheduled messages:** a small scheduler plus an external cron endpoint, with the decision logic split into pure, testable functions
- **Admin dashboard:** usage meters, a kill switch, feature flags, provider status and a live provider test

## How It Works

1. A message arrives from WhatsApp and is filtered, sanitised and classified.
2. Slash commands and reminder phrases are handled without the model.
3. Guardrails check whether the question is about the bot's internals; if so it gets a canned deflection and never reaches the LLM.
4. Limits and the daily budget are checked.
5. A reply is planned, the provider chain is called, and the answer is cleaned, validated and shaped.
6. Memory is marked dirty and saved with a short debounce, and also flushed on shutdown.

## Tech Stack

**Runtime:** Node.js, Express 5, `@whiskeysockets/baileys`, `pino`

**Data:** MongoDB via Mongoose (auth state, bot state, TTL-expiring recap lines and contacts, reminders)

**AI:** OpenAI-compatible chat endpoints from multiple free-tier providers, with streaming for slow reasoning models

**Hosting:** Render, with a self keep-alive ping and graceful shutdown handling

## Notes

The bot is intentionally small in scope and I treat it as an ongoing experiment in running LLM features reliably on free infrastructure, not as a finished product.
