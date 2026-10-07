---
title: "NoLoop Dev Log — Migrating the Backend from NestJS to FastAPI"
description: "One big day on NoLoop: kicked off the NestJS → FastAPI migration with 4 verified PRs, planned 14 issues of roadmap, deployed the admin dashboard, and earned some hard-won pgbouncer and timezone lessons."
metaDescription: "One big day on NoLoop: kicked off the NestJS → FastAPI migration, planned 14 roadmap issues, deployed the admin dashboard, and hard-won pgbouncer lessons."
date: "2026-07-15"
tags: ["NoLoop", "FastAPI", "Python", "Migration", "PostgreSQL", "Dev Log"]
published: true
---

Big day on NoLoop. Here's everything that shipped.

## Kicked Off the Backend Migration: NestJS → FastAPI

I decided to move the entire backend to Python — **FastAPI + SQLAlchemy 2.0 async** — so the whole data + AI layer lives in one ecosystem. One rule for the migration: **the frontends must not notice**. Same routes, same response shapes, same JWT contract.

Four PRs merged today, each verified against the live system before merging:

- **PR #1 — Scaffold**: FastAPI app, pydantic-settings config, async engine on Supabase's pooler, and a `/health` endpoint with a real DB round-trip.
- **PR #2 — Models**: all 12 tables + 11 enums mapped 1:1 onto the existing Prisma-created schema — zero DB migration, verified by querying every table live.
- **PR #3 — Auth**: signup/login/me, JWT with an identical payload, and passlib verifying the old bcryptjs hashes so existing users keep logging in. Error bodies are NestJS-shaped.
- **PR #4 — Org + Admin**: ran both backends against the same DB with the same tokens and diffed responses — **8/8 byte-identical**, including 401/403 error shapes.

**PR #5 (claims + AI client)** is code-complete and pushed — read-parity passed 7/7 (all 56 claims, full detail shapes, public tracking) — held open until the mutation tests run.

## Gotchas Earned Today

- **pgbouncer in transaction mode** needs `NullPool` **and** unique prepared-statement names — `statement_cache_size=0` alone is not enough.
- **Naive datetimes without a trailing `Z`** silently shift every timestamp by 5½ hours in the browser.
- **Error bodies are a contract.** My frontend reads `data.message`, so FastAPI now speaks Nest's error dialect.

## Planned the Whole Road Ahead — 14 Detailed GitHub Issues

Everything from finishing the migration to production hardening is now on the board:

- Async task queue — retries, idempotency, DLQs
- The RAG centerpiece — pgvector, hybrid retrieval, citation-grounded answers, an eval set
- Render + Vercel deploy, observability, rate limiting, CI/CD
- DB scaling + a backup restore drill, k6 load testing, Redis caching

## Deployed the Admin Dashboard 🚀

Live on Vercel with a custom domain set up via the CLI: [noloop-admin.sandeepp.in](https://noloop-admin.sandeepp.in). Proper README + MIT license added. All changes shipped through 3 small branch → PR → merge cycles.

## The Multi-Repo Scare

Also survived a classic: I accidentally worked in a fork of the team's org repo instead of my personal one. Caught it, swapped to the right repo, redid the work cleanly — and wrote down the rule:

> Check `git remote -v` before pushing. Always pass `--repo` to `gh pr create`.
