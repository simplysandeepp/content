---
title: "A Strictly Grounded RAG Assistant — FAISS, Subject Filtering and a Refusal Path"
description: "How Stateful's interview-prep assistant answers only from a curated dataset: parsing Q&A blocks into chunks, a FAISS inner-product index over normalised MiniLM embeddings, post-filtering by subject with an over-fetch, a similarity threshold, and two separate refusal paths when the dataset doesn't cover a question."
metaDescription: "RAG design for a curated Q&A dataset — regex chunking, FAISS IndexFlatIP with normalised vectors, subject filtering by over-fetching, score threshold and grounded refusal."
date: "2026-07-22"
tags: ["RAG", "FAISS", "Embeddings", "Gemini", "Python", "Interview Prep", "Dev Log"]
published: true
---

Stateful is a CS learning platform with an algorithm visualiser, an online compiler and a study assistant. This post is about the assistant. It was built for one narrow job — answering interview questions on **OS, CN (networks), OOPS and DBMS** — and the design goal was *not* "be helpful about everything" but "**answer only from our dataset, and say so when we can't**". That goal drives every choice below.

## The Data: Small, Curated and Structured

The knowledge base is a set of text files in a bracketed format:

```
[SUBJECT]: OS
[QUESTION NO]: 12
[QUESTION]: ...
[ANSWER]: ...
```

An ingest script parses each file with a regular expression into chunks that carry `subject`, `question_no`, `question` and `answer`. The resulting corpus is on the order of a hundred question-and-answer pairs (roughly 20–30 per subject). One chunk per question means **retrieval returns a whole, self-contained answer** rather than a fragment, which suits the format. Small and curated is a feature here: every answer was written on purpose, so retrieval quality is mostly about matching the question.

## Embeddings and Index

Each chunk's text is embedded with `all-MiniLM-L6-v2` (384 dimensions) via sentence-transformers. The vectors are L2-normalised and put into a FAISS `IndexFlatIP`. With normalised vectors, **inner product equals cosine similarity**, so scores sit in a familiar range and a threshold is meaningful. A flat (exact) index is perfectly fine for hundreds of vectors; approximate indexes only start to pay for themselves at a much larger scale. The index and the chunk metadata are saved as `vector_store.faiss` and a pickle file, and loaded at startup.

## Subject Filtering by Over-Fetching

The user chooses a subject (OS, CN, OOPS or DBMS) in the UI, and the answer must come from that subject. FAISS's flat index has no built-in metadata filter, so the search does a simple trick: when a subject is requested it retrieves `top_k × 10` candidates, then keeps only those whose `subject` matches and returns the first `top_k`. It is cheap at this size and avoids maintaining four separate indexes. At larger scale you'd use a vector database with real filters, or per-subject indexes.

## Two Ways to Say "I Don't Know"

The pipeline refuses in two independent places:

1. **Before the model.** If there are no results, or the best score is under **0.3**, a fixed fallback ("This question is outside the current dataset.") is returned with `context_found: false`. No model call, no cost, no hallucination risk.
2. **After the model.** The system prompt says to answer only from the provided context and to state that the question is outside the dataset otherwise. If the generated text contains "outside the dataset", the pipeline replaces it with the same fallback and returns no sources.

The first check catches clearly unrelated questions cheaply; the second catches borderline retrievals where the model itself decides the context is insufficient. Having both is much more reliable than relying on either alone. The built-in test queries include a deliberately off-topic question ("Who won the world cup?") to confirm the refusal path works.

## Prompt and Generation Settings

The prompt gives the retrieved Q&A pairs as numbered context blocks, then the user's question, with the instruction to use **only** that context. Generation uses a low temperature (0.3), a modest output cap and a "concise, technical, interview-focused" persona. Low temperature suits grounded answering: we want faithful paraphrase, not creativity.

The response includes `sources` — subject, question number, question text and score for the top three chunks — so the UI can show *where* an answer came from. Provenance is the cheapest trust feature you can add to RAG.

## What I'd Fix

- The ingest script has a hard-coded local dataset path; it should take a CLI argument or an environment variable.
- A fixed similarity threshold of 0.3 was chosen by feel. It should be calibrated against a labelled set of in-scope and out-of-scope questions.
- Checking for the literal phrase "outside the dataset" is brittle. A structured output (an `answerable` boolean) would be sturdier.
- Retrieval is purely semantic; adding a keyword (BM25) signal would help for short, term-heavy queries like "SJF".
- The model name is hard-coded in the client; it should be configuration.

## Takeaways

1. For a closed-domain assistant, **refusing correctly is a core feature**, not an edge case.
2. Normalise vectors, use inner product, and a score threshold becomes interpretable.
3. Over-fetch-then-filter is a good enough metadata filter at small scale.
4. Return sources with every answer.
