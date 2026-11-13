---
title: "Constraining an LLM Lyricist — Length Budgets, Optional Dependencies and Model Fallbacks"
description: "Design notes from Echo Echo's lyrics pipeline: a CrewAI agent whose prompt budget scales with track duration, importing a heavy dependency optionally, normalising section tags for a downstream model, and chaining generation backends so one failing service doesn't break the app."
metaDescription: "Practical LLM agent design for lyric generation — duration-based length limits, optional CrewAI import, lyric tag normalisation for ACE-Step and layered generation fallbacks."
date: "2026-06-20"
tags: ["CrewAI", "LLM", "Groq", "Python", "Prompt Design", "Fallbacks", "Dev Log"]
published: true
---

A lyric generator is a good example of a task where "the model can do it" is the easy part and *constraining the output so the rest of the system can use it* is the work. This post covers how Echo Echo's lyrics step is set up, and how it fits with the music generators it feeds.

## One Agent, One Task, One Job

The lyrics step is a single CrewAI `Agent` (role: *Lyricist*, `allow_delegation=False`) given a single `Task`, run through a one-agent `Crew`. It would be easy to over-build this into a multi-agent graph; a single agent with a precise task is simpler, cheaper and easier to debug. The model is a small, fast Groq-hosted Llama model, chosen by checking whether a Groq key is present.

## The Prompt Is a Contract

The task prompt is built from track metadata — title, mood, genre, BPM, duration, theme, instruments and the music prompt — followed by hard rules:

- lyrics must fit inside the duration,
- a **maximum line count**,
- use section labels,
- no single-paragraph output and no full song for a short preview,
- short, singable lines,
- "Return only formatted lyrics" and avoid quoting or imitating existing songs.

The line budget is computed from the duration, not left to the model: 8 lines for tracks up to 30 seconds, 16 up to 60, 24 up to 90 and 48 beyond. The same number appears in both the instructions and the `expected_output`. **Numbers computed by code and repeated in the prompt** are far more reliable than adjectives like "short". An empty response raises a specific error instead of silently returning blank lyrics.

## Making Heavy Dependencies Optional

CrewAI is a large dependency. The module imports it inside a `try/except ImportError` and sets the names to `None` if missing; each function that needs it raises a typed `LyricsGenerationError("CrewAI is not installed.")`. A lean cloud deployment can then ship a smaller requirements file (the repo has separate deploy and full requirements) and the app still starts — the feature just reports that it's unavailable. The same pattern is used for the optional Gradio client and for local MusicGen.

## Normalising Output for the Next Model

LLMs return section headers in many forms: `[Verse 1]`, `[CHORUS]`, `Pre-Chorus:`, `Hook`. The ACE-Step vocal model expects a specific lowercase tag format. `_format_lyrics` handles it in layers: regexes collapse numbered or mixed-case headers to `[verse]`, `[pre-chorus]`, `[chorus]`, `[bridge]` and so on (mapping "hook" to chorus); if the text is already in the right shape it's returned unchanged; otherwise a line-by-line pass converts plain-text section headings; and empty input becomes a safe instrumental placeholder. A cheap, deterministic adapter between two probabilistic components is one of the best reliability investments.

## Layers of Generation Backends

The app has more than one way to produce audio — a hosted music API, a hosted open model reached through a Hugging Face Space, and an optional heavy local model — and a commit near the end fixed the **local model fallback** and the lyric refinement path. The shape is the useful part: each backend is a separate module with the same kind of inputs, timeouts are configured per backend (the Space client uses a long HTTP timeout and the duration is clamped to a valid 10–240 second range), and failures are caught at the boundary so the user gets a message instead of a stack trace.

## Honest Limits

- An LLM given a line limit will sometimes exceed it; for strictness, post-validate the line count and truncate or retry.
- "Avoid imitating existing songs" in a prompt is a request, not a guarantee. That's why the product has a separate copyright-risk checking agent rather than trusting the lyricist.
- Free-tier model hosts rate-limit and change; the provider name and model should stay configuration.

## Takeaways

1. Compute constraints in code and put the number in the prompt.
2. Import heavy libraries optionally and fail with a typed error.
3. Write small deterministic adapters between model outputs and the next model's input format.
4. Keep generation backends behind a uniform interface so failures degrade gracefully.
