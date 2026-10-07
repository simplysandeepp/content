---
title: "Beacon"
description: "An AI platform that converts unstructured project data — Slack threads, emails, meeting notes — into validated BRD drafts automatically."
date: "2025-02-01"
tags: ["Next.js 14", "FastAPI", "Python", "Groq LLM", "PostgreSQL", "Firebase"]
github: "https://github.com/simplysandeepp/Beacon"
live: "https://beacon.sandeepp.in"
demo: "https://youtu.be/hx63_Fr5I8g?si=xkJFNTc56JADhD88"
featured: true
priority: 3
pinned: true
---

## Overview

Beacon is a full-stack AI platform that automates **Business Requirements Document (BRD)** creation. It ingests raw project data from multiple sources, filters out the noise, extracts the meaningful signals, and runs a multi-agent LLM pipeline to produce a structured, professional BRD — all reviewable and exportable from a modern web UI. Built at **HackFest 2.0** with a team of four.

## The Problem

Writing a BRD means manually sifting through scattered Slack threads, email chains, meeting notes, and documents — then turning that mess into a structured, stakeholder-ready document. It's slow, error-prone, and easy to miss requirements buried in the noise.

Beacon takes that scattered, unstructured input and turns it into a validated BRD draft automatically.

## What I Built

- **Multi-source ingestion** — Slack OAuth and Gmail connectors plus file uploads pull in raw project data
- **Two-phase noise filter** — heuristics followed by a Groq LLM batch classifier separate signal from noise
- **Multi-agent BRD pipeline** — specialized agents generate the structured document, with a validator and exporter
- **Human-in-the-loop versioning** — drafts are reviewable, editable, and collaboratively refined before export
- **Modern web app** — auth, sessions, ingestion UI, BRD review, collaboration, and export

## Architecture

- **`frontend/`** — Next.js 14 app: auth, sessions, ingestion UI, BRD review, collaboration, export
- **`backend/api/`** — FastAPI server: REST endpoints, orchestration, streaming
- **Noise filter module** — two-phase classifier (heuristics + Groq LLM batch)
- **BRD module** — multi-agent generation pipeline, validator, exporter, HITL versioning
- **Integration module** — Slack OAuth + Gmail connectors

## Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS

**Backend:** FastAPI, Python 3.9+

**AI:** Groq LLM engine, multi-agent classification + generation

**Data & Auth:** Firebase (Auth & Firestore), PostgreSQL

## Use Case

Product teams, consultants, and engineering orgs who want to compress hours of requirements-gathering into minutes — turning the chatter that already exists across their tools into a clean, validated BRD.
