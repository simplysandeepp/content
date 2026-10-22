---
title: "Prompt Engineering – Zero-shot, One-shot, Few-shot & Chain-of-Thought Prompting"
order: 13
tagline: "Same task, four prompts — how much example and reasoning scaffolding you give changes everything"
definition: "Prompt engineering shapes a model's output by how a request is phrased — from zero-shot (no examples) through few-shot (a handful of examples) to chain-of-thought (asking the model to reason step by step) — without changing any model weights."
tags: ["Prompt Engineering", "Few-shot Learning", "Chain-of-Thought", "LLMs"]
---

## TL;DR
Zero/one/few-shot describe how many worked examples you put in the prompt before asking the real
question; chain-of-thought asks the model to show intermediate reasoning before its final answer.
All four are ways of shaping an LLM's output without touching its weights.

## Why it matters
Prompt engineering is the cheapest lever you have over an LLM's behavior — no fine-tuning, no extra
infrastructure, just structuring the input. Picking the right style (and knowing when fancier isn't
better) is directly relevant to anyone building on top of an LLM, and it's a favorite exam topic
because it's easy to test with a concrete example.

## The core idea
All four techniques are about **in-context learning** — giving the model information inside the
prompt itself, at inference time, rather than training it further:

- **Zero-shot**: just the instruction, no examples. The model relies entirely on what it already
  learned during pretraining.
- **One-shot**: the instruction plus exactly one worked example, mainly to pin down the expected
  output format/label vocabulary.
- **Few-shot**: the instruction plus several worked examples (typically covering different classes
  or edge cases), so the model can infer the pattern/boundary from multiple demonstrations.
- **Chain-of-thought (CoT)**: the prompt explicitly asks the model to reason step by step before
  giving a final answer — either by instruction ("think step by step") or by showing an example
  whose demonstrated answer includes visible reasoning steps.

## How it works
Below is the **same task** — classifying a review's sentiment as Positive, Negative, or Mixed —
written in all four styles, so the contrast is visible directly.

**Zero-shot**
```
Classify the sentiment of this review as Positive, Negative, or Mixed.

Review: "The battery life is amazing but the screen cracked within a week."
Sentiment:
```

**One-shot**
```
Classify the sentiment of the review as Positive, Negative, or Mixed.

Review: "This laptop runs so fast and the design is sleek."
Sentiment: Positive

Review: "The battery life is amazing but the screen cracked within a week."
Sentiment:
```

**Few-shot**
```
Classify the sentiment of the review as Positive, Negative, or Mixed.

Review: "This laptop runs so fast and the design is sleek."
Sentiment: Positive

Review: "Terrible purchase, it stopped working after two days."
Sentiment: Negative

Review: "Great camera, but the battery drains too quickly."
Sentiment: Mixed

Review: "The battery life is amazing but the screen cracked within a week."
Sentiment:
```

**Chain-of-thought**
```
Classify the sentiment of the review as Positive, Negative, or Mixed. Think step by step about
each aspect mentioned before giving the final answer.

Review: "The battery life is amazing but the screen cracked within a week."
Reasoning: The review mentions two aspects — battery life (positive) and screen durability
(negative). Since a clear positive and a clear negative are both present, the overall sentiment
is mixed rather than purely one or the other.
Sentiment: Mixed
```

Notice the few-shot example is also the one most likely to correctly produce "Mixed" rather than
forcing a binary Positive/Negative choice — simply because it's the only style that *demonstrates*
the Mixed class exists before the real question arrives.

## When each is most suitable
- **Zero-shot**: simple, common tasks where the model's pretraining already covers the pattern well
  (e.g. basic sentiment, well-known formats); cheapest in tokens and latency.
- **One-shot**: when the task itself is easy but the exact **output format** or label vocabulary
  needs to be pinned down (e.g. you want "Positive"/"Negative" and not "This review is positive").
- **Few-shot**: when the task has subtle categories, ambiguous edge cases, or an unusual output
  format — showing multiple examples (ideally covering the edge cases, like the "Mixed" class above)
  teaches the boundary more reliably than an instruction alone, and matters more for smaller or less
  instruction-tuned models.
- **Chain-of-thought**: whenever the task needs multi-step reasoning — arithmetic, logical
  deduction, multi-aspect judgment calls like the mixed-sentiment example. Forces the model to
  externalize intermediate steps, which measurably reduces careless errors on reasoning-heavy tasks,
  at the cost of more output tokens and latency.

## Related techniques
- **Instruction prompting**: giving an explicit natural-language instruction about the task and
  desired output, without necessarily including examples — e.g. "Respond with exactly one word:
  Positive, Negative, or Mixed." This can be combined with any of the four styles above.
- **Role prompting**: assigning the model a persona to bias its style, tone, or assumed expertise —
  e.g. "You are an expert product reviewer analyzing customer feedback." Also composable with
  zero/few-shot and CoT; it doesn't replace them.

## Worked example
Applying the few-shot prompt above: the model has now seen one Positive, one Negative, and one
Mixed example before the real review. Given that the real review explicitly states one positive
aspect (battery) and one negative aspect (screen), the few-shot context makes "Mixed" the pattern-
consistent answer — compare this to the zero-shot version, which (with no demonstrated Mixed class)
is more likely to force a binary Positive-or-Negative call.

## Exam traps
- Few-shot isn't just "more examples = better" — beyond a handful, extra examples mostly add cost
  without improving accuracy, and can even hurt if the examples are inconsistent or unrepresentative.
- CoT's value is specifically for **reasoning** tasks — it doesn't meaningfully improve trivial
  lookup/classification tasks, so proposing CoT as the universal fix is a common wrong "because it's
  fancier" answer.
- Don't conflate few-shot prompting with fine-tuning — no weights change; all of this happens purely
  via the prompt's context at inference time.
- Instruction and role prompting are **complementary modifiers**, not alternatives to zero/one/
  few-shot/CoT — a prompt can combine a role, an instruction, and a few examples all at once.

## Remember this
Zero/one/few-shot vary how many demonstrations you give; CoT varies whether you ask for visible
reasoning — pick based on whether the task's difficulty is in knowing the *pattern* (more examples
help) or in *reasoning through* the answer (CoT helps).
