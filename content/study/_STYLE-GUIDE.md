# /study content style guide

Internal doc, not rendered on the site (the loader only reads `content/study/<subject>/topics/*.md`
and `content/study/<subject>/practice/*.md`). Read this before writing any study content, for gen-ai
or any future subject.

## Goal

Exam-prep notes for Sandeep's own mid-semester exam. Accuracy beats flair — a student reading this
the night before an exam must come away with the *correct* mechanism, the *correct* formula, and a
worked example they can reproduce on paper. No filler, no hallucinated statistics, no invented
citations. Every item in a batch should feel like it was written by the same person, at the same
depth, in the same voice.

## Tone

Mostly clear technical English, written the way a sharp senior engineer explains something to a
junior over chai — not a textbook, not a press release. Mix in natural, light Hinglish for intuition
and connective tissue ("Yaha samajhna zaroori hai ki...", "Simple shabdo mein,", "Matlab,"), **not**
inside formulas, derivations, or technical definitions, which stay precise. Don't overdo the
Hinglish — a sentence or two per section is plenty, never a whole paragraph of transliteration.

## Anti-hallucination rules

- Use the canonical formulas below, verbatim notation. Don't invent alternative derivations.
- If a question's source text lost specific numbers (garbled copy-paste, e.g. missing subscripted
  values), say so in one line and then work the method with clearly-labelled **illustrative** numbers
  ("example values — the question's source lost the exact numbers, so here's the method applied to
  representative ones you can redo with the real ones"). Never present invented numbers as if they
  were the original question's.
- No fabricated benchmark numbers, paper names, or dates. Qualitative claims ("significantly more
  stable training", "commonly used in production RAG systems") are fine; invented statistics are not.
- For the four "implement in Python" practice questions, write genuinely correct, idiomatic
  PyTorch — code that would actually run, not pseudocode dressed as code.

## File format

Topic: `content/study/<subject>/topics/<nn>-<slug>.md`
```yaml
---
title: "Variational Autoencoders (VAE)"
order: 3
tagline: "A probabilistic autoencoder that learns to generate new, similar data"
tags: ["VAE", "Latent Space", "ELBO"]
diagram:            # optional — omit the whole key if the topic doesn't need one
  direction: LR      # LR or TB
  nodes:
    - { id: x, label: "Input x", tone: lime }
    - { id: enc, label: "Encoder", tone: cyan }
    - { id: z, label: "Latent z (μ, σ)", tone: violet }
    - { id: dec, label: "Decoder", tone: cyan }
    - { id: xhat, label: "Reconstruction x̂", tone: lime }
  edges:
    - { from: x, to: enc }
    - { from: enc, to: z, label: "encode" }
    - { from: z, to: dec, label: "reparameterize" }
    - { from: dec, to: xhat }
---
(markdown body)
```
`tone` is one of `lime | coral | cyan | violet | amber`. Keep 4–7 nodes, labels short (under ~24
chars — longer wraps automatically but gets cramped). At most **one** diagram per file; a second flow
inside the body, if needed, is a plain arrow chain in prose (`noise → U-Net → denoise → repeat ×T →
image`), not a second diagram block.

Practice: `content/study/<subject>/practice/q<NN>.md` (NN zero-padded, matches the question number)
```yaml
---
title: "Fundamentals of Generative AI for medical image augmentation"   # short label for the card
question: "Explain the fundamental mechanism of Generative AI. ..."      # the FULL original question, verbatim
order: 1
tags: ["Fundamentals", "Use Cases"]
diagram:   # optional, same shape as above
---
(markdown body = the answer)
```

## Topic body template

```
## TL;DR
One or two lines — the whole idea in plain words.

## Why it matters
Where this shows up in real Generative AI systems.

## The core idea
Plain-word explanation first, Hinglish-flavoured intuition welcome here. Then get precise.

## How it works
Step by step. This is where the diagram (if any) belongs — reference it, don't just drop it cold.

## The maths
Every formula from the canonical sheet that applies, with every symbol defined in words right
below it. Don't assume the reader remembers what σ or β_t means from ten lines ago.

## Worked example
A small, concrete numeric or illustrative walkthrough.

## Exam traps
2–4 bullets: things that sound right but aren't, or details examiners love to probe.

## Remember this
One line to carry out of the room.
```

## Practice-answer body template

```
## What's actually being asked
One line restating the question in plain terms, so the answer's structure is obvious.

## Answer
Full structured answer — headings/bullets matching every part of the question. Diagram, formulae
(every symbol defined), derivation steps shown (not just the final line), worked example where the
question is numeric or asks for an implementation.

## Exam tip
1–3 lines: how to score full marks on this one, or a common mistake to avoid.
```

Target length: topics ~1000–1700 words; practice answers ~500–1100 words depending on how many parts
the question has. Consistency across a batch matters more than hitting an exact number.

## Canonical formula sheet

**Bayes' theorem**
`P(y|x) = P(x|y) P(y) / P(x)`, where `P(x) = Σ_y P(x|y) P(y)`.
Generative models learn the joint `P(x,y)` (via `P(x|y)` and `P(y)`, then apply Bayes to get
`P(y|x)`); discriminative models learn `P(y|x)` directly, no model of `P(x)`.

**VAE**
- Encoder outputs `μ(x)`, `σ(x)` parameterizing `q(z|x) = N(μ, σ²)`.
- Reparameterization trick: `z = μ + σ ⊙ ε`, `ε ~ N(0, I)` — makes sampling differentiable.
- Decoder: `p(x|z)`.
- ELBO: `log p(x) ≥ 𝔼_{q(z|x)}[log p(x|z)] − D_KL(q(z|x) ‖ p(z))`; training maximizes this (⇔
  minimizes the negative ELBO = reconstruction loss + KL loss).
- Loss: `L(θ,φ;x) = −𝔼_{q_φ(z|x)}[log p_θ(x|z)] + D_KL(q_φ(z|x) ‖ p(z))`.
- Closed-form KL vs a standard normal prior, per latent dim `j`, summed over dims:
  `D_KL = −½ Σ_j (1 + log σ_j² − μ_j² − σ_j²)`.

**GAN**
- Value function: `min_G max_D V(D,G) = 𝔼_{x∼p_data}[log D(x)] + 𝔼_{z∼p_z}[log(1 − D(G(z)))]`.
- Discriminator: maximizes `log D(x) + log(1 − D(G(z)))`.
- Generator (saturating, original): minimizes `log(1 − D(G(z)))`.
- Generator (non-saturating, used in practice): maximizes `log D(G(z))` instead — stronger
  gradients early in training, when D easily rejects G's samples.
- cGAN: condition `y` fed to both networks — `G(z|y)`, `D(x|y)`; objective becomes
  `min_G max_D 𝔼[log D(x|y)] + 𝔼[log(1 − D(G(z|y)|y))]`.

**DDPM diffusion**
- Forward (fixed, no learning): `q(x_t|x_{t-1}) = N(x_t; √(1−β_t) x_{t-1}, β_t I)`.
- Closed form at any `t`: `x_t = √(ᾱ_t) x_0 + √(1−ᾱ_t) ε`, `ε ~ N(0,I)`, where `α_t = 1 − β_t` and
  `ᾱ_t = Π_{s=1}^{t} α_s` (cumulative product — note it shrinks as `t` grows, so the `x_0` term's
  weight shrinks and the noise term's weight grows with `t`).
- Reverse process is learned: a network predicts the noise `ε_θ(x_t, t)`; training loss
  `𝔼[‖ε − ε_θ(x_t,t)‖²]`.

**Transformers**
- Self-attention: `Q = XW_Q`, `K = XW_K`, `V = XW_V`;
  `Attention(Q,K,V) = softmax(QK^T / √d_k) V` (the `√d_k` scaling keeps dot products from getting
  too large and pushing softmax into tiny-gradient regions).
- Multi-head: `head_i = Attention(QW_Q^i, KW_K^i, VW_V^i)`;
  `MultiHead(Q,K,V) = Concat(head_1,...,head_h) W_O`.
- Sinusoidal positional encoding: `PE(pos,2i) = sin(pos / 10000^(2i/d_model))`,
  `PE(pos,2i+1) = cos(pos / 10000^(2i/d_model))`.
- Cross-attention: same formula as self-attention, but `Q` comes from the decoder's own sequence
  while `K` and `V` come from the encoder's output — lets the decoder "look up" encoder context.
- KL divergence, general definition: `D_KL(P‖Q) = Σ_x P(x) log(P(x)/Q(x))`.

## ArchDiagram — when to use one

Strongly suggested for: VAE, GAN (concept + architecture), Conditional GAN, StyleGAN, Diffusion
models, Transformer encoder, Transformer decoder, RAG. Optional elsewhere — a clean arrow-chain in
prose is fine for simpler topics.
