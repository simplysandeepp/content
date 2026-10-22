---
title: "12. Self-Attention — Concept & Step-by-Step Numerical"
order: 12
---

> **Self-attention** lets every token in a sentence look at every other token and decide **how much attention** to pay to each, then build a new representation as a weighted sum. Example: in "The animal didn't cross the street because **it** was tired", "it" attends strongly to "animal".

**Query (Q)** = what I am looking for. **Key (K)** = what I contain (label). **Value (V)** = actual information I give. (Like YouTube search: query = your search, keys = video titles, values = videos.)

```text
Attention(Q, K, V) = softmax( Q Kᵀ / √d_k ) · V,   Q = XW^Q, K = XW^K, V = XW^V
```

**X (embeddings) → Q, K, V = XW → Scores QKᵀ → ÷ √d_k → (mask) → Softmax (rows sum to 1) → × V → Output Z**

**Why divide by √d_k?** Dot products grow with dimension; large values push softmax into extreme 0/1 regions with tiny gradients. Scaling keeps variance ≈ 1 → stable gradients.

## ✏️ Worked numerical (Q57) — 3 tokens, d = 2

```text
X = [[1, 0], [0, 1], [1, 1]]   (tokens: "I", "love", "AI")
W^Q = [[1, 0], [1, 1]],   W^K = [[1, 1], [0, 1]],   W^V = [[1, 0], [0, 2]]
```

**Step 1 – Q, K, V** (row × matrix):

| Token | Q = XW^Q | K = XW^K | V = XW^V |
|---|---|---|---|
| I [1,0] | [1, 0] | [1, 1] | [1, 0] |
| love [0,1] | [1, 1] | [0, 1] | [0, 2] |
| AI [1,1] | [2, 1] | [1, 2] | [1, 2] |

**Step 2 – Scores S = QKᵀ** (dot of each query with each key):

```text
S = [[1, 0, 1], [2, 1, 3], [3, 1, 4]]
e.g. row 2: q=[1,1]·k₁[1,1]=2, ·k₂[0,1]=1, ·k₃[1,2]=3
```

**Step 3 – Scale** by √d_k = √2 = 1.414:

```text
S/√2 = [[0.707, 0, 0.707], [1.414, 0.707, 2.121], [2.121, 0.707, 2.828]]
```

**Step 4 – Softmax each row** (e^s / Σe^s):

```text
Row 1: e^0.707=2.028, e^0=1 → sum 5.056 → [0.401, 0.198, 0.401]
Row 2: subtract max 2.121 → e: [0.493, 0.243, 1] sum 1.736 → [0.284, 0.140, 0.576]
Row 3: subtract max 2.828 → e: [0.493, 0.120, 1] sum 1.613 → [0.306, 0.074, 0.620]
A = [[0.401, 0.198, 0.401], [0.284, 0.140, 0.576], [0.306, 0.074, 0.620]]   (each row sums to 1)
```

**Step 5 – Output Z = A·V** (weighted sum of value rows [1,0], [0,2], [1,2]):

```text
z₁ = 0.401[1,0] + 0.198[0,2] + 0.401[1,2] = [0.802, 1.198]
z₂ = 0.284[1,0] + 0.140[0,2] + 0.576[1,2] = [0.860, 1.432]
z₃ = 0.306[1,0] + 0.074[0,2] + 0.620[1,2] = [0.926, 1.388]
```

**Interpretation:** "AI" pays 62% attention to itself and 31% to "I"; each output is now a context-aware vector. Visualise A as a 3×3 heatmap (rows = queries, columns = keys).

**Tip:** If the exam gives only X (no W), take W = I so Q = K = V = X, and follow the same 5 steps.
