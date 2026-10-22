---
title: "20. Transformer Training & Scaling Challenges"
order: 20
---

## How LLMs are trained

**Pre-training: next-token prediction on trillions of tokens → Supervised fine-tuning (instructions) → RLHF / preference tuning → Deployment**

- Training tricks: Adam/AdamW, **learning-rate warm-up** then decay, dropout, **label smoothing**, gradient clipping, mixed precision (FP16/BF16).
- **Scaling laws:** loss falls predictably as parameters, data and compute grow (power law). Chinchilla: ~20 training tokens per parameter for compute-optimal.

## Challenges → solutions

| Challenge | Solution |
|---|---|
| **Quadratic attention cost** O(n²) memory/time in sequence length | FlashAttention, sparse/sliding-window attention, linear attention, KV-cache |
| Huge memory (model doesn't fit one GPU) | Data, tensor & pipeline parallelism, ZeRO/FSDP, gradient checkpointing, quantization |
| Compute cost & energy | Mixture-of-Experts, efficient architectures, distillation |
| Training instability (loss spikes) | Pre-LayerNorm, warm-up, gradient clipping, lower LR, BF16 |
| Data quality, bias, toxicity | Filtering, deduplication, RLHF, red-teaming |
| Hallucination | RAG, grounding, better alignment |
| Limited context length | RoPE scaling, ALiBi, long-context training |
| Slow inference | KV cache, speculative decoding, quantization (INT8/4), batching |
| Catastrophic forgetting during fine-tuning | LoRA / PEFT, small LR |
