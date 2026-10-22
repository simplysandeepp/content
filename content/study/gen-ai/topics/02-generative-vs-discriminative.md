---
title: "Generative vs Discriminative Models"
order: 2
tagline: "Learning the joint distribution P(x,y) versus learning the decision boundary P(y|x) directly"
definition: "A generative model learns the joint distribution P(x,y) and can generate new data; a discriminative model learns P(y|x) directly to separate classes, without modeling how the data itself was produced."
tags: ["Fundamentals", "Bayes", "Classification"]
---

## TL;DR
A generative model learns how the data is *produced* — the joint distribution `P(x,y)` — and can
therefore generate new samples and also classify by applying Bayes' theorem. A discriminative model
only learns the *decision boundary* `P(y|x)` between classes, which is usually easier and gives
better raw classification accuracy, but can't generate new data.

## Why it matters
This distinction is the reason "generative AI" is called generative in the first place — the whole
field is about models in the first bucket. It also shows up constantly in exam questions comparing
Naive Bayes vs Logistic Regression, or GMM vs SVM, so the comparison table below is worth memorizing
cold.

## The core idea
Simple shabdo mein: a discriminative model is like a student who only learns "which side of the line
does this answer fall on" — great at getting the label right, but ask it to *produce* a new example
of class A and it has no idea where to start, because it never modeled what class A data actually
looks like. A generative model is like a student who actually learned how each class's data is
generated — so it can both classify *and* generate new examples.

Formally: a discriminative model directly learns `P(y|x)` — the probability of a label given the
input — by learning a decision boundary. A generative model learns `P(x|y)` and `P(y)` for each
class, and gets `P(y|x)` only indirectly, via Bayes' theorem.

## How it works
1. Generative approach: model each class's data distribution `P(x|y)` plus the class prior `P(y)`.
2. To classify a new point, apply Bayes' theorem to flip `P(x|y)` into `P(y|x)`.
3. To generate, just sample `x` from the learned `P(x|y)` for the class you want.

Discriminative approach skips steps 1 and 3 entirely — it directly fits a function (boundary) that
maps `x → P(y|x)`, with no notion of how `x` itself is distributed.

## The maths
**Bayes' theorem**
`P(y|x) = P(x|y) P(y) / P(x)`, where `P(x) = Σ_y P(x|y) P(y)`.

Here `P(y|x)` is the posterior (probability of label `y` given the observed input `x`), `P(x|y)` is
the likelihood (how likely this input is under class `y`'s learned distribution), `P(y)` is the prior
(how common class `y` is overall), and `P(x)` is the evidence — the total probability of seeing `x`
across all classes, used purely to normalize.

Generative models learn the joint `P(x,y)` (via `P(x|y)` and `P(y)`, then apply Bayes to get
`P(y|x)`); discriminative models learn `P(y|x)` directly, with no model of `P(x)` at all.

## Comparison table

| Aspect | Generative | Discriminative |
|---|---|---|
| Learning objective | Model how data is generated | Model the decision boundary |
| Probability distribution | Joint `P(x,y)` (via `P(x\|y)`, `P(y)`) | Conditional `P(y\|x)` directly |
| Training process | Estimate per-class distributions + priors | Directly optimize boundary/classifier parameters |
| Decision boundary | Derived indirectly via Bayes' theorem | Learned explicitly and directly |
| Data requirements | Needs enough data to model full distribution per class (more data-hungry) | Needs less data for comparable classification accuracy |
| Applications | Image/text/audio generation, anomaly detection, data augmentation | Spam filtering, image classification, sentiment analysis |

## Algorithm examples
- **Generative**: Naive Bayes, Gaussian Mixture Models (GMM), Hidden Markov Models.
- **Discriminative**: Logistic Regression, Support Vector Machines (SVM), standard feed-forward
  Neural Networks trained for classification.

## Worked example
Consider a simple 2-class problem: classify a fruit as **apple** or **orange** using one feature,
weight in grams. Say apples cluster around 150g and oranges around 200g (illustrative numbers).

- **Generative approach (e.g. Naive Bayes / GMM)**: it fits a Gaussian `P(weight | apple)` centered
  near 150g and another Gaussian `P(weight | orange)` centered near 200g, plus priors `P(apple)` and
  `P(orange)` from the class frequencies in training data. To classify a new fruit of weight `w`, it
  computes `P(apple|w)` and `P(orange|w)` via Bayes' theorem and picks the larger one. Bonus: it can
  also *sample* a brand-new plausible weight from either Gaussian — that's the generative part.
- **Discriminative approach (e.g. Logistic Regression / SVM)**: it never models the shape of either
  class's weight distribution at all. It directly fits a boundary — say, "if weight > 175g, call it
  orange, else apple" — by optimizing that threshold (or a sigmoid over it) to minimize classification
  error on the training data. It can tell you the label for a new weight `w`, but it has no way to
  generate a new plausible apple or orange weight — it never learned what either class's data
  actually looks like, only where the line between them sits.

Both can land on the same decision boundary here, but only the generative model can answer "give me
a new apple-like weight."

## Exam traps
- Don't say discriminative models are "always more accurate" — generically true for pure
  classification with enough data, but generative models can win with very little training data
  since they encode more structural assumptions.
- Don't confuse "generative model" with "neural network generative model" — Naive Bayes and GMM are
  fully generative and have nothing to do with deep learning.
- The evidence term `P(x)` is a normalizer only — discriminative models never need to compute it,
  which is part of why they're often computationally simpler.
- A model can use the same underlying algorithm family (e.g. neural nets) in either a generative or
  discriminative way — it's the *objective* (`P(x,y)` vs `P(y|x)`) that defines the category, not the
  architecture.

## Remember this
Generative learns how data is made and classifies via Bayes' theorem; discriminative learns only the
boundary between classes — that one distinction is why only generative models can create new samples.
