---
title: "Retrieval-Augmented Generation (RAG) – Architecture and Applications"
order: 15
tagline: "Grounding generation in retrieved documents instead of relying only on frozen model weights"
tags: ["RAG", "Retrieval", "Vector Search"]
diagram:
  direction: LR
  nodes:
    - { id: docs, label: "Documents", tone: lime }
    - { id: chunk, label: "Chunking", tone: cyan }
    - { id: embed, label: "Embedding Model", tone: violet }
    - { id: vstore, label: "Vector Index", tone: amber }
    - { id: query, label: "User Query", tone: lime }
    - { id: retrieve, label: "Top-k Retrieval", tone: cyan }
    - { id: gen, label: "LLM Generation", tone: violet }
  edges:
    - { from: docs, to: chunk, label: "ingest" }
    - { from: chunk, to: embed, label: "embed chunks" }
    - { from: embed, to: vstore, label: "store vectors" }
    - { from: query, to: retrieve, label: "embed + search" }
    - { from: vstore, to: retrieve, label: "similarity search" }
    - { from: retrieve, to: gen, label: "augmented prompt" }
---

## TL;DR
RAG retrieves relevant text chunks from an external knowledge store and stuffs them into the
prompt, so the LLM generates its answer grounded in that retrieved context instead of relying only
on whatever got baked into its weights during training.

## Why it matters
Almost every production LLM system that needs up-to-date or domain-specific facts — support bots,
internal docs search, legal/medical assistants — uses RAG. It lets you update what the system
"knows" by changing a document store, with no retraining, and it lets answers be traced back to a
source, which plain generation can't offer.

## The core idea
A plain LLM only has **parametric memory** — facts compressed, lossily, into its weights at
training time. If a fact was rare, outdated, or simply never seen, the model doesn't "look it up,"
it statistically guesses the most plausible-sounding continuation — which is exactly where
hallucination comes from. RAG adds a second, **non-parametric** memory: an external store of
documents that can be searched at inference time and handed to the model as explicit context.
Simple shabdo mein, instead of expecting the model ko sab kuch yaad rakhna hai, hum usse bolte hain
"yeh padh le, phir jawab de."

## How it works
The pipeline (see diagram) runs in two phases — an offline **ingestion** phase and an online
**query** phase:

1. **Document ingestion** – raw source documents (PDFs, wiki pages, tickets, etc.) are collected.
2. **Chunking** – documents are split into smaller passages. This matters because retrieval
   granularity and the model's context window are both limited — a whole 50-page document isn't a
   useful retrieval unit, but a few relevant sentences are.
3. **Embedding generation** – each chunk is passed through an embedding model that maps it to a
   dense vector such that semantically similar chunks land close together in vector space.
4. **Vector index storage** – all chunk vectors are stored in a vector index (e.g. an approximate
   nearest-neighbour structure) built for fast similarity search over potentially millions of
   vectors.
5. **Query embedding** – at query time, the user's question is embedded with the *same* embedding
   model, into the *same* vector space as the chunks.
6. **Similarity retrieval (top-k)** – the query vector is compared against the index, and the `k`
   most similar chunk vectors are retrieved.
7. **Prompt augmentation** – the retrieved chunks are inserted into the prompt alongside the
   original query (often with an instruction like "answer using only the context below").
8. **Generation** – the LLM generates its answer conditioned on this augmented prompt.
9. **(Optionally) source citation** – the system can attach which chunk/document each part of the
   answer came from, since the chunks that were actually used are known.

## The maths
Retrieval is a nearest-neighbour search in embedding space. The standard similarity measure used is
cosine similarity between the query vector `q` and a candidate chunk vector `d`:

`sim(q, d) = (q · d) / (‖q‖ ‖d‖)`

where `q · d` is the dot product and `‖q‖, ‖d‖` are the vector norms (lengths) of `q` and `d`.
Top-k retrieval simply selects the `k` chunks with the highest `sim(q, d_i)` among all indexed
chunks `d_i`.

**Why RAG reduces hallucination compared to pure parametric memory:** a model answering purely from
weights has to statistically reconstruct a fact from patterns smeared across its entire training
set — there's no way to verify that reconstruction against a source at generation time. RAG instead
conditions generation on explicit, retrieved text that the model can directly copy facts from or
quote, and that a human can check against the cited source. It also means facts can be corrected or
added by updating the document store, rather than needing the model to somehow "unlearn" or relearn
something baked into billions of frozen parameters. RAG doesn't eliminate hallucination — the model
can still ignore good context or retrieval can surface the wrong chunk — but it meaningfully reduces
the model's reliance on guessing.

## Worked example
Query: *"What is the refund window for Plan B?"* The retriever embeds this query, searches the
vector index, and returns the top-2 chunks: one from `policy.md` stating "Plan B purchases can be
refunded within 14 days of purchase" and one from `faq.md` mentioning refunds in general. The
augmented prompt becomes roughly: *"Context: [chunk 1], [chunk 2]. Question: What is the refund
window for Plan B? Answer using only the context above."* The LLM generates: *"Plan B purchases can
be refunded within 14 days of purchase (source: policy.md)."* Without retrieval, the model would
have had to recall this specific number from training data alone — and might confidently state the
wrong number instead.

## Exam traps
- Query and document embeddings **must** come from the same embedding model / vector space — mixing
  embedding models breaks similarity search silently.
- Chunk size is a tradeoff: too small loses surrounding context, too large dilutes relevance and
  eats into the context budget.
- RAG is not a replacement for fine-tuning — RAG injects knowledge at inference time via retrieval;
  fine-tuning changes the model's weights. They're complementary, not interchangeable.
- Top-k is a hyperparameter: too small risks missing the relevant chunk, too large adds noise and
  cost. RAG still depends on good retrieval — bad retrieval still produces a confidently wrong answer.

## Remember this
RAG swaps "the model must already know it" for "the model must be correctly told it" — moving facts
out of frozen weights into a searchable, updatable external store.
