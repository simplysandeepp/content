---
title: "Multi-Head Attention"
order: 17
tagline: "Several smaller attentions run in parallel so the model can learn different kinds of relationships at once"
definition: "Multi-head attention runs several smaller self-attention operations in parallel, each with its own learned projections, so different heads can specialise in different kinds of relationships between tokens."
tags: ["Multi-Head Attention", "Transformers"]
---

## TL;DR
One attention head produces one softmax-weighted view of how tokens relate to each other.
Multi-head attention runs several such heads in parallel, each with its own learned projections, and
merges their outputs — so a single layer can capture several *different* kinds of relationships
simultaneously instead of being forced into one compromise view.

## Why it matters
Multi-head attention is used in every Transformer encoder and decoder layer — BERT, GPT, T5, and
essentially every modern Transformer-based generative model. It's a key reason Transformers can
represent syntax, coreference, and positional patterns all in the same layer, rather than one
attention mechanism trying to average all of that into a single distribution.

## The core idea
A single attention head produces exactly one set of attention weights per token — one weighted
average per token, full stop. That's a single "compromise" view of relevance. But language has many
*kinds* of relationships at once: which word is the subject of which verb, which pronoun refers to
which earlier noun, which words are simply nearby in position. Ek hi head se yeh sab ek saath pakadna
mushkil hai — isliye alag-alag heads ko alag-alag projections mein chalaya jaata hai, so each can
specialize in a different kind of relationship, and the results are combined afterwards.

## How it works
1. **Per-head projection** — `Q`, `K`, `V` are each linearly projected separately for every head `i`,
   using that head's own learned matrices `W_Q^i, W_K^i, W_V^i`, typically down to a smaller
   dimension `d_k = d_model / h`.
2. **Independent attention per head** — scaled dot-product attention runs separately inside each
   head, on its own projected `Q, K, V`.
3. **Concatenate** — all `h` heads' output vectors are concatenated back together along the feature
   dimension.
4. **Output projection** — the concatenated vector is passed through a final learned matrix `W_O`
   that mixes information across heads back into a single `d_model`-sized vector.

## The maths
`head_i = Attention(QW_Q^i, KW_K^i, VW_V^i)`

`MultiHead(Q,K,V) = Concat(head_1, ..., head_h) W_O`

- `h` — number of attention heads.
- `W_Q^i, W_K^i, W_V^i` — per-head learned projection matrices (distinct for every head `i`).
- `Attention(...)` — the usual scaled dot-product attention, `softmax(QK^T/√d_k)V`, applied inside
  each head on that head's own projected `Q, K, V`.
- `Concat(head_1,...,head_h)` — stacking all heads' outputs side by side into one vector per token.
- `W_O` — a learned output projection that maps the concatenated vector back to `d_model` dimensions
  and lets information from different heads mix.

Because each head works in a reduced dimension `d_k = d_model / h` rather than the full `d_model`,
the total compute across all `h` heads stays comparable to a single full-dimension head — multi-head
attention buys breadth of relationship-types, not a multiplied compute cost.

## Worked example
Take the sentence: *"The dog chased the ball because it was fast."* This is an illustrative, not a
real measured example, of what different heads *could* specialize in after training:

- **Head A** might put most of its weight on short-range, syntactic pairs — e.g. "chased" attending
  strongly to "dog" (its subject).
- **Head B** might specialize in longer-range coreference — e.g. "it" attending back to "dog" or
  "ball" to help resolve what "it" refers to.
- **Head C** might lean on relative position — attending mostly to nearby words regardless of their
  identity.

In practice, heads aren't hand-assigned these roles; such specialization, if it happens, emerges
from training, and different heads in a real trained model often split responsibilities in less
clean-cut ways than this illustration.

It also helps to think about *why* a single head genuinely can't do this job alone: a head produces
exactly one softmax distribution per token, i.e. one number per (token, other-token) pair. If
"which word is my subject" and "which word is nearby" both needed to be expressed through that same
single distribution, the head would have to blend both signals into one compromise set of weights —
losing resolution on both. Separate heads, each with their own `W_Q^i, W_K^i, W_V^i`, give the model
separate "slots" to put each kind of signal into, without one drowning out the other.

## Exam traps
- Heads do **not** have explicitly labelled roles like "syntax head" or "coreference head" — the
  qualitative division of labour described above is illustrative, not a guaranteed or literally
  assigned behaviour.
- Multi-head attention splits the *projection dimension* across heads (`d_k = d_model/h`); it does
  not run `h` full-size attentions and multiply the compute by `h`.
- The final `Concat(...)W_O` step is required — without the output projection, the heads' outputs
  are just disconnected slices sitting next to each other, with no mixing across heads.
- `d_model` must be divisible by `h` so that `d_k = d_model / h` is a whole number.
- Increasing the number of heads `h` while keeping `d_model` fixed shrinks each head's dimension
  `d_k` — more heads is not automatically "more capacity," it's "more, narrower views."

## Remember this
Multi-head attention = run several smaller attentions in parallel on different learned projections,
then concatenate and mix them with `W_O` — breadth of relationship-types in one layer instead of one
attention trying to do everything.
