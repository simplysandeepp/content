---
title: "17. Embeddings & Vector Representations"
order: 17
---

> An **embedding** is a dense numeric vector (e.g. 384–3072 numbers) that represents the **meaning** of a token, sentence or document. Similar meanings → nearby vectors.

- **One-hot** (sparse, no meaning) → **static embeddings** (Word2Vec, GloVe: one vector per word) → **contextual embeddings** (BERT/GPT: vector depends on sentence).
- Famous property: vec(king) − vec(man) + vec(woman) ≈ vec(queen).
- **In LLMs:** token IDs → embedding matrix lookup (vocab × d_model) → transformer layers → final hidden states.
- **Sentence embeddings** (Sentence-BERT, OpenAI/Cohere embedding models) used for search, clustering, RAG.

```text
Cosine similarity = (A · B) / (‖A‖ ‖B‖)   ∈ [−1, 1];   1 = same direction (same meaning)
```

Example: A = [1, 2], B = [2, 4] → cos = 10 / (√5 · √20) = 10/10 = 1. Other metrics: dot product, Euclidean distance. Stored and searched in **vector databases** (FAISS, Chroma, Pinecone, Milvus) using approximate nearest neighbour (HNSW).
