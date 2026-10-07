---
title: "Echo Echo"
description: "An AI music generation platform — multi-agent LLM orchestration (CrewAI + Groq Llama 3.1) composes 30-second instrumental sketches via the Suno v4 API, generates thematically aligned lyrics, and scores every output through an automated copyright-similarity detection pipeline."
metaDescription: "An AI music generation platform — multi-agent LLM orchestration composes instrumental sketches and lyrics, then screens output for copyright similarity."
date: "2025-11-01"
tags: ["Python", "FastAPI", "CrewAI", "Groq Llama 3.1", "Suno v4 API", "Three.js", "Render"]
github: "https://github.com/simplysandeepp/Consolidated-EchoEcho"
live: "https://consolidated-echoecho.onrender.com"
demo: "https://youtu.be/UgNzkq5tmv8?si=HSPlegNlbyoBbeTE"
featured: false
---

## Overview

Echo Echo is a full-stack **AI music generation platform** that turns mood, genre, tempo, and free-text prompts into original, copyright-safe instrumental tracks. A multi-agent LLM pipeline handles composition, lyric writing, and copyright risk scoring end-to-end — from a guided 8-step generation flow in the browser to a downloadable MP3/WAV with a shareable public link and QR code.

## Architecture

- **FastAPI + Uvicorn backend** exposing async REST endpoints for generation, library management, and auth
- **Multi-agent orchestration with CrewAI** — specialized agents powered by **Groq Llama 3.1** handle lyric composition and thematic alignment against the user's mood/genre/theme inputs
- **Music synthesis via the Kie.AI (Suno v4) API**, producing ~30-second instrumental sketches in real time
- **Automated copyright-similarity detection** — every generated track is scored against known material before it reaches the user's library
- **Vanilla JS frontend with Three.js** for 3D visuals; guided step-by-step generation UX (mood → genre → tempo → prompt)
- **Invite-only authentication** with email/password login
- **One-click Render deployment** via `render.yaml` with environment-based configuration

## Features

- 8-step guided composition flow with 17+ genres and mood/tempo presets
- Personal track library with playback, trimming, download (MP3/WAV), and play history
- Shareable QR codes and public links per track
- Real-time "now composing" generation feedback
- Tiered usage plans (free monthly generations through unlimited)

## What It Demonstrates

Integrating multiple third-party AI APIs behind one coherent product: agentic LLM workflows, generative audio, similarity scoring as a safety layer, and a deployed, auth-gated product UI — all shipped on cloud infrastructure.
