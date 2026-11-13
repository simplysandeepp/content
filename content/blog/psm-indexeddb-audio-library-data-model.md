---
title: "Storing a Music Library in IndexedDB — Blobs, Dedupe Hashes and Quota Errors"
description: "How PSM stores an audio library in the browser: splitting metadata, audio blobs and artwork into separate Dexie tables, hashing files to reject duplicates, shrinking cover art on a canvas, and handling QuotaExceededError without corrupting the library."
metaDescription: "A practical look at storing audio files in IndexedDB with Dexie — table split, dedupe hash, transactional writes, art downscaling and quota handling."
date: "2026-11-13"
tags: ["IndexedDB", "Dexie", "PWA", "TypeScript", "Storage", "Dev Log"]
published: true
---

This is the data-model half of building PSM, an offline music player. The question: how do you keep hundreds of multi-megabyte audio files in the browser without making the UI slow or the data fragile?

## Split What You List From What You Play

The first decision was to **never store audio bytes in the same row as metadata**. There are four Dexie tables:

```ts
songs:     '++id, hash, title, artist, album, addedAt, lastPlayed, favorite, folder'
files:     'songId'   // { songId, blob }
art:       'songId'   // { songId, blob }
playlists: '++id, name, createdAt'
```

Listing the library, sorting, searching and building albums only ever reads `songs`. The `files` table is touched in exactly one place: when a track is about to play. If the blob lived on the song row, every `toArray()` would be free to drag megabytes through memory for no reason.

`favorite` is stored as `0 | 1` rather than a boolean because IndexedDB cannot index booleans — a small thing that is easy to learn the hard way.

## Schema Versions Instead of Migrations by Hand

When folder sync was added, songs gained a `folder` field. That is a Dexie `version(2)` that restates only the `songs` store with the new index. Dexie upgrades existing databases on open; there is no manual migration code. For additive changes this is about as painless as client-side storage gets.

## De-duplicating Without Hashing the Audio

Importing the same folder twice should not double the library. Hashing every file's bytes would be accurate but slow on a phone, so the dedupe key is cheap metadata:

```ts
const hashOf = (f: File) => `${f.name}|${f.size}|${f.lastModified}`
```

Before importing, the importer loads every known hash into a `Map`. A match is counted as a duplicate and skipped — except that, when it came from a linked folder, the existing song's `folder` is updated so a later sync still knows where it came from. The trade-off is honest: a renamed file imports again, and two different files that share name, size and mtime would collide. For a personal library that is an acceptable false-positive/negative rate; for anything bigger I would store a content hash lazily.

## One Transaction Per Song

A song is three writes — metadata, blob, art. They happen inside a single `db.transaction('rw', songs, files, art)`. If anything throws, none of it lands, so there is no state where a song row exists with no audio behind it. The player still defends against that case (it skips a "missing" song and moves on), but the transaction makes it rare rather than routine.

One subtle line:

```ts
await db.files.put({ songId: id, blob: file.slice(0, file.size, song.mime) })
```

Slicing the `File` creates a standalone `Blob`. Storing the picker's `File` directly can keep a reference to a temporary file, which iOS is free to clean up. It also lets the importer set an explicit MIME type — `guessMime` falls back to extension when the OS gives an empty type, because an audio element with the wrong type can refuse to play.

## Cover Art Is the Silent Storage Hog

Embedded artwork is often 1000–3000px. Multiply by hundreds of songs and it dominates both storage and memory when you render a grid. The importer decodes the embedded picture with `createImageBitmap`, scales it so the longest side is at most 512px, and re-encodes it as JPEG at quality 0.82 via a canvas. Failure is non-fatal — no art just means a generated placeholder.

Metadata is read with `music-metadata`'s `parseBlob`, with `skipPostHeaders` to avoid scanning to the end of large files. If tags are missing or unreadable, the title falls back to the file name. If the library can't determine a duration, a throwaway `Audio` element probes it with an 8-second timeout so a corrupt file can't hang the import.

## Running Out of Space

The failure mode that matters on a phone is `QuotaExceededError`. The import loop catches it, records `Storage full` against that file, and **stops** instead of grinding through the rest and failing each one. Because each song is its own transaction, everything imported before the limit is intact.

Deleting is the mirror image: one transaction removes the song, blob and art, and also filters the deleted ids out of every playlist so no playlist points at a ghost.

## What I'm Not Sure About

I haven't stress-tested very large libraries, and IndexedDB quotas differ by browser and storage-pressure state. Treat the numbers above as design intent, not benchmarks.
