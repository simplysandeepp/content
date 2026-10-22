---
title: "11. Transformers — Motivation & Architecture"
order: 11
diagram:
  direction: TB
  nodes:
    - { id: in_embed, label: "Input embedding + PE", tone: lime }
    - { id: enc_attn, label: "Encoder: self-attention (×N)", tone: cyan }
    - { id: enc_ffn, label: "Encoder: FFN (×N)", tone: cyan }
    - { id: enc_out, label: "Encoder output (memory)", tone: violet }
    - { id: out_embed, label: "Output embedding + PE (shifted right)", tone: lime }
    - { id: dec_mask, label: "Decoder: masked self-attention", tone: coral }
    - { id: dec_cross, label: "Decoder: cross-attention", tone: coral }
    - { id: dec_ffn, label: "Decoder: FFN (×N)", tone: coral }
    - { id: lin_sm, label: "Linear + Softmax", tone: amber }
  edges:
    - { from: in_embed, to: enc_attn }
    - { from: enc_attn, to: enc_ffn }
    - { from: enc_ffn, to: enc_out }
    - { from: out_embed, to: dec_mask }
    - { from: dec_mask, to: dec_cross }
    - { from: enc_out, to: dec_cross, label: "K, V" }
    - { from: dec_cross, to: dec_ffn }
    - { from: dec_ffn, to: lin_sm }
---

> The **Transformer** ("Attention Is All You Need", Vaswani et al., 2017) is a neural network that processes a whole sequence **in parallel** using **self-attention** instead of recurrence. It is the backbone of LLMs (GPT, BERT, Claude, T5) and of text conditioning in image models.

## Why Transformers? (motivation)

| Problem with RNN / LSTM | Transformer solution |
|---|---|
| Sequential – one token at a time, slow, can't use GPUs fully | All tokens processed in parallel |
| Long-range dependency is lost (vanishing gradient) | Any token directly attends to any other (path length 1) |
| Fixed-size hidden state bottleneck | Every token has its own contextual vector |
| Hard to scale | Scales to billions of parameters → LLMs |

## Full architecture (Q55) — the diagram above

## Encoder layer (Q55, Q60, Q62)

1. **Input embedding:** each token → d_model-dim vector (512).
2. **+ Positional encoding** (adds word order).
3. **Multi-head self-attention:** each word looks at all words and collects context.
4. **Add & Norm:** residual connection **x + Sublayer(x)**, then LayerNorm.
5. **Position-wise Feed-Forward:** FFN(x) = max(0, xW₁ + b₁)W₂ + b₂, inner size 2048, applied to every token separately.
6. **Add & Norm** again. Repeat N = 6 times. Output = contextual embeddings.

- **Residual connection:** lets gradient flow directly through deep stacks, avoids vanishing gradient, keeps original info.
- **Layer normalisation:** normalises each token's features to mean 0, variance 1 → stable and faster training (unlike BatchNorm, independent of batch size).
- **Encoder-only models:** BERT, RoBERTa → understanding tasks (classification, NER, embeddings).

## Contextual embeddings (Q60)

Sentences: (1) "I deposited money in the **bank**." (2) "We sat on the river **bank**." (3) "You can **bank** on me." The static word vector for "bank" is the same at input, but after self-attention it mixes with "money", "river", "on me" → three **different** output vectors (finance / land / rely). Cosine similarity between (1) and (2) "bank" vectors is low. This is why Transformers handle polysemy, unlike Word2Vec.

## Text classification with an encoder (Q62)

**"Movie was great" → Tokenizer: [CLS] movie was great [SEP] → Embeddings + PE → BERT encoder layers → [CLS] vector / mean pooling → Linear + Softmax → Positive 0.97**

Training objective: cross-entropy loss between predicted class distribution and true label; fine-tune whole model (lr ≈ 2e-5).
