---
title: "Self-Attention – Concept, Step-by-Step Example, and Hands-on Visualization"
order: 16
tagline: "Every token looks at every other token and mixes their values by relevance"
tags: ["Self-Attention", "Transformers", "QKV"]
---

## TL;DR
Self-attention lets every token in a sequence build its output as a weighted average of *all*
tokens' value vectors, where the weights are decided by how well each token's key matches the
current token's query.

## Why it matters
Self-attention is the core computation inside every Transformer layer — encoders, decoders, GPT,
BERT, all of it. It replaced the step-by-step, sequential processing of RNNs with a mechanism that
looks at the whole sequence at once and mixes information based on content, not just recency. An
RNN has to pass information token-by-token through a hidden state, so a dependency between token 1
and token 50 has to survive 49 sequential update steps; self-attention connects any two tokens in a
single hop, which is also why Transformers parallelize across the whole sequence during training
instead of stepping through it one token at a time.

## The core idea
Three vectors are derived from each token: a **query** (what am I looking for?), a **key** (what do
I offer, as something others might look for?), and a **value** (what do I actually carry, content-
wise?). A token's output is built by comparing its own query against every other token's key, and
using those comparisons as weights on the values. Simple shabdo mein: har token baaki sabko dekhta
hai aur decide karta hai "tumse mujhe kitna lena hai" — jitna match zyada, utna zyada weight uss
token ke value ko milta hai.

## How it works
1. **Project** the input `X` into `Q`, `K`, `V` using learned weight matrices.
2. **Compute `QK^T`** — the dot product of every query against every key, giving a raw relevance
   score between every pair of tokens.
3. **Scale by `√d_k`** — divide the raw scores down so they don't grow too large with dimension.
4. **Softmax** each row — turns the scaled scores for a given token into a probability distribution
   over all tokens (weights that sum to 1).
5. **Multiply by `V`** — use those weights to take a weighted sum of all tokens' value vectors. That
   weighted sum is the self-attention output for that token.

## The maths
`Q = XW_Q`, `K = XW_K`, `V = XW_V`

`Attention(Q,K,V) = softmax(QK^T / √d_k) V`

- `X` — the matrix of input token embeddings (one row per token).
- `W_Q, W_K, W_V` — learned projection matrices that produce the queries, keys, and values.
- `QK^T` — matrix of raw similarity scores between every query and every key.
- `d_k` — the dimensionality of the key (and query) vectors.
- `√d_k` scaling — keeps the dot products from growing too large as `d_k` grows, which would push
  softmax into regions where gradients vanish.
- `softmax(...)` — normalizes each row of scores into attention weights summing to 1.
- The final multiplication by `V` produces a weighted combination of value vectors — the actual
  output of the layer.

## Worked example
Take 3 tokens with small, hand-chosen 2-dimensional `Q`, `K`, `V` vectors (skipping the `X → Q,K,V`
projection step here to focus purely on the attention arithmetic), so `d_k = 2` and the scaling
factor is `√2 ≈ 1.4142`:

| token | Q | K | V |
|---|---|---|---|
| 1 | [1, 0] | [1, 0] | [1, 0] |
| 2 | [0, 1] | [0, 1] | [0, 1] |
| 3 | [1, 1] | [1, 1] | [0.5, 0.5] |

**Raw scores `QK^T`** (row = query token, col = key token):

- Row 1: `Q1·K1=1, Q1·K2=0, Q1·K3=1`
- Row 2: `Q2·K1=0, Q2·K2=1, Q2·K3=1`
- Row 3: `Q3·K1=1, Q3·K2=1, Q3·K3=2`

**Scaled (÷ √2 ≈ 1.4142):**

- Row 1: `[0.7071, 0, 0.7071]`
- Row 2: `[0, 0.7071, 0.7071]`
- Row 3: `[0.7071, 0.7071, 1.4142]`

**Softmax each row** (using `e^0.7071 ≈ 2.0281`, `e^0 = 1`, `e^1.4142 ≈ 4.1133`):

- Row 1: sum `= 2.0281+1+2.0281 = 5.0562` → weights `[0.4011, 0.1978, 0.4011]`
- Row 2: sum `= 1+2.0281+2.0281 = 5.0562` → weights `[0.1978, 0.4011, 0.4011]`
- Row 3: sum `= 2.0281+2.0281+4.1133 = 8.1695` → weights `[0.2482, 0.2482, 0.5035]`

**Output = weights · V:**

- Output 1 `= 0.4011·[1,0] + 0.1978·[0,1] + 0.4011·[0.5,0.5] = [0.6017, 0.3983]`
- Output 2 `= 0.1978·[1,0] + 0.4011·[0,1] + 0.4011·[0.5,0.5] = [0.3983, 0.6017]`
- Output 3 `= 0.2482·[1,0] + 0.2482·[0,1] + 0.5035·[0.5,0.5] = [0.5000, 0.5000]`

Every intermediate number above can be re-derived by hand with the same `Q,K,V` — try token 1's row
yourself to check it.

## Exam traps
- The `√d_k` scaling is not a cosmetic detail — without it, large dot products push softmax into a
  near-one-hot, tiny-gradient regime, which hurts training.
- Softmax normalizes **per query row** (across all keys for one token), not down a column.
- Self-attention by itself has no notion of token order — it's a function of content, token
  identity and value, not position (that's what positional encoding exists to fix).
- The output for a token is a weighted *average of other tokens' values*, not of their queries or
  keys.
- `Q`, `K`, `V` are produced by three *separate* learned matrices `W_Q, W_K, W_V` — they are not
  the same projection reused three times, even though they all come from the same input `X`.
- A token's own position is included when computing its output — a token attends to itself too,
  not just to the other tokens in the sequence (unless explicitly masked out, as in decoders).

## Remember this
Self-attention output for a token = a softmax-weighted average of every token's value vector, where
the weights come from how well that token's key matches the current query, scaled by `√d_k` before
the softmax.
