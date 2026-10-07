---
title: "Liquid Onyx Clock"
description: "A glassmorphic PWA with a clock, timer, and stopwatch — built around a smooth liquid dark aesthetic with offline support."
date: "2024-11-01"
tags: ["React 19", "TypeScript", "Vite", "Tailwind CSS", "PWA"]
github: "https://github.com/simplysandeepp/Liquid-Onyx-Clock"
live: "https://liquid-onyx-clock.vercel.app"
featured: false
---

## Overview

A premium, glassmorphic clock experience built around a smooth liquid-dark aesthetic — with a clock, timer, and stopwatch, fullscreen screensaver behavior, and installable PWA support. Designed to look beautiful as a desk-display screensaver and work fully offline.

## What I Built

**Three working modes:**
- **Clock** — large central digital clock with date, and a 12h/24h toggle persisted in localStorage
- **Timer** — presets (5m/15m/30m/1h) plus custom minutes, start/stop/reset, and an audio alert on completion
- **Stopwatch** — start/stop/lap/reset, a timestamped lap list, and **export laps to `.csv` or `.txt`**

**Experience:**
- Liquid, glossy dark visual system with an animated gooey background
- Hamburger control panel with mode switch, theme switcher, and clock format
- Fullscreen support with keyboard shortcuts, scaling the display larger while running
- **Wake Lock** integration for immersive, always-on fullscreen use

**PWA:**
- Installable on desktop, tablet, and mobile via `vite-plugin-pwa` (service worker + manifest)
- Offline caching, app icons, maskable icon, and Apple touch icon

## Persistence

Theme, clock format, recent timer durations, and stopwatch lap history are all saved to `localStorage`.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS

**PWA:** vite-plugin-pwa (service worker, web manifest, Wake Lock API)

## Use Case

A beautiful, installable clock/timer/stopwatch for a desk display or focus sessions — works offline and runs fullscreen as a screensaver.
