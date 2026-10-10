---
title: "Building IronStride — A Local-First Training PWA With No Backend"
description: "Notes from building IronStride, an installable, offline-first training app on IndexedDB: dates as plain keys, a programme stored as data, an insights engine of pure functions with minimum-data guards, a backup that respects browser limits, and the bugs that only tests and a real browser found."
metaDescription: "A dev log on building a local-first PWA with React, TypeScript and Dexie: date handling, a typed programme, pure-function insights, service worker updates, folder backup, accessibility audits and small CI-gated PRs."
date: "2026-10-10"
tags: ["PWA", "React", "TypeScript", "IndexedDB", "Dexie", "Vitest", "Accessibility", "Dev Log"]
published: true
---

I wanted a training log with three properties that most apps trade away: it works with no signal, it never sends my data anywhere, and it never tells me something it cannot back up. That combination removes the backend, which sounds like less work and is really the opposite. A server quietly absorbs a lot of rigour — migrations, transactions, validation, one place where "now" is defined — and without one, all of it has to live in the client and be tested there. **IronStride** is what came out: an installable PWA on React, TypeScript and Dexie, built as roughly forty small pull requests.

## The Data Layer Is the Product

Everything lives in IndexedDB through Dexie, behind one versioned schema and a thin set of typed repositories. Three rules did most of the work. Records get stable ids and writes are upserts, so a double tap on "Start workout" resumes the existing session instead of creating a second one. Anything derived — daily nutrition totals, streaks, weekly distance — is calculated from source records and never stored, so it cannot drift out of sync. And targets that change over time, like a calorie goal, are stored with an effective date, so editing one never rewrites the past.

Reads go through `dexie-react-hooks` live queries, which means a screen re-renders the moment a record changes anywhere. That removed an entire category of "refresh after save" code.

## Time Is the Hard Part

The first thing I wrote was a date module, before any screen. Every date in the app is a local calendar key like `2026-10-12`, and all arithmetic converts to UTC, adds days, and converts back. A day can then never gain or lose an hour in a daylight-saving change, a late-night log lands on the day it was made, and "the 365-day heatmap" is just a list of 365 keys. The tests deliberately sit on the awkward dates: leap day, year end, and the weekends clocks change.

## The Programme Is Data, Not Code

The 26-week plan is a typed table: distances per session, interval and tempo work that changes one variable at a time, recovery weeks every fourth week, and gym templates whose main lifts stay fixed inside a block so progress is measurable. A small planner does three things: it scales run distances *down* (never up) to match the user's current weekly base, it maps workouts onto calendar dates including mid-week starts, and it layers the user's edits over the default plan as separate override records. The default programme is never mutated, so "reset this run to the plan" is deleting one row.

Streaks follow the same honesty rule. They count consecutive *planned* sessions that were completed, not consecutive calendar days, so a planned rest day cannot break one and a rescheduled session only counts if the log names the session it replaces.

## An Insights Engine Made of Pure Functions

The dashboard's numbers come from a module of pure functions with no storage and no UI:

- **Training load** compares the last seven days with the average of the previous four weeks, an acute:chronic style ratio, and classifies it as lighter, steady, building or spike.
- **Strength** uses the Epley formula for an estimated one-rep maximum, flags lifts that have not improved over three sessions, and lists lifts where every set reached the top of the rep range, which is the trigger for double progression.
- **Body** fits a least-squares slope through weekly average weights and, with enough food logged, estimates maintenance calories as intake minus the energy implied by the weight change.

The rule that shaped everything: **every function must say "not enough data" instead of guessing.** Each has a documented minimum, such as three runs before a load ratio or ten logged days before an energy estimate. A generator turns the results into short cards with a tone and a text label, so colour is never the only signal.

Writing the tests for that generator found two real design flaws. With no logs at all it reported "several planned sessions were missed", which is true arithmetic and a terrible message, since "skipped" and "never recorded" are indistinguishable. Consistency is now judged only from the day the first session was logged. And a "too much hard running" warning fired permanently for anyone following the plan exactly, because a plan with two quality runs a week is only about 58% easy by distance. It now compares against the plan's own easy share instead of a generic guideline.

## Bugs That Only Showed Up When I Ran It

A few that unit tests on pure functions would never have caught:

- **A controlled checkbox read after an `await`.** The handler read `event.target.checked` inside an async callback; by then React had already reset the controlled input, so it always read "unchecked" and reminders could never be enabled. Read the value first, then go async.
- **"Undo last water entry" removed a random entry.** Dexie returns rows in primary-key order, and the keys were random UUIDs. The test passed by luck on one run and failed in CI. Entries now carry a timestamp and undo sorts by it.
- **Stale snapshots clobbering each other.** Two quick edits wrote back copies taken at render time, so the second overwrote the first. Edits are now read-modify-write inside a transaction.
- **Floating point in an ETA.** A division that should be exactly seven, `4.2 / 0.6`, evaluates to 7.000000000000001 in JavaScript, and rounding up turned seven weeks into eight. Round first, then take the ceiling.
- **A layout bug in one tab.** A 365-day heatmap forced its card, and the whole page, to 1054 px on a 412 px screen, because grid children default to `min-width: auto`. The fix was `min-width: 0` on the cards so only the heatmap scrolls. I reproduced it in headless Chrome at phone size before fixing it, and measured the page width on every screen afterwards.

## Offline and Updates, Verified Rather Than Assumed

A manifest, maskable icons and a Workbox service worker make the app installable. Two decisions mattered. The service worker precaches static assets only, so user records never enter a cache. And updates use a *prompt* strategy: a new version waits until the user taps Refresh, because reloading under someone in the middle of a workout is worse than running an old build for a day.

I verified the update flow with two real builds served by a small no-cache static server: publish 0.1.1 underneath a running 0.1.0, and check that the banner appears, the page keeps the old version until Refresh is pressed, and the data survives the reload. My first attempts failed, and the failures were all in my test rig — `vite preview` caches files in memory, and `npx` overrides the version environment variable I was setting. A good reminder to doubt the harness before the code. I also re-checked offline mode after adding route-level code splitting, since a lazy chunk that was not precached would break a deep link without a network.

## A Backup Inside the Limits of a Browser

Browser storage is not a vault, so I wanted an automatic backup — but a web app cannot run on a schedule in the background or silently read a folder it was not pointed at. So the design works within that. The user picks a folder once, using the File System Access API (feature-detected, never assumed). When the app opens and when it is left, it rewrites the same `ironstride-backup.json`, keeps the previous version beside it, and writes CSV copies for spreadsheets. Files are written through a stream that swaps in on close, so a failure cannot leave half a file.

The important rule is what it refuses to do: an empty database, such as a fresh reinstall, must never overwrite a populated backup. The folder handle lives in its own tiny database that restore and reset never touch, and on a fresh install the first screen offers "restore from backup folder." Where the API does not exist, the app says so and falls back to a once-a-day reminder with a one-tap save, rather than pretending it can do more. I tested the real file-writing path in Chrome by handing the app a genuine browser directory in place of the system picker, then wiping its databases and restoring from that folder.

## Accessibility and Design, Measured

Design tokens drive a dark and a light theme, and I computed the WCAG contrast ratio of every text and icon colour against all four surface levels before using it — the first audit still found three real failures, which the same numbers fixed. Each area of the app (strength, running, nutrition, body) gets its colour from a single data attribute and one CSS variable, so no screen needed hand-styling. An axe-core audit in real Chrome at phone width reports zero violations on every screen, and the same engine runs inside the test suite to catch structural regressions in CI. Motion is small, and everything animated switches off under `prefers-reduced-motion`.

## Small PRs, a Hard Gate

Each feature was a branch, a commit, a pull request and a squash merge, with CI running format, typecheck, lint, the test suite (about 480 tests with Vitest, Testing Library and `fake-indexeddb`) and a production build before anything reached `main`, which deploys automatically. It is slower than committing straight to the main branch and much easier to reason about, and it meant a regression always had a one-feature diff to blame.

## What's Next

Unit conversion for miles and pounds, an optional nutrition layer on the heatmap, and more depth in the insight rules as real data accumulates. The part I would keep in any future project is the stance behind it: with no server to lean on, the quality of a local-first app is decided by how honestly its data layer, its calculations and its tests handle the cases where the data is thin.
