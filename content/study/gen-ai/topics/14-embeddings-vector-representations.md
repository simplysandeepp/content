---
title: "Embeddings and Vector Representations for LLMs"
order: 14
tagline: "Turning words into points in space so 'similar meaning' becomes 'nearby vectors'"
tags: ["Embeddings", "Vector Representations", "Cosine Similarity", "RAG"]
---

## TL;DR
An embedding maps a token/word to a dense vector such that semantically related items end up close
together in vector space. Static embeddings (word2vec) give one fixed vector per word; Transformer
embeddings are contextual — the same word gets a different vector depending on what's around it.

## Why it matters
Embeddings are the literal numeric input to every Transformer (there's no way to feed raw text into
matrix multiplications otherwise), and they're the foundation of retrieval and RAG — a RAG system's
entire "find relevant context" step is just nearest-neighbour search over embedding vectors.
Without embeddings, neither modern LLMs nor retrieval-augmented generation work at all.

## The core idea
Simple shabdo mein: an embedding is just a list of numbers (a vector) assigned to a token, learned
so that tokens used in similar contexts end up with similar vectors. "King" and "queen" should land
near each other in this space; "king" and "apple" shouldn't. This isn't hand-designed — it falls out
of training on large amounts of text, where words that appear in similar contexts get pushed toward
similar vectors.

**Static vs contextual embeddings** — this is the key distinction examiners probe:
- **Static** (e.g. word2vec, GloVe): each word gets exactly **one** fixed vector, regardless of how
  it's used. "Bank" has the same vector whether the sentence is about a river bank or a bank
  account — the model can't tell them apart from the embedding alone.
- **Contextual** (Transformer output vectors): the vector for a token is computed fresh for each
  occurrence, because self-attention mixes in information from the surrounding tokens at every
  layer. So "bank" in "river bank" and "bank" in "bank account" end up as two **different** output
  vectors, because each one has absorbed different surrounding context. This is strictly more
  expressive than a static table lookup.

## How it works
1. **Token embedding**: each token in the vocabulary has a learned vector in a lookup table of
   dimension `d_model` — this is where a Transformer's input starts (combined with positional
   encoding, as covered in the encoder topic).
2. **Measuring similarity**: once you have vectors, you compare them with **cosine similarity**,
   which measures the angle between two vectors rather than their raw magnitude — useful because it
   doesn't matter how "long" a vector is, only the direction it points in semantic space.
3. **Nearest-neighbour retrieval**: to find items related to a query, embed the query into the same
   vector space, then search for the stored vectors with the highest cosine similarity (or lowest
   distance) to it. This is exactly what a vector database does for RAG: embed a query, retrieve the
   top-`k` nearest document chunks, and feed those chunks into the LLM's context as grounding.
4. **Contextual embeddings as Transformer output**: after passing through the encoder (or decoder)
   stack, the output vector at each position is a contextual embedding — it started as a static
   token embedding, then accumulated context through every self-attention layer it passed through.

## The maths
Cosine similarity between two vectors `a` and `b`:
`cos_sim(a, b) = (a · b) / (‖a‖ ‖b‖)`
where `a · b` is the dot product and `‖a‖`, `‖b‖` are the vectors' magnitudes (L2 norms). The result
ranges from `-1` (opposite direction) to `1` (same direction); `0` means no linear relationship.
Higher cosine similarity is read as "more semantically similar" in embedding space.

This builds directly on the self-attention formula from the Transformer topics —
`Attention(Q,K,V) = softmax(QK^T/√d_k) V` — since `QK^T` itself is a (scaled) set of dot products
between query and key vectors, i.e. attention weights are themselves a similarity measure over
vector representations, just computed inside the network rather than between stored embeddings.

## Worked example
Conceptually (illustrative numbers below — not actual model output, just to show the method):
suppose we embed "king," "queen," and "apple." "King" and "queen" share many semantic dimensions
(royalty, person, formality) and differ mainly in one (gender), so their cosine similarity is
**high** — say, illustratively, around `0.7`–`0.8`. "Apple" shares almost none of those dimensions
with either, so its cosine similarity to "king" or "queen" would be **low**, illustratively around
`0.1`–`0.2`. A classic qualitative property of these learned spaces (well documented for word2vec)
is that vector arithmetic captures relations: `vector("king") − vector("man") + vector("woman")`
lands close to `vector("queen")` — the *direction* from "man" to "woman" behaves consistently when
added to "king," because that direction has come to encode "gender" as a reusable axis in the space.

## Exam traps
- Don't say Transformer embeddings are "the same as word2vec but bigger" — the defining difference
  is **context-dependence**: one word, many possible output vectors, depending on surrounding text.
- Cosine similarity ignores vector **magnitude** entirely — two vectors pointing the same direction
  but different lengths have cosine similarity `1`. If a question's answer depends on magnitude,
  cosine similarity is the wrong tool (Euclidean distance would be).
- Embeddings aren't retrieved/looked up only once and done — in a Transformer, the *input* token
  embedding is static per-token, but every layer's self-attention output is a progressively more
  contextual embedding; "the embedding" can mean either depending on which stage is being asked
  about.
- RAG's retrieval step depends entirely on queries and documents being embedded into the **same**
  vector space — if they're embedded with different, incompatible models, nearest-neighbour search
  over them is meaningless.

## Remember this
An embedding turns meaning into geometry — similar meaning means nearby vectors — and the one
upgrade Transformers made over static embeddings like word2vec is that the vector for a word now
depends on the sentence it's actually in.
