---
title: "IronStride"
description: "A local-first, installable training PWA with no backend — a typed 26-week gym-and-running programme, set-by-set logging, nutrition tracking, and an insights dashboard whose every number is computed by pure, tested functions. Data lives in IndexedDB, works fully offline, backs itself up to a user-chosen folder, and ships through small, CI-gated pull requests."
metaDescription: "Local-first React + TypeScript PWA on IndexedDB (Dexie): typed 26-week training programme, workout and run logging, nutrition tracking, an insights dashboard built on pure functions, offline support, and automatic folder backup."
date: "2026-10-10"
tags: ["React", "TypeScript", "Vite", "PWA", "IndexedDB", "Dexie", "Workbox", "Vitest", "Accessibility", "GitHub Actions", "Vercel"]
github: "https://github.com/simplysandeepp/ironstride"
featured: true
priority: 9
---

## Overview

IronStride is a training log that treats the browser as the whole stack. It is an installable Progressive Web App with no server, no account and no analytics: every record lives in IndexedDB on the device, the app shell is cached by a service worker so it opens offline, and an optional automatic backup writes a versioned JSON file (plus CSV copies) to a folder the user chooses. On top of that sits a 26-week hybrid gym-and-running programme, set-by-set workout logging with progression hints, a run logger, nutrition and body-weight tracking, a 365-day activity heatmap, and a four-tab insights dashboard. Built in small branches, each landed through its own pull request behind a CI gate of format, typecheck, lint, tests and a production build — over forty PRs in all.

## The Problem

Most fitness apps want an account, a subscription and a data trail, and then ask you to trust their charts. The brief here was the opposite: a tool for one person that works on a phone with no signal, never sends data anywhere, keeps working after a browser update, and — the harder requirement — never shows a number or an insight it cannot defend. That ruled out a backend, and it made the data model, the calculations and the testing discipline the actual project, with the UI downstream of them.

## What I Built

**A local-first data layer with one schema and typed repositories.** Dexie wraps IndexedDB behind a versioned schema (eleven stores) and a thin set of repositories: upserts by stable id so a double tap can never create a duplicate, date-indexed queries, and live queries through `dexie-react-hooks` so screens update the moment a record changes. Nutrition targets are stored by effective date, so changing a target never rewrites history.

**Time handled as a first-class problem.** Every date is a local calendar key (`YYYY-MM-DD`) and all arithmetic runs in UTC on those keys, which removes daylight-saving and timezone off-by-one errors by construction. A week is Monday to Sunday, the 365-day heatmap window is computed from keys, and the tests cover leap years, year boundaries and DST changeover dates.

**The programme is data, not code.** The 26 weeks are a typed table — run distances per session, interval and tempo progressions that change one variable at a time, recovery weeks, and gym templates whose main lifts stay fixed within a block. A planner scales distances down (never up) to the user's current weekly base, maps programme workouts to calendar dates, and layers user edits on top as separate override records, so the default plan is never mutated. Streaks are defined on *planned* sessions rather than calendar days, so rest days cannot break them.

**An insights engine made of pure functions.** Training-load ramp (the last 7 days against the average of the previous 4 weeks), pace trends weighted by distance, effort discipline, estimated one-rep maxes by the Epley formula, stalled and ready-to-progress lifts, weekly hard sets per muscle group, a least-squares weight-rate slope, and a maintenance-calorie estimate. Each function returns null below a documented minimum amount of data, and a generator turns them into plain-language cards with a tone and a text label. Tests caught two fairness bugs before release: the generator used to report "missed sessions" for someone who had not logged anything yet, and it compared running intensity to a generic guideline instead of the plan's own easy share.

**Installable and offline, with a safe update path.** A web manifest with maskable icons, a Workbox-generated service worker that precaches static assets only (user data is never cached), and an update prompt that waits for the user instead of reloading mid-workout. The update flow and an offline deep link to a lazy-loaded route were each verified end to end in a real browser with two successive builds.

**Backup that respects what a browser can actually do.** An optional folder backup uses the File System Access API: the handle is kept in its own small database, the same file is rewritten each time the app opens, the previous version is kept as a safety copy, and an empty or freshly reinstalled database can never overwrite a fuller backup. Where the API is missing, the app says so and falls back to a daily reminder with a one-tap save. Import validates against a versioned schema, previews what will change, and applies in a single transaction so a failure leaves existing data untouched.

**A design system and an accessibility pass measured, not assumed.** Design tokens drive a dark and a light theme; every text and icon colour was checked for WCAG AA contrast on all four surfaces before use; area colours (strength, running, nutrition, body) come from one data attribute and one CSS variable. An axe-core audit in real Chrome at phone width reports zero violations on every screen, and the same engine runs in the test suite so structural regressions fail CI. Motion is subtle and disappears under `prefers-reduced-motion`.

## Tech Stack

**Framework:** React 19, TypeScript (strict), Vite, React Router

**Data:** IndexedDB through Dexie with a versioned schema, `dexie-react-hooks` live queries, an isolated store for the backup folder handle

**PWA:** `vite-plugin-pwa` / Workbox (`generateSW`, prompt-on-update), maskable icons, route-level code splitting that stays fully available offline

**Quality:** Vitest, Testing Library and `fake-indexeddb` (roughly 480 tests), axe-core, oxlint, Prettier, `puppeteer-core` for real-browser verification at 412 px

**Delivery:** GitHub Actions (format, typecheck, lint, test, build) on every PR, squash merges to `main`, automatic deploys on Vercel

## What It Demonstrates

Treating "no backend" as a design constraint that pushes rigour into the places a server would normally hide it: a schema with explicit migrations, atomic writes, deterministic ids, calculations that are pure and unit-tested, and a UI that refuses to display a conclusion the data cannot support. It also shows the engineering habits around the code — small reviewable PRs, a green gate on every merge, accessibility measured in a real browser, and bugs found by tests and by actually running the app rather than assumed away.

## Status

In active use and still evolving. The core app, offline support, backup and restore, the insights dashboard and the accessibility pass are all shipped and deployed. Source code is on GitHub (link above).
