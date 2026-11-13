---
title: "LeetCode Daily Check-in Bot"
description: "A dependency-free Node.js script and GitHub Actions workflow that checks, via LeetCode's GraphQL API, who has solved the daily challenge and posts a status summary to Telegram at a precise time — with retries, honest 'could not verify' handling and a design that works around late scheduled runs."
metaDescription: "Node.js GitHub Actions bot that queries LeetCode GraphQL for daily-challenge completion and posts to Telegram, with retries, UTC boundaries and sleep-until-send scheduling."
date: "2026-09-19"
tags: ["Node.js", "GitHub Actions", "GraphQL", "Telegram Bot API", "Automation", "Cron"]
github: "https://github.com/simplysandeepp/leet-automation"
featured: false
---

## Overview

A small automation I built to keep a study streak going: every evening it checks which of a configured list of LeetCode accounts have solved the **daily challenge** and posts a summary — completed, still pending, and "couldn't verify" — to a Telegram chat.

It is one 195-line script with no npm dependencies (Node 20's built-in `fetch`) plus a GitHub Actions workflow that runs it. It is small on purpose, and I like it as an example of the unglamorous parts of automation: time zones, flaky APIs and not drawing a false conclusion from missing data.

## What It Does

- Queries LeetCode's public GraphQL endpoint for the active daily challenge and each user's recent accepted submissions
- Marks a user **completed** only if there is an accepted submission for *that* problem on or after the challenge's UTC start of day
- Posts a formatted message to Telegram through the Bot API
- Distinguishes three states — completed, pending, and **unavailable** — so a hidden profile is never reported as "pending"
- Supports a `DRY_RUN` mode that prints the message instead of sending it
- Can also trigger a separate reminder service on a schedule (see the workflow)

## Engineering Notes

- **Retries with backoff:** each GraphQL call is attempted up to three times with an increasing delay and a 15-second timeout.
- **Empty is not the same as no:** LeetCode sometimes returns an empty list for a public profile, so an empty result is retried before the user is marked unavailable.
- **Explicit time boundary:** the challenge date is parsed as `YYYY-MM-DDT00:00:00Z`, so the "did they solve it today" check doesn't depend on the runner's time zone.
- **Concurrent checks:** users are checked in parallel with `Promise.all`, with each failure isolated to that user.
- **Scheduling around GitHub's delays:** scheduled workflows can start hours late, so the workflow starts early, sleeps until the exact send time, and uses backup cron entries with a concurrency group so duplicates are skipped.

## Tech Stack

Node.js 20 (no dependencies), GitHub Actions (scheduled and manual dispatch), LeetCode GraphQL, Telegram Bot API

## Notes

It relies on an undocumented public endpoint, so it can break without notice. Usernames and tokens are supplied through environment variables and repository secrets; none are stored in the code.
