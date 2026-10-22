---
title: "18. Prompt Engineering"
order: 18
---

> **Prompt engineering** is designing the input text to an LLM so that it produces the desired output — without changing the model's weights (in-context learning).

## Same task, three styles: sentiment classification

```text
ZERO-SHOT:
Classify the sentiment of this review as Positive or Negative.
Review: "The battery dies in two hours."
Sentiment:

ONE-SHOT:
Review: "Amazing camera quality!"  Sentiment: Positive
Review: "The battery dies in two hours."  Sentiment:

FEW-SHOT:
Review: "Amazing camera quality!"  Sentiment: Positive
Review: "Screen cracked on day one."  Sentiment: Negative
Review: "Fast delivery and great price."  Sentiment: Positive
Review: "The battery dies in two hours."  Sentiment:
```

| Type | Examples given | Best when |
|---|---|---|
| Zero-shot | 0, only instruction | Simple / common task, large capable model |
| One-shot | 1 | Need to show output format |
| Few-shot | 2–10 | Custom labels, tricky format, domain-specific task |

## Chain-of-Thought (CoT)

```text
Q: A shop has 23 apples, uses 20 and buys 6 more. How many now?
A: Let's think step by step. 23 − 20 = 3. 3 + 6 = 9. Answer: 9.
```

Asking the model to show intermediate reasoning ("Let's think step by step") improves maths, logic and multi-step questions. Variants: few-shot CoT, self-consistency (sample many chains, majority vote), Tree-of-Thought.

## Comparison of prompting types

| Type | Purpose | Advantage | Limitation | Application |
|---|---|---|---|---|
| Instruction | Clear direct command | Simple, fast | Ambiguity if vague | Summaries, emails |
| Role | "You are a senior doctor…" | Sets tone, expertise, style | Doesn't add real knowledge | Tutors, customer support |
| One/Few-shot | Teach by examples | Format control, no training | Uses context tokens, example bias | Classification, extraction |
| Structured reasoning (CoT) | Step-by-step thinking | Better accuracy on reasoning | Longer, slower, reasoning can still be wrong | Maths, planning, diagnosis |

**Good prompt recipe:** Role + Task + Context + Constraints + Output format + Examples.
