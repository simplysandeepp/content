---
title: "Introduction to Transformers – Motivation for Generative AI"
order: 11
tagline: "Why generative AI gave up on recurrence and bet everything on attention"
tags: ["Transformers", "Self-Attention", "RNN", "LSTM"]
---

## TL;DR
RNNs and LSTMs process sequences one token at a time, which makes them slow to train and bad at
remembering far-away context. Transformers drop recurrence entirely — every token attends directly
to every other token in parallel — and that single change is why they became the backbone of
essentially all modern generative AI.

## Why it matters
Every major generative system you've heard of — GPT-style LLMs, vision Transformers generating or
understanding images, audio Transformers like those behind speech generation — is built on this
architecture. Understanding why Transformers replaced RNNs is really understanding why generative
AI scaled the way it did over the last few years.

## The core idea
Simple shabdo mein: an RNN/LSTM reads a sequence like a person reading one word at a time and
updating a mental summary as they go. Two problems fall out of that directly:

- **Sequential computation**: to compute the hidden state at step `t`, you need the hidden state at
  step `t-1` — there's no way to compute step 5 before step 4 finishes. This means training can't be
  parallelized across the time dimension, which is brutal when you want to train on huge datasets.
- **Long-range dependency decay**: information from token 1 has to survive being repeatedly
  compressed and overwritten through every subsequent step before it can influence token 100. Even
  with LSTM gates designed to help it persist, relevant signal fades, and gradients during
  backpropagation-through-time can vanish (or explode) across many steps — making it genuinely hard
  to learn dependencies that span long distances in the sequence.

The Transformer's answer: throw out recurrence entirely. Use **self-attention**, where every
position in the sequence computes a direct, weighted connection to every other position, in one
shot, using matrix multiplications that are fully parallelizable across the whole sequence.

## How it works
Two architectural changes do all the work:
- **Full parallelism**: since there's no step-by-step hidden state dependency, the entire sequence
  can be processed at once on a GPU/TPU — attention for all positions is computed simultaneously via
  matrix multiplies, not a loop.
- **Self-attention for direct long-range connections**: token 1 and token 100 are exactly **one hop**
  apart — the attention mechanism lets any token look directly at any other token's representation,
  with a learned weight on how much to attend to it, regardless of distance. An RNN needs 99
  sequential hops to connect those same two tokens; a Transformer needs one.

At a high level, the original Transformer (and most Transformer-based systems) has an
**encoder-decoder** shape: the encoder reads the full input sequence and produces a contextual
representation of it; the decoder generates the output sequence token by token, attending to its
own previously generated tokens (self-attention) and to the encoder's representations (cross-
attention) to stay grounded in the input. Encoder-only models (like BERT-style) and decoder-only
models (like GPT-style LLMs) are variations that keep one half of this shape and drop the other,
depending on the task.

## The maths
- Self-attention: `Q = XW_Q`, `K = XW_K`, `V = XW_V`;
  `Attention(Q,K,V) = softmax(QK^T / √d_k) V` — the `√d_k` scaling keeps the dot products from
  growing too large as dimensionality increases, which would otherwise push softmax into regions
  with tiny gradients.
- Multi-head attention: `head_i = Attention(QW_Q^i, KW_K^i, VW_V^i)`;
  `MultiHead(Q,K,V) = Concat(head_1,...,head_h) W_O` — running several smaller attention "heads" in
  parallel lets the model attend to different kinds of relationships at once (e.g. syntactic vs
  semantic), then recombines them.
- Sinusoidal positional encoding (needed precisely because there's no recurrence to implicitly
  encode order): `PE(pos,2i) = sin(pos / 10000^(2i/d_model))`,
  `PE(pos,2i+1) = cos(pos / 10000^(2i/d_model))`.

## Worked example
Consider the sentence "The trophy didn't fit in the suitcase because **it** was too big" — resolving
what "it" refers to requires connecting a token near the end back to a token near the beginning. An
RNN has to carry that link through every intermediate word, with the risk of it fading. A Transformer
computes attention weights directly between "it" and every earlier word in one pass; if "trophy" and
"suitcase" both get non-trivial attention weight from "it," the model can weigh both candidates
based on the full sentence's context, not a decayed running summary.

## Exam traps
- "Transformers process sequences in parallel" is about **training/computation**, not about
  discarding order — position still matters, which is exactly why positional encoding is needed.
- Don't say LSTMs "can't" model long-range dependencies at all — gates were specifically designed to
  help with this. The honest claim is that the dependency signal still **decays** over long
  distances and gradients still **vanish/explode** across many steps, not that it's structurally
  impossible.
- Self-attention gives tokens a direct connection regardless of distance — contrast this clearly with
  RNNs, where the path length between two tokens grows with their distance in the sequence.
- The encoder-decoder split is the original/common shape, but plenty of modern generative LLMs are
  **decoder-only** — don't assume every Transformer-based generative model has both halves.

## Remember this
RNNs bottleneck on sequential computation and decaying long-range signal; Transformers fix both at
once by replacing recurrence with self-attention, giving full parallelism and a direct, one-hop
connection between any two tokens no matter how far apart.
