---
title: "Vrows"
description: "An installable PWA browser front end backed by a Cloudflare Worker that fetches pages, rewrites every URL to stay inside the proxy, keeps per-site cookie jars, blocks ad and tracker requests, and detects downloadable media — built to understand how a rewriting web proxy works."
metaDescription: "A rewriting web proxy on Cloudflare Workers with an installable PWA front end — HTMLRewriter URL rewriting, cookie isolation, ad blocking, SSRF guards and media detection."
date: "2026-10-10"
tags: ["Cloudflare Workers", "JavaScript", "HTMLRewriter", "PWA", "Web Proxy", "Security", "Service Worker"]
github: "https://github.com/simplysandeepp/vrows"
featured: false
---

## Overview

Vrows is a small installable web app for browsing through a Cloudflare Worker that I deploy to my own free account. The app is a PWA with an address bar, back/forward, bookmarks and history; the Worker does the real work — fetching the requested page and rewriting it so every link, script, image and form keeps flowing through the proxy.

It is a learning project about the surprisingly intricate mechanics of a **rewriting proxy**: URL mapping, cookies, redirects, client-side navigation and request filtering. Heavy, script-driven sites are an explicit non-goal; the README says so.

## What It Does

- **Path-based proxying** under `/p/<scheme>/<host>/<path>` so relative URLs resolve naturally
- **HTML, CSS and JS rewriting** — Cloudflare's `HTMLRewriter` for markup, regexes for CSS `url()` / `@import`, and a guarded rewrite of `location` assignments in scripts
- **Cookie isolation:** upstream cookies are stored in the browser under a prefixed name per domain, so sites can't read each other's cookies
- **Redirect handling inside the Worker**, with cookies, so cross-domain bounce loops don't leave the proxy
- **Ad and tracker blocking** at the proxy, since the browser's own blockers can't see through a single-origin proxy
- **Media detection and saving** for plain video and audio files found on a page
- **Optional access key** stored in an HttpOnly cookie; open by default if no key is set
- **Safety checks:** refuses non-HTTP schemes, the proxy's own origin, and private or loopback addresses
- **Installable PWA** with a dark galaxy home page and full-screen/rotate support for video

## Tech Stack

**Worker:** Cloudflare Workers (JavaScript modules), `HTMLRewriter`, the Cache API (`cf.cacheEverything` for static assets), Wrangler

**Client:** vanilla JavaScript PWA, service worker, Web App Manifest, a small injected client script for navigation and media detection

## Notes and Limits

Sites that block cloud IP ranges, rely on heavy client-side scripting or use streaming protocols may not work. Routing everything through one origin also concentrates risk, which is why the access key, the blocked-address list and the cookie namespacing exist. Treat it as a technical study, and respect the terms of the sites you visit.
