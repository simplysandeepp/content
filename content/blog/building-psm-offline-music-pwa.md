---
title: "Building PSM — An Offline Music Player That Lives Entirely in the Browser"
description: "Notes from building PSM, an installable iPhone music PWA with no backend: why the library lives in IndexedDB, how the app is split into a thin data layer, one audio element and a store, and what a same-day v1 looked like commit by commit."
metaDescription: "Build notes for an offline-first iPhone music PWA — IndexedDB library, a single audio element driven by Zustand, Workbox shell, and a same-day v1."
date: "2026-11-13"
tags: ["PWA", "React", "TypeScript", "IndexedDB", "Dexie", "Zustand", "Dev Log"]
published: true
---

I wanted a music player for my own files that behaved the way I wanted: no ads, no account, nothing that stops working when the signal drops. Existing apps each missed at least one of those, so I wrote **PSM** — a small PWA that installs to the iPhone home screen and keeps the whole library on the device.

This is a write-up of the first version. It was built in one sitting (17 commits; the first landed at 13:12 and the last 47 minutes later), so a lot of what follows is "what the first pass looked like", not a claim of polish.

## The Constraint That Shaped Everything

A PWA on iOS has no file-system access beyond what the user hands it through a file picker. There is no background folder watching and no arbitrary paths. So the design question was not "how do I read the music folder" — it was "how do I make a **copy** of the music the app owns".

The answer is IndexedDB. Every imported song is copied in as a `Blob`. After that the app never needs the original file again, which is exactly what makes Airplane Mode work. The cost is storage duplication, and the README says so plainly: folders can't be watched, you re-pick one to sync.

## Four Layers, Each Small

The code is about two thousand lines of TypeScript and falls into four layers:

1. **`db.ts` — Dexie schema.** Songs, files, art and playlists as separate tables.
2. **`importer.ts` — file → library.** Filtering, hashing, tag parsing, art shrinking, one transaction per song.
3. **`player.ts` — the audio engine.** One `HTMLAudioElement`, one Zustand store, Media Session wiring.
4. **`screens/` and `components/` — the UI.** Home, Library, Playlists, Detail, Import, Settings, plus the mini-player and Now Playing sheet.

The rule I tried to keep: UI components never touch the audio element. They read state from the store and call actions (`playQueue`, `next`, `seek`). Everything stateful about playback is in one file, which turned out to matter a lot once iOS started behaving oddly (covered in the iOS quirks post).

## A Service Worker for the Shell

The audio is in IndexedDB, but the *app* also has to open offline. `vite-plugin-pwa` generates a Workbox precache of the JS, CSS, HTML and icons, with `navigateFallback` pointing at `index.html`. `registerType: 'autoUpdate'` plus `skipWaiting` and `clientsClaim` means a new deploy takes over on the next launch rather than waiting for every tab to close. For a single-user app that is the right trade; for something with unsaved user input I would think harder about it.

## What the Commit Log Says About a Same-Day v1

Reading the log back is humbling and useful:

- The very first commit already had the player, library and import flow.
- The first real bug was **import returning 0 files**: the file input's `FileList` is a live object, and resetting the input to allow re-picking the same file emptied it before the importer read it. The fix was to copy the list into an array first.
- Several commits are tap feedback and seek-bar fixes — the parts a user *feels* — rather than features.
- The app icon was redone three times. Not engineering, but it is the first thing on the home screen.

None of this is clever. It is just an honest picture of what "ship v1 fast" means: get the core loop working, then spend the remaining time on the places where it feels wrong.

## What I'd Do Next

- Cache fewer things in memory and measure re-renders on very large libraries.
- Add an export/backup path for playlists (the audio blobs can't leave the device, but metadata could).
- Measure storage usage per song and surface it in Settings.

If you want the two deeper dives, they are separate posts: one on the IndexedDB data model, one on the iOS audio quirks.
