---
title: "16. Decoder Architecture & Text Generation"
order: 16
---

## Decoder layer

1. **Masked (causal) multi-head self-attention:** token t can only see tokens 1…t. Implemented by adding −∞ to scores above the diagonal before softmax → those weights become 0. Prevents "cheating" by looking at future words.
2. Add & Norm.
3. **Cross-attention** to encoder output (only in encoder–decoder models like T5; **GPT-style decoder-only models skip it**).
4. Add & Norm → Feed-forward → Add & Norm.
5. **Output projection:** Linear layer d_model → vocabulary size, then **softmax** → probability of every possible next token.

```text
Causal mask M (4 tokens): [[0, −∞, −∞, −∞], [0, 0, −∞, −∞], [0, 0, 0, −∞], [0, 0, 0, 0]]

Masked attention = softmax( (QK^T / √d_k) + M ) V
```

## Autoregressive generation

**Prompt "The sky is" → Tokenize → IDs → Decoder stack → Softmax over vocab → Pick "blue" → Append & repeat → Stop at EOS / max length**

**Training:** teacher forcing — feed correct previous tokens, predict next token, cross-entropy loss: L = −Σ_t log P(x_t | x_\<t). All positions trained in parallel thanks to the mask.

## Decoding strategies

| Method | How | Diversity | Coherence |
|---|---|---|---|
| Greedy | Always pick highest-prob token | None, repetitive | High but boring, loops |
| Beam search | Keep top-B sequences | Low | High (good for translation) |
| Temperature T | softmax(logits / T); T\<1 sharper, T\>1 flatter | Increases with T | Drops if T too high |
| Top-k | Sample only from k most likely tokens | Medium | Good |
| Top-p (nucleus) | Sample from smallest set with cumulative prob ≥ p (e.g. 0.9) | Adaptive, good | Good (best balance) |
