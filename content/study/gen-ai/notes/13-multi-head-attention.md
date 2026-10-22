---
title: "13. Multi-Head Attention"
order: 13
diagram:
  direction: LR
  nodes:
    - { id: x, label: "Input X", tone: lime }
    - { id: h1, label: "Head 1: syntax", tone: cyan }
    - { id: h2, label: "Head 2: coreference", tone: violet }
    - { id: h3, label: "Head 3: nearby words", tone: amber }
    - { id: concat, label: "Concat", tone: coral }
    - { id: linear, label: "Linear W^O", tone: cyan }
    - { id: output, label: "Output", tone: lime }
  edges:
    - { from: x, to: h1 }
    - { from: x, to: h2 }
    - { from: x, to: h3 }
    - { from: h1, to: concat }
    - { from: h2, to: concat }
    - { from: h3, to: concat }
    - { from: concat, to: linear }
    - { from: linear, to: output }
---

> Instead of one attention, run **h attention "heads" in parallel**, each with its own W^Q, W^K, W^V, so each head can focus on a different type of relationship. Then concatenate and project.

```text
head_i = Attention( X W_i^Q, X W_i^K, X W_i^V )
MultiHead(X) = Concat(head₁, …, head_h) · W^O
Original: d_model = 512, h = 8, d_k = d_v = 512/8 = 64
```

- **Why multiple heads?** One softmax averages everything into one view. Multiple heads capture different relations simultaneously (grammar, meaning, position, coreference) in different subspaces → richer representation.
- Same total compute as single full-size head (because each head is d/h).
- Heads run in parallel → efficient on GPUs. Some heads become redundant (can be pruned).
