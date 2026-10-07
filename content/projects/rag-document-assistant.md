---
title: "RAG Document Assistant"
description: "A production-style Retrieval-Augmented Generation system — documents are chunked, embedded with SentenceTransformers, indexed in Endee's HNSW vector database, and retrieved via cosine-similarity k-NN search to ground Groq's Llama 3.3 70B in a user-provided knowledge base with full source attribution."
metaDescription: "A production-style RAG system — documents are chunked, embedded, and indexed, then retrieved to ground Groq's Llama 3.3 70B with full source attribution."
date: "2026-03-12"
tags: ["Python", "RAG", "Streamlit", "Endee Vector DB", "HNSW", "SentenceTransformers", "Groq Llama 3.3", "Render"]
github: "https://github.com/simplysandeepp/endee"
demo: "https://youtu.be/zrxBGdZGPnc"
featured: false
---

## Overview

A **Retrieval-Augmented Generation (RAG)** application built for the Endee.io Campus Recruitment Assignment. Users upload text documents, which are stored as vector embeddings in the **Endee Vector Database**; natural-language questions then retrieve the most semantically relevant chunks and feed them as grounded context to a **Groq-hosted LLM** (`llama-3.3-70b-versatile`). Answers are current, domain-specific, and traceable to source documents — the LLM never operates without retrieval grounding.

## Architecture

- **Ingestion pipeline** — documents split into configurable 500-word chunk windows, each independently embedded with `all-MiniLM-L6-v2` (384-dim float32) and batch-inserted into Endee
- **HNSW vector index** — cosine-similarity approximate nearest neighbor search (`M=16`, `ef_con=200`) over MDBX persistent storage, returning top-k results in milliseconds
- **Query pipeline** — the question is encoded into the same vector space, top-k chunks retrieved via Endee's search API (MessagePack-encoded responses), assembled into a context prompt for Groq
- **Source attribution** — every answer renders the exact retrieved chunks with similarity scores
- **Auto-recovery** — detects Endee's "required files missing for index" error on ephemeral hosts, transparently deletes the stale index, reprovisions, and retries ingestion
- **Defensive parsing** — a multi-format metadata parser handles raw dicts, JSON strings, and bytes across Endee versions
- **Streamlit frontend** with dark theming, real-time system status, live metrics (docs / chunks / latency), and configurable top-k, temperature, and chunk size
- **Render blueprint deploy** — `render.yaml` provisions both the Dockerized Endee server and the Streamlit app with internal-hostname networking

## What It Demonstrates

The full RAG lifecycle end to end: chunking strategy trade-offs, symmetric query/document embedding, ANN index configuration, binary protocol handling (msgpack), prompt construction for grounded generation, and resilience engineering for free-tier cloud infrastructure.
