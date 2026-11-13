---
title: "Roadmaps"
description: "A minimalist Next.js app that turns a folder of markdown files into browsable learning roadmaps — about 94 role and skill tracks with topic pages, curated resources and search — read directly from the file system at build time, with no database or CMS."
metaDescription: "Minimalist Next.js roadmap viewer that parses markdown at build time into role-based learning tracks, with topic pages, resource links and search. No database."
date: "2026-09-20"
tags: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS 4", "Markdown", "Static Generation", "Vercel"]
github: "https://github.com/simplysandeepp/roadmap"
featured: false
---

## Overview

Roadmaps is a small, content-driven Next.js app: each roadmap is a folder of markdown files, and the app renders it as a browsable track where every topic opens to a description and a list of curated resources. There is no database and no CMS — the pages are produced from the files at build time.

**Attribution matters here.** The learning content under `roadmaps/` comes from the open-source [developer-roadmap](https://github.com/kamranahmedse/developer-roadmap) project and is *not* my work; it is used under that project's license, and the repository documents this. What I built is the application: the content loader, the parsing, the pages, the search and the styling. I'm including it because it is a clean example of a file-based content pipeline, not because I wrote the roadmaps.

## What It Does

- **Roadmap index** listing roughly 94 tracks, with title-casing rules that handle acronyms and product names (AWS, MLOps, Node.js, ASP.NET Core)
- **Roadmap page** with a topic timeline and client-side search
- **Topic pages** rendering markdown (GitHub-flavoured) with a typed list of resources, each with an icon by resource type
- **Content hygiene at parse time:** links back to the original source site are stripped from resources and rewritten to plain text in prose
- **Static output:** every route is generated from the file system, so hosting is trivial

## How It Works

1. `lib/roadmaps.ts` scans `roadmaps/<slug>/content/*.md`.
2. Each topic file is parsed: the first `# ` line becomes the title; lines in the pattern `- [@type@Label](url)` become structured resources; the rest is the description.
3. Duplicate topic slugs are collapsed, and results are memoised per build with React's `cache()`.
4. App Router pages render the roadmaps, timeline and topics from those typed objects.

## Tech Stack

**Framework:** Next.js 15 (App Router), React 19, TypeScript

**UI:** Tailwind CSS 4, `lucide-react`, `react-markdown` with `remark-gfm`

**Hosting:** Vercel (zero-config)

## Notes

The security bump of Next.js to a patched version was its own commit, and the project's licence covers only the application code. Topics are currently listed alphabetically rather than in a pedagogical order.
