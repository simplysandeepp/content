---
title: "A Database-Free Content App — Parsing Markdown at Build Time in Next.js (and Doing Attribution Properly)"
description: "How the Roadmaps app turns about 94 folders of markdown into a typed, searchable site without a database: a small parser with regexes for resource lines, memoised file-system reads, title-casing rules, and the licensing hygiene of building on someone else's open-source content."
metaDescription: "Build a file-based content site in Next.js — typed markdown parsing, React cache for build-time reads, title casing, and attribution practice for reused open-source content."
date: "2026-09-20"
tags: ["Next.js", "TypeScript", "Markdown", "Static Generation", "Open Source", "Dev Log"]
published: true
---

I wanted to explore a very small architecture: **a content site whose database is the file system**. The Roadmaps app reads about 94 roadmap folders of markdown at build time and renders them as browsable, searchable tracks. The whole data layer is a single 166-line TypeScript file. This post covers how it works, a few details that were fiddly, and the part that matters most when you build on other people's content.

## The Shape of the Data

```
roadmaps/<slug>/content/<topic>.md
```

Each file has a `# Title`, some prose, and usually a list of links in a custom format:

```
- [@article@Some Reading](https://example.com/page)
```

The `@article@` segment is a resource *type* (article, video, course, and so on), embedded in the link text. A parser turns this into typed objects:

```ts
interface Topic { slug; title; description; resources: Resource[] }
interface Resource { type; label; url }
```

## Parsing in Three Rules

`parseTopicFile` walks lines once:

1. If line 0 starts with `# `, that is the title; otherwise the title is derived from the filename slug.
2. A line that matches the resource regex becomes a structured resource. A "Visit the following resources…" lead-in line is dropped.
3. Everything else is the description. Inline tags inside prose are rewritten back into ordinary markdown links.

Doing it with two regexes rather than a full markdown AST is a deliberate trade: the format is regular and the input is trusted, so the simple approach is shorter, faster and easier to debug. If the format were free-form, I'd reach for `remark` instead.

## Small Fiddly Things

- **Duplicate topics.** File names can carry an `@`-suffix, so the loader splits on `@` and keeps the first file per topic slug.
- **Title casing.** Turning `aspnet-core` into "ASP.NET Core" or `mlops` into "MLOps" needs an acronym map plus a short list of full-slug overrides. It is unglamorous, but nothing makes a UI look careless like "Aws" and "Ai".
- **Stable ordering.** Roadmaps and topics are sorted with `localeCompare` so builds are deterministic. The honest consequence is that topics appear alphabetically, which isn't how you'd want to *learn* them — a known limitation, and the next thing to improve with an explicit order field.
- **Memoisation.** Each read function is wrapped in React's `cache()`, so the many pages generated during a build don't re-read and re-parse the same directory repeatedly.

## Why No Database?

For read-only, build-time content, a database adds a service to run, a schema to migrate and a network hop to every page — and buys nothing. Files are versioned by git, reviewable in a pull request, and deployed atomically with the code. The costs are real too: no runtime editing, build time grows with content, and anything per-user needs another solution. For a site like this, it's the right side of the trade.

## Attribution Is Part of the Engineering

The markdown content isn't mine. It originates from the open-source developer-roadmap project, and the repository was set up accordingly. Three decisions worth copying:

1. **Separate licences.** The repository's own licence covers only the application code. The README states that the roadmap content is not original work of this repository and links to the source project and its terms.
2. **Don't present someone else's work as yours.** The project page on this site says the same thing, up front.
3. **Remove what you shouldn't ship.** The parser filters out links pointing back to the original site, rewriting them to plain text, so the app doesn't carry the source's tracking or IDs. That was an explicit commit, made before the app was treated as finished.

A related housekeeping commit bumped Next.js to a patched release after a security advisory. A small project still needs patching.

## Takeaways

- For build-time, read-only content, files plus a typed parser beat a database.
- Keep the parser as simple as the format allows, and write down its limits.
- Do the licence and attribution work at the start; it's much harder to retrofit once a project is public.
