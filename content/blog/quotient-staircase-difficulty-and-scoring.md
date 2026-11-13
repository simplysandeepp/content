---
title: "Scoring an Adaptive Test — Staircase Difficulty, Effective-Difficulty Raw Scores and z-Scores"
description: "The maths inside Quotient: a simple staircase that picks the next difficulty, why percent-correct is the wrong raw score for an adaptive test, and how a raw score becomes a z-score, a 100/15 display score and a percentile using an erf approximation."
metaDescription: "How an adaptive quiz can be scored — staircase difficulty, mean effective difficulty as the raw score, z-score, 100/15 scale and a normal-CDF percentile."
date: "2026-09-12"
tags: ["Adaptive Testing", "Statistics", "TypeScript", "Psychometrics", "Dev Log"]
published: true
---

A quiz that adapts to you creates an interesting scoring problem. This post walks through the small amount of maths in Quotient and the reasoning behind each choice. I'm not a psychometrician; this is a transparent heuristic, and the code comments say so.

## The Staircase

Quotient picks each question's difficulty (1–10) from the history of responses in that domain. The rules, in `adaptive.ts`:

- Start at difficulty **4**.
- After **3 consecutive correct** answers, go up one level.
- After **2 consecutive incorrect** answers, go down one level.
- Clamp to the 1–10 range.

Going down faster than going up is deliberate: it stops a user from sitting on questions they are failing. The function is pure — it takes the ordered history and a config object and returns a number — so it is trivial to unit test (streak boundaries, clamping at both ends, empty history).

A more principled option is a 2-parameter logistic IRT model. I left that as a documented stretch goal because a staircase is easy to explain and debug, and "ships and is understandable" beats "correct and opaque" for a v1.

## Why Percent-Correct Is the Wrong Score

If difficulty adapts, almost everybody ends up answering about the same fraction correctly — the staircase *drives* them to it. Two people with very different ability can both score roughly 60%. What differs is the **difficulty level they settle at**.

So the raw score for a domain is the mean *effective difficulty* of its responses:

```ts
sum += difficultyAtTime + (isCorrect ? 0.5 : -0.5)
raw = sum / responses.length
```

Each answer contributes the difficulty it was served at, nudged up half a point when correct and down half a point when wrong. That keeps the raw score on the same 1–10 scale as difficulty, which matters for the next step.

## From Raw Score to Display Score

1. **z-score:** `z = (raw − mean) / stdDev` against a norm bucket for the user's age band and education level (`0` if the standard deviation is zero).
2. **Display scale:** `100 + 15 × z`, the familiar mean-100, SD-15 convention.
3. **Percentile:** the standard normal CDF of `z`, times 100. There is no `erf` in JavaScript's `Math`, so the CDF uses the Abramowitz & Stegun 7.1.26 approximation — five constants and a polynomial, accurate to about 1e-7 for this purpose.

The **composite** is the mean of the per-domain display scores, treated as itself roughly Normal(100, 15). That is a documented simplification: it skips a separate composite norm row, at the cost of ignoring correlation between domains.

## The Honest Part: The Norms Are Synthetic

The norm buckets are seeded, not measured. The baseline mean sits near the staircase's starting difficulty (5) with a standard deviation of 1.5, plus small fixed offsets by education level and age band so a cohort comparison *looks* plausible. They are illustrative only and not derived from any study. A percentile from this app demonstrates the pipeline; it doesn't measure anyone. If a bucket is missing, `resolveNormBucket` logs a warning and computes the synthetic baseline on the fly instead of failing the whole scoring job.

## Design Choices That Helped

- **Share the maths.** `normalize.ts` is used by both the live scoring path and the seed script, so a demo user's seeded scores can't drift from what real scoring would produce.
- **Make scoring idempotent.** `computeSessionScores` deletes existing score rows for the session before writing, so re-running it after a fix is safe.
- **Test the boundaries.** The tests cover the streak thresholds, clamping, and the normalisation functions, which are exactly the places off-by-one mistakes live.

If I were to take this further, the first step would be collecting enough real responses to replace the synthetic buckets, and only then consider IRT.
