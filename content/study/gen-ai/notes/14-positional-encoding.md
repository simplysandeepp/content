---
title: "14. Positional Encoding"
order: 14
---

> Self-attention is **permutation-invariant** — "dog bites man" and "man bites dog" would look identical. **Positional encoding** adds a unique vector for each position to the token embedding so the model knows word order.

```text
PE(pos, 2i) = sin( pos / 10000^(2i / d_model) )
PE(pos, 2i+1) = cos( pos / 10000^(2i / d_model) )

Input to Transformer = Embedding(token) + PE(pos)   (element-wise addition, same dimension)
```

**Example** (d_model = 4, pos = 1): i = 0 → angle = 1/10000⁰ = 1 → sin 1 = 0.841, cos 1 = 0.540; i = 1 → angle = 1/10000^(2/4) = 1/100 = 0.01 → sin = 0.010, cos = 1.000. **PE(1) = [0.841, 0.540, 0.010, 1.000]**. For pos = 0: [0, 1, 0, 1].

## Why sinusoids?

- Each position gets a unique pattern; values bounded in [−1, 1].
- Different dimensions have different wavelengths (2π to 10000·2π) → low dims change fast (fine position), high dims slow (coarse position) — like clock hands.
- **Relative position:** PE(pos + k) is a linear (rotation) function of PE(pos) → model can learn relative distances.
- No parameters; can extrapolate to longer sequences than seen in training.
- Alternatives: learned positional embeddings (BERT, GPT-2), RoPE (rotary, LLaMA), ALiBi.
