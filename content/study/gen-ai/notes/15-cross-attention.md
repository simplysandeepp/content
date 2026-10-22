---
title: "15. Cross-Attention"
order: 15
---

> **Cross-attention** is attention between **two different sequences**: **Queries come from the decoder** (what is being generated), **Keys and Values come from the encoder output** (the source). It lets the decoder "look back" at the input while generating each output token.

```text
CrossAttn = softmax( Q_dec K_enc^T / √d_k ) V_enc
```

**Translation example:** English "I love India" → Hindi "मैं भारत से प्यार करता हूँ". When the decoder is generating "भारत", its query matches the key of "India" most strongly → it takes the value (meaning) of "India". This gives soft **alignment** between source and target words.

| | Self-attention | Cross-attention |
|---|---|---|
| Q, K, V from | same sequence | Q: decoder; K, V: encoder |
| Purpose | context within sequence | connect output to input |
| Used in | encoder & decoder | decoder of seq2seq (T5, translation), Stable Diffusion U-Net (image Q, text K/V), Whisper |
