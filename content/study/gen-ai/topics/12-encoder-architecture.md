---
title: "Encoder Architecture"
order: 12
tagline: "Embed, attend, feed-forward, normalize — repeat N times"
definition: "A Transformer encoder block stacks multi-head self-attention and a feed-forward network, each wrapped in a residual connection and layer normalization, to build a contextual representation of every input token."
tags: ["Transformer", "Encoder", "Self-Attention", "Layer Norm"]
diagram:
  direction: TB
  nodes:
    - { id: emb, label: "Input Embeddings", tone: lime }
    - { id: pos, label: "+ Positional Encoding", tone: amber }
    - { id: mha, label: "Multi-Head Self-Attention", tone: violet }
    - { id: add1, label: "Add & Norm", tone: cyan }
    - { id: ffn, label: "Feed-Forward Network", tone: violet }
    - { id: add2, label: "Add & Norm", tone: cyan }
  edges:
    - { from: emb, to: pos }
    - { from: pos, to: mha }
    - { from: mha, to: add1 }
    - { from: pos, to: add1, label: "residual" }
    - { from: add1, to: ffn }
    - { from: ffn, to: add2 }
    - { from: add1, to: add2, label: "residual" }
---

## TL;DR
One encoder block is: self-attention sublayer, then a residual + layer-norm, then a feed-forward
sublayer, then another residual + layer-norm. Stack `N` of these blocks and you have the full
Transformer encoder.

## Why it matters
This exact block — attention, then feed-forward, each wrapped in a residual connection and layer
norm — is the single most reused building block in modern deep learning. It's the encoder half of
the original Transformer, it's the entirety of BERT-style models, and it's a core component wherever
an input sequence needs to be turned into rich contextual representations (text encoders feeding
cross-attention in Stable Diffusion, for instance).

## The core idea
Matlab, the encoder's job is: take a sequence of tokens and turn it into a sequence of vectors where
each vector has "absorbed" relevant context from the rest of the sequence. It does this by
alternating two kinds of processing — attention (mixing information *across* positions) and a
feed-forward network (processing *each* position independently) — and wraps each one in a residual
connection and normalization so that stacking many of these blocks stays trainable.

## How it works
Referencing the diagram, top to bottom through one block:

1. **Input embedding**: each input token is looked up in a learned embedding table, producing a
   vector of dimension `d_model`.
2. **+ Positional encoding**: since there's no recurrence to implicitly encode token order, a
   positional encoding vector (same dimension `d_model`) is added to each token's embedding, so the
   model knows where in the sequence each token sits.
3. **Multi-head self-attention sublayer**: the combined embedding+position vectors go through
   self-attention — each position looks at every other position and pulls in weighted context.
4. **Residual connection + layer norm**: the sublayer's output is added back to its own input (the
   residual/skip connection in the diagram), and the sum is normalized. This both eases gradient
   flow through deep stacks and keeps the self-attention sublayer "optional to use" early in
   training — if it has nothing useful to contribute yet, the residual path still carries the
   original signal through.
5. **Position-wise feed-forward sublayer**: a small two-layer fully connected network, applied
   **independently to each position** (same weights reused at every position, but no mixing across
   positions here — that only happens in step 3).
6. **Residual connection + layer norm, again**: same pattern as step 4, applied around the
   feed-forward sublayer.
7. Repeat this whole block `N` times (`N=6` in the original Transformer paper, though other models
   use different depths). The final layer's output is the encoder's contextual representation of
   the input sequence — fed either into a decoder's cross-attention (full encoder-decoder models) or
   used directly as the model's output representations (encoder-only models).

## The maths
- Self-attention: `Q = XW_Q`, `K = XW_K`, `V = XW_V`;
  `Attention(Q,K,V) = softmax(QK^T / √d_k) V` — `√d_k` scaling prevents large dot products from
  pushing softmax into tiny-gradient regions.
- Multi-head: `head_i = Attention(QW_Q^i, KW_K^i, VW_V^i)`;
  `MultiHead(Q,K,V) = Concat(head_1,...,head_h) W_O`.
- Sinusoidal positional encoding: `PE(pos,2i) = sin(pos / 10000^(2i/d_model))`,
  `PE(pos,2i+1) = cos(pos / 10000^(2i/d_model))`, where `pos` is the token's position in the
  sequence and `i` indexes the embedding dimension.
- Residual + layer norm, written as a single step: `LayerNorm(x + Sublayer(x))`, where `Sublayer(x)`
  is either the multi-head attention block or the feed-forward block, and `x` is that sublayer's
  input (the residual path).

## Worked example
Take a 4-token sentence embedded into `d_model`-dimensional vectors `X = [x_1, x_2, x_3, x_4]` after
adding positional encodings. Self-attention computes `Q, K, V` from `X`, and for token 2, say, its
output is a weighted sum of **all four** value vectors `V`, with weights from `softmax(QK^T/√d_k)`
row 2 — so token 2's new representation already contains context from tokens 1, 3, and 4 before it
even reaches the feed-forward sublayer. Add this attention output back to the original `x_2`
(residual), normalize, then pass through the feed-forward network (same two linear layers + ReLU/
GELU applied to every token's vector independently), add and normalize again — that's one full
encoder block done for this token, and the whole operation repeats for `N` blocks.

## Exam traps
- Positional encoding is **added to** the embedding, not concatenated, and not learned by the
  self-attention mechanism itself — it has to be injected before attention runs, since attention has
  no inherent notion of order.
- The feed-forward sublayer processes each position **independently** — don't describe it as mixing
  information across tokens; that's exclusively attention's job.
- There are **two** residual + layer-norm steps per block (one around attention, one around
  feed-forward), not one.
- `N` identical blocks are stacked, but each block has its **own** learned parameters — they are not
  weight-shared across layers (unlike positions within the feed-forward sublayer, which do share
  weights across positions within a single layer).

## Remember this
One encoder block = self-attention (mix across tokens) → residual+norm → feed-forward (process each
token independently) → residual+norm; stack it `N` times to get the full encoder.
