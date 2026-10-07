---
title: "Building Opener — A File Explorer That Treats AI as Opt-In, Not the Point"
description: "Notes from building Opener, an offline-first Android file explorer and editor: the storage seam that made everything else easy, a diff-reviewed AI rewrite flow, folder search built on SQLite FTS5 because Groq has no embeddings API, and the honest call to hide a feature that worked but was too slow."
metaDescription: "Notes from building an offline-first Android file explorer with an opt-in AI layer — the storage seam, a diff-reviewed rewrite flow, SQLite FTS5 folder search, and a feature pulled from the UI for being too slow."
date: "2026-10-02"
tags: ["React Native", "Expo", "TypeScript", "Android", "Groq", "SQLite", "Dev Log"]
published: true
---

Had a specific, mildly embarrassing problem: a few hundred local Markdown and HTML files — PRDs, notes, half-finished designs — sitting on a Galaxy S23 Ultra, and no single app that would browse them, render them properly, let me edit one, and remember where I left off, without pulling in ads or a cloud notes account I didn't want. So I wrote the PRD for **Opener**, started scaffolding it in Flutter the way the architecture doc describes, and then just... built it in React Native and Expo instead, because that's the stack I actually move fastest in. The docs still say Flutter. The app has never been Flutter. That's fine — the PRD's job was to pin down what the app had to do, not what it had to be written in.

Two days later: v1.0.0, 61 commits, each one a small branch merged through its own PR.

## The One Seam That Made Everything Else Easy

First real decision: every single thing the app does to a file goes through one `StorageProvider` interface wrapping the Storage Access Framework. Nothing else touches `expo-file-system`'s SAF calls directly. That sounds obvious in hindsight, but the payoff showed up immediately — tabs, search, file create/rename/delete, the AI layer, Drive backup, all got built on top of that seam without a single one of them needing to know SAF exists. The only module that ever has to care that Android file access is weird is the one module whose entire job is caring about that.

It paid for itself early in an annoying way, too: Expo's plain string-read APIs can't read a `content://` URI directly, so `readFile` copies it to a temp cache file first, reads *that*, and deletes it in a `finally`. Get that wrong once in the wrong module and you'd be chasing a `FileNotFoundException` in three unrelated places instead of one.

## AI That Asks Before It Writes

The inline-action feature — select text, tap "Rewrite" or "Summarize" or "Fix grammar," get a replacement back from Groq — was the one place I was most tempted to just overwrite the selection and move on. Didn't, on purpose. Every inline action result goes through a `DiffReviewSheet` before anything touches disk: a word-level LCS diff colors what's added and removed inline, and there are exactly two buttons, Accept and Reject. The diff algorithm is the textbook O(n·m) dynamic-programming LCS — fine for a selected passage, not something you'd run on a whole file, so above 600 tokens it falls back to a plain before/after block rather than building a DP table that's bigger than the phone wants to allocate.

The same "don't just trust the model" instinct shaped the per-file chat's system prompt: it has to ground answers in the actual file content and cite what it used, not free-associate. Small thing, but it's the difference between a chat feature and a chat feature you can trust the answer from.

## No Embeddings API, So Folder Search Became Full-Text Search

Wanted a "chat with your whole folder" feature. Groq doesn't expose an embeddings endpoint, so semantic retrieval was off the table without adding a second provider — which would've meant a second API key, a second settings flow, a second thing to explain in the privacy policy. Instead: chunk every file on paragraph boundaries into ~2000-character pieces, drop them into a SQLite FTS5 virtual table, and turn a question into an FTS5 `MATCH` query that OR's together its own significant words. Pull the top six matching chunks, hand them to the model in a system prompt that says "answer from only these excerpts, cite the file, say so if they're not enough." It's not semantic search — a question phrased with none of the file's actual vocabulary won't match — but it's honest about what it is, and it meant zero new infrastructure and zero new API surface.

## The Feature I Shipped by Not Shipping It

Folder indexing worked. It also took three to five minutes on a real folder and stalled visibly around 80–90% of the way through, because the SQLite inserts weren't wrapped in a transaction and the folder walk was making one extra, wasted SAF call per file just to check something it already had the answer to from the listing itself. I had a choice: ship it as a "beta" feature with a disclaimer, or pull it.

Pulled it. The FAB and the `FolderRagSheet` came out of `index.tsx` entirely — no dead toggle, no "coming soon" label, just gone from the UI. The code underneath (`src/lib/rag/*`, `useFolderIndex`, `useFolderRag`) didn't move and still compiles cleanly; it's a feature flag enforced by omission rather than a conditional, and turning it back on is "fix the transaction batching, add the FAB back" rather than "resurrect a branch." A half-working feature left visible teaches a user not to trust the next feature you ship. Not worth it for something that just needed its SQLite writes wrapped in `db.withTransactionAsync`.

## A "Slow Back Button" That Wasn't About the Back Button

Got a bug report: "back button is slow." The back-navigation logic itself turned out to be fine — what was actually missing was any loading indicator while the new folder's contents came back from SAF, so a perfectly normal (if occasionally slow-on-some-devices) directory read *looked* like a freeze. Added a small spinner next to the folder name during any directory fetch, and the complaint evaporated without the underlying read getting a single millisecond faster. Sometimes the fix for "it's slow" is "it was never fast, it just needs to say so."

While I was in there, I found a real duplicate: entering a folder called `StorageProvider.isDirectory()` to decide "is this a folder or a file," which internally does a full SAF listing — then threw that listing away, changed the root URI, and let `useDirectory`'s effect immediately re-list the *same* folder a second time. Added a `primeFiles` escape hatch so the caller's listing (which it needed anyway) seeds state directly and skips the redundant refetch. Also batched three sequential `AsyncStorage.setItem` calls into one `multiSet` while I was there. None of these were visible bugs on their own — they only showed up once I stopped assuming "not crashing" meant "not wasteful."

## Models Deprecate Without Warning — Verify, Don't Remember

The default Groq model (`llama-3.3-70b-versatile`) got pulled from the API entirely partway through the build — confirmed live, `GET /models` stopped listing it and chat completions against it started 404ing with `model_not_found`. Switched the default to `openai/gpt-oss-120b`, verified against a live call rather than trusted from memory, and the model picker already let users override it to anything `listModels()` actually returns — so the fix was one constant, not a redesign.

## Shipping a Google Login Means Shipping a Privacy Policy

The Drive backup feature needed Google OAuth, which meant an OAuth consent screen, which meant Google wanted a real privacy policy at a real URL before it would stop showing users a scary "unverified app" warning. Wrote one, scoped tightly to what the app actually does: AI features off by default and only send file content to Groq when you explicitly ask something; Drive sync off by default, `drive.file`-scoped so it only ever sees what it created itself, and the Groq key explicitly never included in a backup. Stood up a small GitHub Pages site to host it and the app's own landing page, because "my OAuth consent screen links to a raw file in a GitHub repo" is not a look that inspires confidence in a reviewer — or a user.

## What's Left

Folder AI needs its SQLite transaction fix before it's worth turning back on. No Play Store listing yet — it's an EAS build/update distribution for now, which is fine for a one-person daily-driver app but is the obvious next step if this goes anywhere beyond my own phone. And the thing I keep noticing using it myself: once the AI layer earned enough trust to stop double-checking every rewrite before accepting it, the diff review stopped feeling like friction and started feeling like the reason I trust the feature at all.
