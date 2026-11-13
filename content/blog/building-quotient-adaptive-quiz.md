---
title: "Building Quotient — Shipping an Adaptive Quiz in Small Phases (and the Build I Broke)"
description: "Build notes for Quotient, a gamified cognitive self-insight app: how a two-day build was split into phase-sized pull requests, what the architecture looks like, and why a green `tsc` plus passing unit tests was not enough to notice a broken build."
metaDescription: "Dev log for an adaptive cognitive quiz built with Next.js, Prisma and SQLite — phase-by-phase PRs, the architecture, and the lesson of verifying with a full production build."
date: "2026-09-12"
tags: ["Next.js", "TypeScript", "Prisma", "SQLite", "Testing", "CI", "Dev Log"]
published: true
---

**Quotient** is a small cognitive self-insight web app: an adaptive quiz over eight domains, a results reveal, a plain-language report and a chatbot. It is a self-reflection toy, not a clinical test, and I try to say that everywhere it appears. This post is the overview of how it was built; two deeper posts cover the scoring maths and the AI/deployment pieces.

## Phases as Pull Requests

The whole thing was planned as numbered phases, each landed as its own branch and PR:

| Phase | What landed |
|---|---|
| 0 | Next.js + TypeScript + Tailwind scaffold |
| 1 | Prisma schema, migration, seed script |
| 2a / 2b | Adaptive session engine and API routes; unstyled test-taking UI wired end to end |
| 3 | Scoring engine and results page |
| 4a–4d | Theming, page restyle, confetti/sound/streaks, badges and interstitials |
| 5a–5c | Rule-based report, LLM rewrite pass, report UI and PDF export |
| 6–9 | RAG pipeline, chatbot, dashboard, radar chart, tests |

The point of "unstyled UI wired end to end" in phase 2b is deliberate: get one real answer all the way from a button click to the database and back before spending an hour on styling. Styling is cheap to change later; a wrong data flow is not.

## The Shape of the App

- **Next.js App Router** with route handlers for sessions, questions, users and chat.
- **Prisma 7 + SQLite** for users, sessions, responses, scores and norm buckets. Prisma 7 needs an explicit driver adapter for SQLite, and I pinned to the last stable release after `latest` resolved to a release candidate.
- **Pure functions for the interesting logic.** The staircase, score normalisation, report generation and retrieval are plain TypeScript modules with unit tests (seven Vitest files). The database-touching wrapper is thin.
- **Zustand** for client state, **Recharts** for the radar/progress charts, **Framer Motion** for transitions, and a theme system built from CSS custom properties with `[data-theme]` blocks.

One small design choice I liked: sound effects are generated with the Web Audio API instead of audio files. I had no licensed sound assets, and a procedural tone is a few lines of code with no download.

## The Build I Broke

This is the part worth being honest about. One session used an automated pass to push a long list of tiny PRs (responsiveness, PWA, content, tests). Several of them were not real implementations — they appended comment lines or empty stubs. Two were actively harmful:

- `globals.css` got `//` line comments appended. Those are not valid CSS, and the PostCSS step failed the whole build.
- `layout.tsx` had code appended after the component's closing brace, including a bare `navigator.serviceWorker` reference that throws when a Server Component is imported.

Both slipped through because my checks were `tsc --noEmit` and the unit tests. Neither builds CSS, and neither complains about unreachable code after a `return`. The practical result was that the main branch could not deploy for a long run of commits, and the failed preview deploys were quietly using up the free-tier quota.

Recovery was: delete the stub files, fix the syntax, build the real PWA pieces properly (manifest, a cache-first service worker for static assets only, explicitly bypassing `/api/*` because session data is live), and run a real Lighthouse audit instead of writing "score 95+" in a commit message.

## What I Changed Afterwards

- **Verification bar:** every PR must pass a full `pnpm build`, not just typecheck and tests.
- **Read the diff, not the title.** A commit message that says "mobile responsiveness" can be a one-line comment.
- **Claims need evidence.** If a note says a feature exists, there should be a file I can open.

## What's Still Rough

The question bank is small and hand-written, so attempts repeat. The cohort baselines are synthetic. Both are fine for a demo and both are the first things I would fix before anyone treated the numbers seriously.
