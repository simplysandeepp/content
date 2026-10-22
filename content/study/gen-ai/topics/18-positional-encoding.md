---
title: "Positional Encoding"
order: 18
tagline: "Injecting order back into a mechanism that only sees content, not sequence position"
definition: "Because self-attention has no built-in sense of order, positional encoding adds a unique sinusoidal (or learned) signal to each token's embedding based on its position in the sequence."
tags: ["Positional Encoding", "Transformers", "Sinusoidal"]
---

## TL;DR
Self-attention computes relevance purely from token content — shuffle the input tokens and the
mechanism just relabels, with no built-in sense of order. Positional encoding adds a
position-dependent vector to each token embedding so the model gets order information back.

## Why it matters
Without positional encoding, a Transformer would process "dog bites man" and "man bites dog"
identically at the level of self-attention's content-matching — a disaster for language, where
order carries meaning. Every standard Transformer (encoder or decoder) needs some form of
positional information injected before or during attention. This is one of the clearest differences
between Transformers and RNNs: an RNN gets order "for free" because it processes tokens one at a
time in sequence; a Transformer processes all tokens in parallel, so it has to be handed order
explicitly, as data, rather than getting it from the shape of the computation itself.

## The core idea
`Attention(Q,K,V) = softmax(QK^T/√d_k)V` is computed purely as a function of the *set* of token
vectors fed in — it has no term anywhere that encodes "this token is 3rd" versus "this token is
7th." Attention ko khud se pata nahi hota ki kaun pehle aaya kaun baad mein — bas content dekh ke
weight deta hai. So before the input reaches attention, a positional encoding vector — one per
position — is added elementwise to the token embedding, giving each position a distinct, fixed
"fingerprint" that attention can then learn to use.

## How it works
For each position `pos` in the sequence and each embedding dimension pair `(2i, 2i+1)`:

- The even dimension `2i` gets a **sine** value.
- The odd dimension `2i+1` gets a **cosine** value.
- Both use the *same* base frequency for that pair, so together they form one 2D rotation per pair.
- Low `i` (early dimension pairs) gives high-frequency waves that change fast as `pos` increases;
  high `i` (later pairs) gives low-frequency waves that change slowly — like a clock with many hands
  moving at different speeds, giving every position a unique combined pattern.
- The resulting positional vector is **added** (not concatenated) to the token embedding, so
  `d_model` stays unchanged.

## The maths
`PE(pos, 2i) = sin(pos / 10000^(2i/d_model))`

`PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))`

- `pos` — the token's position in the sequence (0, 1, 2, ...).
- `i` — the dimension-pair index, ranging from `0` to `d_model/2 − 1`.
- `d_model` — the embedding dimension.
- `10000` — a fixed base controlling the range of wavelengths across dimension pairs.
- Each pair `(2i, 2i+1)` encodes position as a point on a circle of a particular frequency, via
  sine on the even index and cosine on the odd index.

**Why sine *and* cosine, not just one:** for a fixed offset `k`, `sin(pos+k)` and `cos(pos+k)` can
each be expanded (angle-addition identities) as a linear combination of `sin(pos)` and `cos(pos)`,
with coefficients that depend only on `k`, not on `pos`. That means `PE(pos+k)` is a *linear
function* of `PE(pos)` for any fixed offset `k` — which is exactly what lets the model's linear
attention computations learn to pick up on *relative* position, not just absolute position. Using
sine alone would only give one coordinate of that rotation, not the full, invertible pair.

**Alternative:** learned positional embeddings — a trainable embedding table indexed by position,
just like a token embedding table — are used by some models (e.g. BERT, GPT-2) instead of the fixed
sinusoidal formula. They're simpler to implement, but a model trained this way has no principled way
to handle a position index it never saw during training, whereas the sinusoidal formula can be
evaluated at any position since it's just a deterministic function.

## Worked example
Let `d_model = 4`, so `i ∈ {0, 1}`. For position `pos = 1`:

- `i=0`: `PE(1,0) = sin(1 / 10000^0) = sin(1) ≈ 0.8415`; `PE(1,1) = cos(1) ≈ 0.5403`
- `i=1`: `PE(1,2) = sin(1 / 10000^0.5) = sin(1/100) = sin(0.01) ≈ 0.0100`;
  `PE(1,3) = cos(0.01) ≈ 0.9999`

So `PE(pos=1) ≈ [0.8415, 0.5403, 0.0100, 0.9999]`.

For `pos = 2`, the first pair changes fast (`sin(2) ≈ 0.9093`, `cos(2) ≈ −0.4161`) while the second
pair barely moves (`sin(0.02) ≈ 0.0200`, `cos(0.02) ≈ 0.9998`) — exactly the "fast dimension, slow
dimension" behaviour described above.

## Exam traps
- Positional encoding is **added** to the token embedding elementwise, not concatenated — `d_model`
  does not grow.
- `10000` is a hyperparameter of the original formula, not a universal mathematical constant — it
  just controls the spread of wavelengths.
- Learned positional embeddings cannot generalize past the maximum sequence length seen in training;
  the fixed sinusoidal formula can be evaluated at any position, giving a form of length
  generalization even to unseen lengths.
- Self-attention is permutation-*equivariant* on its input set — it isn't that it "fails" without
  position, it simply has no mechanism to represent it at all without external help.
- Positional encoding is computed once per position and is the same regardless of which sentence
  or which tokens occupy that position — it depends only on `pos` (and `i`, `d_model`), never on
  token identity.
- Don't mix up "frequency" and "position": for a fixed position, different dimension pairs cycle at
  different frequencies; for a fixed dimension pair, the value changes as position increases.

## Remember this
Positional encoding is a deterministic sine/cosine fingerprint, added per position, that gives
attention — which only ever sees content — order information for free, and the sine+cosine pairing
is specifically what makes relative position a linear, learnable operation.
