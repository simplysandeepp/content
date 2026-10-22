---
title: "2. Generative vs Discriminative Models"
order: 2
---

## Joint vs conditional probability

> **Joint probability P(X, Y)**: probability that X and Y happen *together*. Example: P(email contains "free" AND is spam) = 0.12. **Used by generative models.** Applications: Naïve Bayes spam filter, HMM speech recognition, GMM clustering, image generation.

> **Conditional probability P(Y | X)**: probability of Y *given* X has happened. Example: P(spam | email contains "free") = 0.80. **Used by discriminative models.** Applications: Logistic regression credit scoring, SVM / CNN image classification, sentiment analysis.

## Bayes' theorem link (derivation)

```text
P(X, Y) = P(X | Y) · P(Y) = P(Y | X) · P(X)

⇒ P(Y | X) = P(X | Y) · P(Y) / P(X),  where P(X) = Σ_y P(X | y) P(y)

Posterior = Likelihood × Prior / Evidence
```

- **Generative** learns P(X|Y) and P(Y) (i.e. the joint P(X,Y)), then uses Bayes to get P(Y|X). It can also **generate** new X by sampling from P(X|Y).
- **Discriminative** learns P(Y|X) **directly** (or just a decision boundary). It cannot generate data.
- Decision rule for both: ŷ = argmax_y P(y|x). For generative: argmax_y P(x|y)P(y) (P(x) is same for all classes so ignored).

The accompanying illustration showed two classes side by side: generative models learn a region/likelihood (overlapping blobs) around each class — "what does each class look like?" (learns P(x|y)·P(y)) — while discriminative models just learn a single direct separating boundary line between the classes — "which side of the line?" (learns P(y|x)).

## Comparison table (Q5, Q7)

| Basis | Generative | Discriminative |
|---|---|---|
| Learning objective | Model how data is generated: P(X,Y) or P(X|Y)P(Y) | Model the boundary: P(Y|X) |
| Probability | Joint distribution | Conditional distribution |
| Training | Maximise likelihood of data (e.g., count/estimate means, variances) | Minimise classification loss (cross-entropy, hinge) |
| Decision boundary | Indirect (via Bayes), often simple/quadratic | Directly optimised, can be very flexible |
| Data needed | Works with less data; handles missing data; can use unlabeled data | Needs more labelled data, but more accurate when data is large |
| Assumptions | Strong (e.g., feature independence in NB) | Fewer assumptions |
| Can generate data? | Yes | No |
| Outliers / unseen data | Can detect (low P(x)) | Gives confident answer even for weird inputs |
| Complexity | Harder in high dimensions (model full x) | Usually cheaper |
| Examples | Naïve Bayes, GMM, HMM, LDA, VAE, GAN, Diffusion, GPT | Logistic Regression, SVM, Decision Tree, Random Forest, CNN, BERT classifier |

## Naïve Bayes vs Logistic Regression on the same binary problem (Q8)

Task: classify email as Spam (1) / Not spam (0) using word features x = (x₁ … xₙ).

**Naïve Bayes (generative)**

```text
P(y|x) ∝ P(y) · Π_i P(x_i|y)
```

- Assumption: features independent given class.
- Training: count word frequencies per class (closed form, very fast).
- Decide: pick class with larger P(y)ΠP(x_i|y).
- + fast, works with small data. − independence assumption often false → poor calibration.

**Logistic Regression (discriminative)**

```text
P(y=1|x) = σ(wᵀx + b) = 1 / (1 + e^(−(wᵀx+b)))
```

- Assumption: log-odds linear in x.
- Training: minimise binary cross-entropy with gradient descent.
- Decide: spam if σ(wᵀx+b) > 0.5 → linear boundary wᵀx+b=0.
- + higher accuracy with more data, handles correlated features. − needs labels, can't generate.

**Tip:** Famous result (Ng & Jordan): NB reaches its best accuracy **faster** (less data); LR reaches **lower final error** with enough data.

## Multi-class image classification system design (Q9)

- **Pipeline:** images → preprocessing (resize, normalise) → feature extraction (CNN features / HOG) → classifier.
- **Generative branch:** GMM per class or Gaussian NB → P(x|class)·P(class) → argmax. Gives probability of the input itself, so it can flag **unseen / out-of-distribution** images.
- **Discriminative branch:** Softmax regression / SVM / CNN → learns boundaries directly → highest accuracy.
- **Justified choice:** for a practical system with enough labelled images, use a **CNN (discriminative)** for accuracy; add a generative model (or VAE reconstruction error) for OOD detection or data augmentation when data is small.
