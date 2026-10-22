---
title: "Introduction to Generative AI – Use Cases and Types"
order: 1
tagline: "What generative AI actually does, the main model families, and where it's used in the real world"
definition: "Generative AI models learn the underlying data distribution so they can produce new, original samples — images, text, audio — rather than just classify or score existing ones."
tags: ["Fundamentals", "Use Cases", "Model Families"]
---

## TL;DR
Generative AI learns the underlying pattern (distribution) of training data well enough to produce
new, original samples that look like they came from the same distribution — new images, text, audio,
code, whatever the domain is.

## Why it matters
Almost every "AI tool" headline since 2022 — ChatGPT, Midjourney, voice clones, code copilots — is a
generative model under the hood. Understanding what family a tool belongs to tells you what it's good
at and where it'll break (a GAN is great at sharp images but unstable to train; a diffusion model is
stable but slow at inference; an autoregressive model is great at sequences but generates one token
at a time). This topic is the map — each family gets its own deep-dive later in this course.

## The core idea
Simple shabdo mein: a discriminative model answers "what is this?" (classify), a generative model
answers "give me something new like this." It does that by learning (explicitly or implicitly) the
probability distribution `P(x)` of the training data — or the joint `P(x,y)` if labels are involved —
and then **sampling** from that learned distribution to create new data points that were never in the
training set but are statistically plausible members of it.

The hard part is that real-world data distributions (natural images, fluent language, music) are
extremely high-dimensional and complex. Different model families take different mathematical routes
to approximate and sample from that distribution.

## How it works
At a map level, the major families this course covers are:

- **VAE (Variational Autoencoder)** — compresses input into a probabilistic latent space `z`, then
  decodes `z` back into data. Learns an explicit, tractable lower bound on `P(x)` (the ELBO). Fast to
  sample, but outputs tend to be a little blurry since it optimizes a bound, not the true likelihood.
- **GAN (Generative Adversarial Network)** — two networks, a Generator and a Discriminator, play a
  minimax game against each other until the Generator's fakes are indistinguishable from real data.
  Produces sharp samples, fast single-pass generation, but training is notoriously unstable (mode
  collapse, vanishing gradients — covered in later topics).
- **Autoregressive models** — generate data one piece at a time, each piece conditioned on everything
  generated so far: `P(x) = Π_i P(x_i | x_1,...,x_{i-1})`. GPT-style language models are the classic
  example. Excellent quality, but generation is inherently sequential and slow.
- **Diffusion models** — start from pure noise and iteratively denoise it over many steps until a
  clean sample emerges (the reverse of a fixed noising process). Extremely stable to train, very high
  quality (DALL-E 2/3, Stable Diffusion), but slow at inference since it needs many denoising steps.
- **Flow-based models** — learn an exactly invertible transformation between a simple distribution
  (e.g. Gaussian) and the data distribution, so the exact likelihood `P(x)` can be computed (no bound
  needed, unlike a VAE). Mathematically elegant, exact density estimation, but the invertibility
  constraint limits network architecture choices.

Each of these — except flow-based models, which stay at this map level in this course — gets its own
dedicated topic later with full architecture and maths.

## The maths
No new formula at this map level — see the canonical sheet in later topics (VAE's ELBO, GAN's
minimax value function, diffusion's forward/reverse process) for the full derivations.

## Worked example
Quick gut-check you can use in the exam: if asked "which family would you use to generate a 10-second
clean denoised image fast," the answer is GAN (single forward pass through G). If asked "which family
gives the most stable training at the cost of slow sampling," it's diffusion. If asked "which family
gives an exact, tractable likelihood," it's flow-based (VAE only gives a *lower bound* on likelihood).

## Use cases across domains
One concrete example and one real challenge, per domain:

- **Healthcare** — generating synthetic medical images (e.g. MRI/CT augmentation) to train diagnostic
  models when real labeled scans are scarce. Challenge: a hallucinated anatomical detail in a
  synthetic scan could mislead a model trained on it, so clinical validation is essential.
- **Education** — generating personalized practice questions and explanations adapted to a student's
  level. Challenge: factual accuracy — a generative model can produce a confident but wrong
  explanation (hallucination), which is actively harmful in a learning context.
- **Entertainment** — AI-generated game textures, NPC dialogue, or background music. Challenge:
  maintaining stylistic consistency across a whole game/film without manual art-direction oversight.
- **Marketing** — generating ad copy and product images variations at scale for A/B testing. Challenge:
  brand voice consistency and avoiding generic/repetitive output across campaigns.
- **Software development** — code-completion and code-generation copilots (autoregressive language
  models). Challenge: generated code can be subtly incorrect or insecure while looking syntactically
  fine, so human review stays necessary.
- **Content creation** — text-to-image tools for illustration/concept art. Challenge: copyright and
  provenance of training data, plus the output occasionally containing visual artifacts (extra
  fingers, warped text) that need a human pass.

## Exam traps
- Don't call GANs and VAEs "the same kind of autoencoder" — a plain autoencoder isn't generative in a
  useful sense (no structured latent sampling), a VAE is.
- Autoregressive ≠ diffusion. Both generate step-by-step, but autoregressive conditions on *previously
  generated output tokens*, diffusion conditions on *progressively less noisy versions of the whole
  sample*.
- Don't say diffusion models are "fast" — they're known for quality/stability, not speed, because of
  the many denoising steps.
- Flow-based models are the only family here with an *exact* tractable likelihood — VAEs only get a
  lower bound (ELBO).

## Remember this
Generative AI = learn the data distribution, then sample new points from it — the model families
differ only in *how* they represent and sample that distribution.
