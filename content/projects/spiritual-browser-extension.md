---
title: "Spiritual Browser Galaxy Theme Extension"
description: "A Chrome extension replacing the new tab with a spiritual, distraction-free galaxy experience — zero backend, zero tracking."
date: "2024-10-01"
tags: ["JavaScript", "Chrome Manifest V3", "Canvas", "Jest", "HTML", "CSS"]
github: "https://github.com/simplysandeepp/motivational-theme"
featured: false
---

## Overview

A **Manifest V3 Chrome extension** that replaces the default New Tab page with a calm, spiritual experience — a centered mantra/shlok over an animated cosmic particle background. Lightweight by design: no backend, no analytics, no tracking.

## What I Built

- **New Tab override** via `chrome_url_overrides`
- **Animated canvas particle background** with interactive line connections between particles
- **Hamburger sidebar** with a selectable mantra list and active-state highlighting
- **Multi-line mantra rendering** with controlled layout
- **Preference persistence** via `chrome.storage.local` (with a safe fallback)
- **Tested** with Jest + jsdom, and packaged for the Chrome Web Store

## Tech Stack

**Frontend:** HTML5, CSS3, vanilla JavaScript (no framework)

**Platform:** Chrome Extensions Manifest V3

**Testing:** Jest + jsdom

## Use Case

A distraction-free, peaceful new-tab page for anyone who wants a moment of calm and intention every time they open a browser tab — fully local and private.
