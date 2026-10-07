---
title: "Building This Portfolio — Technical Decisions and What Stuck"
description: "A behind-the-scenes look at the architecture, design decisions, and lessons from building sandeepp.in — a Next.js 14 portfolio with file-based markdown content."
date: "2026-06-26"
tags: ["Next.js", "TypeScript", "Portfolio", "Web Development"]
published: true
---

## Why I Rebuilt It

My previous portfolio was a React + GSAP project that looked impressive on a fast connection and on the right screen size. It didn't meet what I actually needed from a portfolio in 2026: fast, readable, SEO-indexed, and easy to update without touching component code.

The new stack: **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **file-based markdown content**, deployed to Vercel at sandeepp.in.

## The Architecture Decision

The core decision was treating content as files, not database records. Projects and blog posts live as `.md` files in a `content/` directory. `gray-matter` parses frontmatter; `next-mdx-remote` renders the body. No CMS, no API calls, no syncing issues. `git push` is the publish step.

This made the whole system easier to reason about and maintain. Adding a new project is adding a file.

## What Broke and What I Learned

**`output: 'export'` and Vercel don't play together.** Vercel builds Next.js natively — adding `output: 'export'` causes a `routes-manifest.json` error at deploy time because the framework expects to own the build output format. Remove it.

**`@apply` inside `@layer utilities` is flaky.** Moved custom CSS into `@layer components` with plain CSS instead of `@apply`. More predictable, easier to debug.

**`require()` in TypeScript Tailwind config.** Switched from `require("@tailwindcss/typography")` to a proper ESM `import` statement. The `require` call was silently failing in certain build environments.

**`async generateStaticParams`** — wrapping a synchronous function in `async` caused Next.js's static export checker to misidentify it. Sync is correct.

## Design Direction

Clean, typographic, content-first. Inspired by paco.me and leerob.io — sites that trust the content to carry the page without needing animation or decoration to hold attention. The design should be invisible.

Sticky nav, readable body text, consistent spacing. No hero video, no particle backgrounds on this one.

## What's Next

Ongoing project. More posts coming as I keep building things worth writing about.
