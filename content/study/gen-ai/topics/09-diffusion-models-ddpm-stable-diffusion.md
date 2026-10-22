---
title: "Diffusion Models (DDPM, Stable Diffusion) – Overview and Applications"
order: 9
tagline: "Learn to destroy an image with noise, then learn to undo it one step at a time"
definition: "A diffusion model learns to reverse a fixed process that gradually adds Gaussian noise to data, training a network to predict and remove that noise one step at a time until pure noise becomes a realistic sample."
tags: ["Diffusion Models", "DDPM", "Stable Diffusion", "U-Net"]
diagram:
  direction: LR
  nodes:
    - { id: x0, label: "Image x₀", tone: lime }
    - { id: fwd, label: "Forward: add noise ×T", tone: coral }
    - { id: xT, label: "Pure noise x_T", tone: violet }
    - { id: eps, label: "εθ predicts noise", tone: cyan }
    - { id: xhat, label: "Denoised x₀", tone: lime }
  edges:
    - { from: x0, to: fwd }
    - { from: fwd, to: xT }
    - { from: xT, to: eps, label: "reverse step" }
    - { from: eps, to: xhat, label: "repeat ×T" }
---

## TL;DR
Diffusion models learn to generate data by first defining a fixed process that gradually turns a
real image into pure noise, and then training a network to reverse that process — step by step,
denoising noise back into an image. Stable Diffusion is this same idea, done in a compressed latent
space and steered by a text prompt.

## Why it matters
Diffusion models (DDPM and its descendants) are currently the dominant approach for high-quality
image generation — Stable Diffusion, and the text-to-image family more broadly, are all built on
this mechanism. Unlike GANs, there's no adversarial game to destabilize training, which is a big
reason diffusion models scaled so well to large, diverse datasets.

## The core idea
Yaha samajhna zaroori hai ki diffusion has two processes, and only one of them is learned:

- **Forward process (fixed, no learning)**: take a real image `x_0` and gradually add a little
  Gaussian noise at each of `T` steps, until by step `T` the image is indistinguishable from pure
  noise. This process is defined by a fixed noise schedule — nothing is trained here.
- **Reverse process (learned)**: train a neural network to undo one noising step at a time, i.e.
  given a noisy `x_t`, predict what noise was added so it can be subtracted to move back toward
  `x_{t-1}`. Do this repeatedly starting from pure noise `x_T`, and you arrive at a brand new,
  realistic `x_0` — a generated sample.

The crucial design choice: the network doesn't try to directly predict the clean image `x_0` in one
shot. It predicts the **noise** `ε` that was added. This is a much easier, more stable regression
target than predicting a whole image from scratch.

## How it works
Referencing the diagram: start from a real image `x_0`, run it through the fixed forward process
(adding noise across `T` steps) to get pure noise `x_T`. Train a network `ε_θ(x_t, t)` to predict
the noise at each step. At generation time, run it in reverse: start from random noise `x_T ~
N(0,I)`, repeatedly ask the network "what noise is in here," subtract an estimate of it, and step
down to `x_{t-1}`, continuing all the way to `x_0`.

**Stable Diffusion's extension** adds two ideas on top of plain DDPM (full pipeline detail for a
specific question is covered wherever the practice set asks for it — here's the shape):
1. **Latent diffusion**: instead of running the slow, expensive diffusion/denoising process directly
   on full-resolution pixels, first compress the image with a VAE encoder into a smaller latent
   representation. Diffusion happens in this compressed latent space — far cheaper — and a VAE
   decoder expands the final denoised latent back into a full-resolution image.
2. **Text conditioning**: a text encoder turns the prompt into an embedding, which is fed into the
   denoising U-Net (typically via cross-attention) at every step, so each denoising step is steered
   toward "noise that, if removed, moves toward an image matching this text."

Pipeline in one line: `text prompt → text encoder → conditioning embedding → latent diffusion U-Net
(denoise ×T) → VAE decoder → image`.

## The maths
- Forward step (fixed): `q(x_t|x_{t-1}) = N(x_t; √(1−β_t) x_{t-1}, β_t I)`, where `β_t` is the
  (small, scheduled) noise variance added at step `t`.
- Closed form at any `t` (lets you jump straight from `x_0` to `x_t` without simulating every
  intermediate step): `x_t = √(ᾱ_t) x_0 + √(1−ᾱ_t) ε`, `ε ~ N(0,I)`, where `α_t = 1 − β_t` and
  `ᾱ_t = Π_{s=1}^{t} α_s` is the cumulative product of the `α`s up to step `t`. Note `ᾱ_t` shrinks
  as `t` grows — so the weight on the original image `x_0` shrinks while the weight on pure noise
  grows, exactly matching the intuition that later steps are "mostly noise."
- The reverse process is learned: a network predicts the noise, `ε_θ(x_t, t)`.
- Training loss: `𝔼[‖ε − ε_θ(x_t,t)‖²]` — plain mean-squared error between the true noise that was
  added and the network's prediction of it. This is the entire training objective; no discriminator,
  no adversarial min-max.

## Worked example
Say `β_t` values are scheduled small and increasing (illustrative values — a real schedule has
hundreds of steps with precise numbers, but the method is what matters): at `t=1`, `ᾱ_1` is close to
1, so `x_1 ≈ x_0` plus a tiny bit of noise. By `t=T` (say `T=1000`), `ᾱ_T` is close to 0, so
`x_T ≈` pure noise `ε`, with almost no trace of `x_0` left — matching the closed-form formula
directly: when `ᾱ_t → 0`, `x_t → √(1−ᾱ_t) ε ≈ ε`. To train one step: sample a real image `x_0`,
sample a random timestep `t` and noise `ε`, compute `x_t` from the closed form, feed `(x_t, t)` into
the network, and backprop the squared error between `ε` and the network's prediction `ε_θ(x_t,t)`.

## Exam traps
- The network predicts **noise**, not the clean image directly — a very common wrong answer is "the
  model predicts `x_0`."
- The forward process has **no learned parameters** — only the reverse process is trained. Don't
  describe the forward pass as something the network "learns to do."
- Stable Diffusion runs diffusion in **latent space**, not pixel space — that's the "latent" in
  latent diffusion, and it's the main reason it's fast enough to be practical.
- Diffusion vs GAN tradeoff, stated precisely: diffusion training is more **stable** (simple
  regression loss, no adversarial game, no mode collapse) but sampling is **slow** (needs many
  sequential denoising steps); GANs train less stably (mode collapse, non-convergence risk) but
  sample in a **single forward pass**, so they're fast at generation time.

## Remember this
Forward = fixed noise-adding, reverse = learned denoising, and the network's only real job is
predicting the noise `ε` at each step — everything else (latent compression, text conditioning) is
built on top of that one core training signal.
