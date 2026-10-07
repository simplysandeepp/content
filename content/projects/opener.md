---
title: "Opener"
description: "An offline-first Android file explorer, viewer, and editor built directly on the Storage Access Framework — pluggable format handlers, multi-file tabs, biometric app lock, and an entirely opt-in, bring-your-own-key AI layer (chat, inline rewrite actions with a real diff review, and SQLite-FTS5 folder search) that never breaks the no-cloud-by-default promise."
metaDescription: "Offline Android file explorer/editor on the Storage Access Framework, with an opt-in bring-your-own-key AI layer: per-file chat, inline rewrite actions with diff review, and SQLite FTS5 folder search."
date: "2026-10-02"
tags: ["React Native", "Expo", "TypeScript", "Android", "SQLite", "FTS5", "Groq", "Google Drive API", "Jest"]
github: "https://github.com/simplysandeepp/opener"
featured: true
priority: 8
---

## Overview

Opener is a minimalist Android app for browsing, viewing, and editing local files — Markdown, HTML, plain text, CSV, JSON, and code — straight from device storage via Android's Storage Access Framework, with no cloud sync required to use it. On top of that offline-first core sits an entirely optional AI layer: a per-file chat, inline text actions (summarize, rewrite, translate, fix grammar) that return a real diff to accept or reject rather than silently overwriting anything, and a folder-level search layer built on SQLite's full-text index. Built end to end — PRD through a shipped v1.0.0 — in two days, 61 commits, each feature landed through its own branch and PR.

## The Problem

Managing a few hundred local Markdown/HTML/PRD files on a phone (a Galaxy S23 Ultra, specifically) meant bouncing between separate apps for Markdown rendering, HTML preview, and raw text editing — none of which remembered where you were, and none of which let an AI touch a file without first uploading it to someone else's notes service. The brief was one app: fast, ad-free, offline by default, that renders each format correctly and treats AI as something the user opts into on their own API key, not a backend the app's developer runs or pays for.

## What I Built

**A storage layer with one seam.** `StorageProvider` wraps the Storage Access Framework behind a single interface — every other module in the app talks to it, never to `expo-file-system`'s SAF calls directly. Reading copies a SAF `content://` URI to a temp cache file first (Expo's string-read APIs can't read those URIs in place) and cleans it up in a `finally`; writing goes straight through `writeAsStringAsync`. That one seam is what let file operations, tabs, search, and the AI layer all get built without touching storage code again.

**A pluggable file-handler registry.** One `FileHandler` interface (`canOpen` / `render` / optional `edit`) with six concrete handlers — Markdown, HTML, code, CSV, JSON, plain text — registered in a single `index.ts`. Adding a format is a new file, not a change to the viewer screen.

**Per-file AI chat and inline actions, with a real diff review.** A Groq-backed chat bottom sheet is scoped to the open file's content, with a system prompt that gives it an identity ("OpenerAi"), requires it to ground answers in and cite specific parts of the file, and defaults to concise replies unless the user asks for more. Inline actions run the same way on selected text, but the result never overwrites anything directly — it goes through a `DiffReviewSheet` first: an O(n·m) word-level LCS diff that colors added/removed spans inline for short passages, falling back to a plain before/after block above 600 tokens, where the LCS table gets too large to be a responsive UI diff. Nothing is written to disk until the user taps Accept.

**Folder-level "RAG" via SQLite FTS5, because Groq has no embeddings endpoint.** Files in a folder get walked and chunked on paragraph boundaries (~2000 characters, hard-splitting any single oversized paragraph), inserted into a SQLite FTS5 virtual table, and a question becomes a query that OR-matches its own significant words against that index. The top six matching chunks get stitched into a citation-required system prompt — "answer using only these excerpts, cite the file, say so if they don't contain the answer" — before the question ever reaches the model.

**A deliberately narrow Google Drive backup.** Sign-in requests only the `drive.file` OAuth scope, so the app can see files *it* created and nothing else in the user's Drive. It creates a visible "Opener" folder (not the hidden `appDataFolder` — the user can actually look at what got backed up) holding favorites, recents, and preferences. The Groq API key is explicitly never included in any backup payload.

**App lock that actually re-locks.** `expo-local-authentication` gated on `AppState` transitions: backgrounding the app while lock is enabled sets it locked immediately, and returning to the foreground demands a fresh biometric/passcode prompt. Enabling the toggle checks `hasHardwareAsync`/`isEnrolledAsync` first and resolves `false` without silently flipping the setting on if the device has no usable enrollment.

**OS-level integration.** Android intent filters register Opener as a `VIEW`/`SEND` target for `text/plain`, `text/markdown`, and `text/html`, so it shows up directly in other apps' Share and "Open with" menus — and an incoming file lands in the exact same viewer the in-app explorer uses, not a separate code path.

## Shipping the Folder AI Call Honestly

Folder-level indexing measured out at 3–5 minutes on a real folder, stalling around 80–90% of the way through — the SQLite inserts weren't batched into a transaction, and the folder walk made a wasted extra SAF call per file. Rather than ship a slow, half-working feature as if it were finished, the FAB and the `FolderRagSheet` came out of the UI entirely while `src/lib/rag/*`, `useFolderIndex`, and `useFolderRag` stayed untouched and still compile clean — a feature flag by omission, not a half-measure, and straightforward to re-enable once the indexing path is actually batched.

## Tech Stack

**Framework:** React Native 0.86 on Expo SDK 57 (New Architecture enabled), Expo Router, TypeScript strict

**Storage:** Android Storage Access Framework via `expo-file-system`, `expo-sqlite` (FTS5) for the folder index, `expo-secure-store` for the Groq key

**AI:** Groq's OpenAI-compatible API called directly with no SDK — live rate-limit header parsing (`x-ratelimit-*`, shown in-app as "998/1000 requests left · resets in 2m52.8s"), and the model list fetched live rather than a hardcoded ID, since Groq deprecates models without warning

**Auth / Sync:** `expo-local-authentication` for the biometric app lock, `@react-native-google-signin/google-signin` plus raw Drive v3 REST calls scoped to `drive.file`

**Testing:** Jest (`jest-expo` preset) covering the pure lib functions — chunking, FTS5 query building, word-diffing, CSV/MIME parsing, incoming-file-URI detection

## What It Demonstrates

A full mobile app built straight against a platform storage primitive (SAF) instead of a cross-platform shim, with every feature — tabs, search, file ops, AI chat, inline rewrite with a real accept/reject diff, cloud backup — layered on a single storage seam and a pluggable handler registry rather than bolted on ad hoc. And a shipping call made honestly: a feature that worked but was too slow stayed out of the UI rather than shipping half-broken, with the code left intact for when the real fix lands.

## Status

Shipped and in daily use on the author's own device. v1.0.0, built over two days across 61 commits, every feature landed through its own branch and PR rather than directly on `main`. Not on the Play Store yet — distributed via EAS builds/updates for now. Folder-level RAG is implemented and unit-tested but hidden behind a feature flag pending a SQLite-transaction performance fix; tabs, theming, Drive backup, and the full per-file AI layer (chat, inline actions, diff review) are all live.
