---
title: "Quotient"
description: "A gamified cognitive self-insight web app — an adaptive eight-domain quiz, a z-score and percentile reveal, a plain-language report with PDF export, and a RAG chatbot that discusses your results from a local knowledge base."
metaDescription: "Adaptive cognitive quiz built with Next.js, Prisma and SQLite — staircase difficulty, normalised scoring, LLM-restyled report, local-embedding RAG chatbot, PDF export."
date: "2026-09-11"
tags: ["Next.js 16", "TypeScript", "Prisma", "SQLite", "LanceDB", "RAG", "Zustand", "Recharts", "Framer Motion", "PWA", "Vitest"]
github: "https://github.com/simplysandeepp/quotient"
live: "https://quotient-sigma.vercel.app"
featured: false
---

## Overview

Quotient is an interactive self-insight tool: you take an adaptive quiz across eight cognitive domains, get an animated results reveal, read a plain-language report, and can ask a chatbot questions about your own results. It is explicitly an entertainment and self-reflection project — **not** a clinical or diagnostic instrument — and the app says so in the UI, the report and the chatbot's system prompt.

It was built over two days as a sequence of small phase-by-phase pull requests, which made it a good exercise in keeping a feature-rich app understandable.

## What It Does

- **Eight domains:** logical, numerical, verbal, spatial, memory, processing speed, working memory, attention
- **Adaptive difficulty:** a transparent staircase that moves difficulty up after a streak of correct answers and down after misses
- **Scoring:** per-domain raw score → z-score against a cohort bucket → 100/15 display scale → percentile, plus a composite
- **Report:** rule-based plain-language report, with an optional LLM pass that restyles the prose but cannot change numbers
- **Chatbot:** retrieval-augmented, grounded in a local knowledge base and the user's own results
- **Gamification:** badges, streaks, confetti, between-domain interstitials, four selectable themes plus a glass theme
- **Dashboard:** history, progress charts and a radar chart of domains
- **PDF export** of the report, and a PWA shell with offline fallback
- **Accessibility:** skip-to-content link, keyboard navigation, `prefers-reduced-motion` support and AA-contrast theme tokens

## How It Works

1. **Session engine:** each answer is stored with the difficulty it was served at; the next difficulty is computed from that domain's history.
2. **Scoring:** the raw score is the mean *effective difficulty* of a domain's responses, because an adaptive test pushes everyone toward similar accuracy — what differs is the level they settle at.
3. **Report:** a deterministic generator builds the report; an optional OpenRouter pass rewrites only the narrative fields.
4. **Chat:** the question is embedded locally with `all-MiniLM-L6-v2`, searched in an embedded LanceDB store, and the top snippets plus the user's results go into the system prompt.

## Tech Stack

**Frontend:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Recharts, Zustand

**Data / AI:** Prisma 7 with SQLite (driver adapter), LanceDB, `@xenova/transformers` (local embeddings), OpenRouter for the report rewrite and chatbot

**Export / Quality:** `puppeteer-core` with serverless Chromium for PDF; Vitest unit tests for scoring, adaptive logic, report generation and retrieval

## Honest Notes

- The normative baselines are **synthetic and illustrative**, not derived from a real psychometric study, so percentiles are a demo of the maths rather than a measurement.
- The question bank is a seeded set of hand-written items (48 in the first pass, six per domain), so repeated attempts will see repeats.
