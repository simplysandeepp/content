---
title: "Variational Autoencoders (VAE) – Concept, Architecture, and Loss"
order: 3
tagline: "A probabilistic autoencoder that learns a smooth latent space you can actually sample from"
definition: "A Variational Autoencoder is an autoencoder whose encoder outputs a probability distribution over the latent space instead of a single point, trained to both reconstruct its input and keep that distribution close to a standard normal, so new points sampled from it decode into realistic outputs."
tags: ["VAE", "Latent Space", "ELBO"]
diagram:
  direction: LR
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

## TL;DR
A VAE is an autoencoder that forces its latent space to be a smooth, structured probability
distribution instead of arbitrary points — so you can sample a random point from that distribution
and decode it into a brand-new, realistic output.

## Why it matters
Plain autoencoders compress and reconstruct, but their latent space has gaps and no guarantee that a
random point decodes into anything sensible. VAEs fix exactly that, which is why they're a real
generative model — used for image generation, anomaly detection, and as a building block inside
bigger systems (e.g. latent diffusion models encode images into a VAE's latent space first, then run
diffusion there).

## The core idea
A standard autoencoder has an encoder that maps input `x` to a single fixed latent vector `z`, and a
decoder that maps `z` back to a reconstruction `x̂`. It's trained purely to minimize reconstruction
error. Problem: nothing constrains what the latent space looks like — it can have holes, and random
`z` vectors you didn't see in training often decode into garbage.

A VAE changes the encoder's job: instead of outputting one fixed `z`, it outputs the **parameters of
a distribution** — a mean `μ(x)` and standard deviation `σ(x)` — describing where `x` likely lives in
latent space. Training then pulls every one of these per-input distributions toward a shared standard
normal prior, so the whole latent space becomes smooth and continuous — matlab, anywhere you sample
from that space, the decoder has "seen" something similar nearby during training.

## How it works
Referring to the diagram above:
1. **Encoder**: takes input `x`, outputs `μ(x)` and `σ(x)` — the parameters of `q(z|x) = N(μ, σ²)`,
   the approximate posterior over latent `z` given `x`.
2. **Reparameterization trick**: instead of sampling `z` directly from `N(μ, σ²)` (which isn't
   differentiable), compute `z = μ + σ ⊙ ε` with `ε ~ N(0, I)` drawn independently. This moves all the
   randomness into `ε`, so gradients can flow through `μ` and `σ` during backpropagation.
3. **Latent space**: `z` is the compressed, structured representation sitting in this probabilistic
   space.
4. **Decoder**: takes `z` and outputs `p(x|z)` — a reconstruction `x̂` (or a distribution over
   possible reconstructions).
5. At generation time, you don't even need the encoder — just sample `z ~ N(0, I)` directly from the
   prior and run it through the decoder to get a new sample.

## The maths
- Encoder outputs `μ(x)`, `σ(x)` parameterizing `q(z|x) = N(μ, σ²)` — the approximate posterior.
- Reparameterization trick: `z = μ + σ ⊙ ε`, `ε ~ N(0, I)` — makes sampling differentiable so gradients
  can backpropagate through the sampling step.
- Decoder: `p(x|z)` — the probability of reconstructing `x` given latent `z`.
- **ELBO (Evidence Lower BOund)**:
  `log p(x) ≥ 𝔼_{q(z|x)}[log p(x|z)] − D_KL(q(z|x) ‖ p(z))`
  Training maximizes this lower bound on the true (intractable) data log-likelihood `log p(x)`.
- Equivalently, training **minimizes the negative ELBO**, which decomposes into two losses:
  `L(θ,φ;x) = −𝔼_{q_φ(z|x)}[log p_θ(x|z)] + D_KL(q_φ(z|x) ‖ p(z))`
  - The first term is the **reconstruction loss** — how well the decoder (parameters `θ`) reconstructs
    `x` from the sampled `z`.
  - The second term is the **KL-divergence loss** — how far the encoder's (parameters `φ`) learned
    distribution `q_φ(z|x)` strays from the prior `p(z) = N(0, I)`.
- Closed-form KL vs a standard normal prior, per latent dimension `j`, summed over all latent dims:
  `D_KL = −½ Σ_j (1 + log σ_j² − μ_j² − σ_j²)`
  where `μ_j` and `σ_j` are the `j`-th components of the encoder's output mean and standard deviation.

### Why both loss terms are needed
Reconstruction loss alone (just a plain autoencoder) gives no pressure to keep the latent space
smooth or centered — the encoder could spread different inputs' `z` far apart with tiny variances,
each memorizing its own input perfectly, leaving gaps everywhere else. KL-divergence alone, with no
reconstruction term, would collapse every input's posterior onto the prior `N(0,I)` and give up on
reconstructing anything — the decoder would just learn to output the "average" sample regardless of
`z`. You need both: reconstruction loss keeps the decoder honest about faithfully representing real
data, KL loss keeps the latent space well-organized enough that sampling random points actually
works.

## Worked example
Say for a given input `x`, the encoder outputs (illustrative values) `μ = [0.5, -0.2]` and
`σ = [0.1, 0.3]` for a 2-dimensional latent space.
1. Reparameterize: draw `ε = [0.8, -1.0]` from `N(0, I)`. Then
   `z = μ + σ ⊙ ε = [0.5 + 0.1×0.8, -0.2 + 0.3×(-1.0)] = [0.58, -0.5]`.
2. Decoder takes `z = [0.58, -0.5]` and produces `x̂`, compared against the real `x` for
   reconstruction loss.
3. KL term for this input: `D_KL = −½ [(1 + log(0.1²) − 0.5² − 0.1²) + (1 + log(0.3²) − (−0.2)² − 0.3²)]`
   — plug in and sum both dimensions; a tighter `σ` close to 1 and `μ` close to 0 would make this term
   smaller (closer to the prior).
Total loss for this sample = reconstruction loss + this KL term, averaged over a batch.

## Exam traps
- Don't write `z = μ + σ·ε` with `ε` treated as a *learned* parameter — `ε` is sampled fresh each
  time from `N(0,I)` and is never learned; it's the trick that keeps the gradient path to `μ`, `σ`
  differentiable.
- The ELBO is a *lower bound* on `log p(x)`, not `log p(x)` itself — VAEs never compute the exact
  likelihood, which is one reason outputs can look slightly blurry.
- Don't swap the sign — training *maximizes* the ELBO, equivalently *minimizes* the negative ELBO
  (= reconstruction + KL).
- The KL term pulls toward `N(0, I)` specifically — not toward any other prior — because the closed
  form given here assumes a standard normal prior.

## Remember this
VAE loss = reconstruction loss (be faithful to the input) + KL-divergence (keep the latent space
close to a standard normal) — both terms matter, and the reparameterization trick is what makes the
whole thing trainable by gradient descent.
