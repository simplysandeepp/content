---
title: "Camio"
description: "A self-hosted, multi-camera, multi-user security camera platform — Next.js + MediaMTX + ffmpeg, WebRTC/HLS streaming behind auth, reachable from anywhere over a private Tailscale network instead of any cloud service."
metaDescription: "Self-hosted multi-camera security app — Next.js + MediaMTX, WebRTC/HLS behind auth, reachable anywhere over Tailscale. No cloud, no open ports, no subscription."
date: "2026-08-28"
tags: ["Next.js", "TypeScript", "MediaMTX", "WebRTC", "ffmpeg", "Tailscale", "Node.js", "Security"]
github: "https://github.com/simplysandeepp/camio"
featured: true
priority: 2
pinned: true
---

## Overview

Camio turns any machine with a webcam into a private, login-protected security camera — reachable from a phone anywhere in the world, with zero monthly cost, zero cloud dependency, and zero public network exposure. It's a full-stack home-lab project: a Next.js web app, a self-managed media server pipeline (MediaMTX + ffmpeg), a from-scratch authentication system, and a private mesh network (Tailscale) standing in for what a commercial security-camera SaaS would otherwise charge a subscription for.

The entire system runs on hardware I already own — a Mac for development, an Ubuntu machine as the always-on production target — and connects only over a WireGuard-based private network. There is no third party in the video path at any point.

## The Problem

Commercial "smart" security cameras (Ring, Nest, Wyze) all share the same trade-off: your camera feed is a monthly subscription, and your video passes through someone else's cloud before you ever see it. I wanted the opposite — a camera I fully own, running on hardware I already have, that I can watch from my phone from anywhere, with the video never leaving a network I control.

That constraint shaped almost every architectural decision in the project: no cloud video relay, no paid tunnel service, no public-facing ports on the router.

## What I Built

**Core streaming pipeline** — ffmpeg captures the local camera (`avfoundation` on macOS, `v4l2` on Linux — the exact same application code runs on both, switched by a single environment variable) and publishes to [MediaMTX](https://github.com/bluenviron/mediamtx), a media server that re-serves the feed as both **WebRTC** (via WHEP, sub-second latency) and **HLS** (a few seconds of latency, universally compatible, the guaranteed fallback). MediaMTX itself is bound to `127.0.0.1` only — it is never reachable from outside the machine directly.

**A same-origin reverse proxy in front of the media server** — the Next.js app is the *only* thing exposed on the network. Every HLS playlist, every video segment, and the WebRTC signaling handshake are proxied through auth-guarded API routes rather than exposing MediaMTX's ports. The raw stream literally cannot be reached without a valid login session, even on the local network.

**Authentication built from primitives, not a library** — scrypt password hashing via Node's built-in `crypto` (no native dependency, no bcrypt), signed HS256 session JWTs via `jose` (verified in Edge middleware, so the check runs before any page even starts rendering), httpOnly cookies, and a login rate-limiter keyed on the *account* rather than the client IP (a client-supplied `X-Forwarded-For` header is spoofable with no reverse proxy in front — a mistake I made and later fixed, see below).

**Multi-camera and multi-user support**, both designed so that a single-camera, single-user setup — the common case — needs zero configuration changes. Adding a second camera means setting one environment variable to a JSON array; the pipeline spins up an independently-supervised ffmpeg process per camera, so one flaky USB camera crashing doesn't take the whole system down. Adding a second user works the same way — a JSON list of accounts, falling back to the original single-user config if unset.

**Remote access via Tailscale**, not a cloud tunnel. The production machine joins a private WireGuard mesh network; only devices signed into that same private network can reach it at all — no router port-forwarding, no public DNS record, nothing internet-facing to attack in the first place.

**Full production-readiness pass**: `systemd` units for 24/7 operation on Ubuntu with automatic restart on crash and on boot, a GitHub Actions CI pipeline (lint, typecheck, test, build on two Node versions), a `node:test` suite covering the security-critical logic, and — notably — a deep, dedicated security/correctness/scalability audit I ran against my own v0.1.0 release before calling it done.

## The Audit

Rather than assume the first working version was secure, I ran a structured, multi-pass audit against it — security, correctness, and scalability reviewed independently — and fixed every real finding before the next release. Some of what surfaced:

- **A rate-limiter bypass.** The original login rate limiter was keyed on the client-supplied `X-Forwarded-For` header — trivially spoofable by rotating the header value on each request, since there's no reverse proxy in front to make that header trustworthy. Rewrote it to key on the account instead, with IP-based limiting only activating behind an explicit `TRUSTED_PROXY` flag.
- **A stale-closure bug in the video player.** The WebRTC-to-HLS fallback logic read React state from inside a `setTimeout` closure that never re-evaluated, so the fallback could fire twice — leaking one media player instance while a second one silently fought it for control of the same `<video>` element. Fixed by moving the guard into effect-scoped mutable flags instead of React state.
- **Missing defense-in-depth on the stream routes.** Route protection relied entirely on Next.js middleware; I added a second, independent session check directly inside each stream-proxy route handler, so a middleware misconfiguration alone could never expose video.
- **An unhandled crash path.** A correct password combined with a missing `SESSION_SECRET` environment variable threw an unhandled exception instead of a clean error — fixed with explicit config validation before the credential check runs.

I treated my own project the way I'd want a security review to treat someone else's — and shipped the fixes as a proper version bump (v0.1.0 → v0.2.0) with full release notes.

## A Real-World Debugging Story

The most instructive bug didn't show up in any test — it only appeared when I actually tried to log in from my phone over Tailscale, and the "Sign in" button did *nothing at all*. Every `curl` test I'd run against the server had returned exactly the right response, which made the bug invisible to server-side testing.

The actual cause: the Content-Security-Policy header I'd added during the audit didn't allow `eval()` — and Next.js's **development server** internally uses `eval()`-based source maps for hot-reload. Mobile Safari enforced that CSP correctly and silently blocked every script on the page from executing. The HTML rendered fine; the JavaScript simply never ran, so no click handler ever attached to the button. `curl` never caught it because `curl` doesn't execute JavaScript or enforce CSP — the exact thing that was broken.

I found it by reading the server's live request logs while reproducing the failure on the actual phone: the login POST request never arrived at the server at all, only page loads. That one fact — a missing request, not a wrong response — pointed straight at a client-side execution failure rather than anything server-side. The fix: allow `unsafe-eval` in the CSP only when `NODE_ENV !== 'production'`, so the actual production deployment (the real security posture that matters) stays fully locked down.

It's a good example of why testing a real user-facing feature over its real transport (a mobile browser, a real network, a real CSP-enforcing client) catches an entire category of bug that server-side testing structurally cannot.

## Tech Stack

**Frontend / App:** Next.js 15 (App Router), React 19, TypeScript, native `RTCPeerConnection` (WHEP) with `hls.js` fallback for the live player

**Auth:** `node:crypto` (scrypt), `jose` (HS256 JWT), Edge middleware route guard, per-route defense-in-depth session verification

**Media pipeline:** ffmpeg (cross-platform camera capture), MediaMTX (WebRTC/HLS media server, localhost-bound), per-camera supervised child processes with exponential backoff

**Networking:** Tailscale (private WireGuard mesh) — no cloud relay, no public ports

**Tooling:** Biome (lint), `node:test` (unit tests), GitHub Actions (CI on Node 20 & 22), `systemd` (24/7 production supervision on Ubuntu)

## Use Case

Anyone who wants a real security camera over a room, a doorway, or a workspace — without a monthly subscription, without their video routed through a third party's cloud, and without exposing a single port to the public internet. Built first for personal use (watching a room from anywhere on a phone), designed from the start to scale to multiple cameras and multiple household accounts without needing to be rebuilt.

## Status

Production-ready and running 24/7. v0.2.0 shipped with the full security-hardening pass, multi-camera and multi-user support, CI, and a technical README. Actively extending it next into a proper cross-platform desktop installer (Electron) so setup becomes a real double-click installer rather than editing configuration files by hand — being built as a companion repo, `camio-desktop`, that wraps this app rather than forking it.
