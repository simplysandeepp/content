---
title: "PSM — Play Some Music"
description: "An offline-first, installable iPhone music player PWA — songs are imported from the Files app into on-device IndexedDB and play with no network, no account, and no tracking, with lock-screen controls through the Media Session API."
metaDescription: "Offline-first iPhone music player PWA built with React, Dexie and IndexedDB — local library, queue, playlists, lock-screen controls, no backend."
date: "2026-11-13"
tags: ["React", "TypeScript", "Vite", "PWA", "IndexedDB", "Dexie", "Zustand", "Workbox", "Media Session API"]
github: "https://github.com/simplysandeepp/psm"
live: "https://psm.sandeepp.in"
featured: false
---

## Overview

PSM is a small music player that runs entirely in the browser and installs to the iPhone home screen as a PWA. You import your own audio files from the Files app, they are copied into the browser's IndexedDB, and from then on playback needs nothing from the network — it works in Airplane Mode. There is no backend, no login and no analytics; the library lives on the device.

It started from a simple itch: a player for a personal collection, with full control over how it looks and behaves. This is the first version, built and shipped in a single afternoon, so I'd call it a solid v1 rather than a finished product.

## What It Does

- Import individual files or a whole folder; tags and cover art are read client-side with `music-metadata`
- Albums, artists, playlists, favourites, search and sort
- Queue with shuffle, repeat (off / all / one), play-next and add-to-queue
- Mini-player and full-screen Now Playing with a pointer-driven seek bar
- Lock-screen and Control Center controls via the Media Session API
- Remembers the last track and position between sessions
- Customisable accent colours and optional ambient player glow

## How It Works

- **Storage:** Dexie wraps IndexedDB with four tables — `songs` (metadata), `files` (audio blobs), `art` (cover thumbnails) and `playlists`. Blobs sit in their own tables so listing the library never touches audio bytes.
- **Import:** each file is hashed as `name|size|lastModified` to reject duplicates, tags are parsed, cover art is downscaled to 512px JPEG, and the song, blob and art are written in one transaction.
- **Playback:** a single `HTMLAudioElement` is driven by a Zustand store. Songs are played from `blob:` object URLs that are revoked on every track change.
- **Offline shell:** a Workbox service worker (via `vite-plugin-pwa`) precaches the app, so the UI itself also loads without a connection.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, lucide-react

**Data:** Dexie (IndexedDB), `music-metadata` for tag and artwork parsing

**PWA:** `vite-plugin-pwa` / Workbox, Web App Manifest, Media Session API, Screen Wake Lock

## Notes and Limits

iOS Safari cannot watch a folder or read arbitrary paths, so new songs are added by tapping **Sync Now** and picking the folder again. Storage is also bounded by what the browser allows for the origin; the importer stops cleanly and reports it if the quota is hit.
