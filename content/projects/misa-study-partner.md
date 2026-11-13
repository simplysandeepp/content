---
title: "Misa — AI Study Partner"
description: "A small Django chat application with streaming LLM responses over server-sent events, session-backed memory across multiple independent chat tabs, a landing page, and a one-file Render deployment — a compact exercise in building the whole loop from model call to UI."
metaDescription: "Django study-partner chatbot with SSE streaming responses, per-session multi-chat memory, a vanilla JS UI, OpenRouter free models and Render deployment."
date: "2026-08-29"
tags: ["Python", "Django", "Server-Sent Events", "OpenRouter", "LLM", "JavaScript", "Render"]
featured: false
---

## Overview

Misa is a study-partner chatbot: a Django back end that proxies a language model, a plain HTML/JavaScript front end that renders replies as they stream in, and a sidebar for keeping several independent study threads. It is deliberately small — the whole back end is a single view module of about 140 lines — and it was a way to understand the full request path of a streaming chat app without a framework doing it for me.

It began as a ten-line script calling an LLM API, moved into Django, and grew one feature per pull request. The repository is private, so this page describes the design.

## What It Does

- **Streaming replies:** tokens appear as they are generated, using server-sent events from a Django `StreamingHttpResponse`
- **Multiple chats:** a sidebar to create, switch, clear and delete study threads, each with its own context
- **Session memory:** conversation history is stored in the Django session, so a page reload restores the chat without accounts or a custom model
- **Markdown rendering** of answers, including code blocks
- **Persona:** a system prompt tuned for clear, encouraging study help that stays concise on simple greetings
- **Landing page** at `/` with the app at `/app/`
- **Deployed on Render** with a build script and a `render.yaml`

## How It Works

1. The browser POSTs a message and a chat id to `/chat/`.
2. The view appends it to that chat's history in `request.session` and opens a streaming request to OpenRouter.
3. Each streamed chunk is parsed and re-emitted to the browser as an SSE `data:` line.
4. When the stream ends, the assembled reply is appended to the history and the session is saved explicitly.

## Tech Stack

**Back end:** Python, Django 6, `requests`, `python-dotenv`, Gunicorn

**Front end:** HTML, CSS and vanilla JavaScript with a Markdown renderer

**AI:** OpenRouter with free-tier models (the model was changed several times as free limits and availability shifted)

**Hosting:** Render

## Honest Notes

This is a learning prototype, and I would not run it as-is for real users. Known gaps: some endpoints are CSRF-exempt, debug mode and a permissive host list are still on in settings, the session grows without a cap, and there is no retrieval or document grounding despite the repository's original name. A hardening pass is described in the accompanying blog post.
