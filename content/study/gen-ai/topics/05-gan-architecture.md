---
title: "GAN Architecture"
order: 5
tagline: "Inside the Generator and Discriminator networks, layer by layer, for one training iteration"
tags: ["GAN", "Architecture", "Neural Networks"]
diagram:
  direction: LR
  nodes:
    - { id: z, label: "Latent noise z", tone: amber }
    - { id: gup, label: "Generator (upsample)", tone: violet }
    - { id: gx, label: "Fake image G(z)", tone: coral }
    - { id: ddown, label: "Discriminator (downsample)", tone: cyan }
    - { id: sig, label: "Sigmoid → P(real)", tone: lime }
  edges:
    - { from: z, to: gup }
    - { from: gup, to: gx, label: "forward" }
    - { from: gx, to: ddown }
    - { from: ddown, to: sig }
---

## TL;DR
The Generator is a network that progressively **upsamples** a small noise vector into a full-size
sample; the Discriminator is a network that progressively **downsamples** an image (real or fake)
down to a single real/fake probability. Both are plain feed-forward (or convolutional) networks —
the magic is entirely in how they're trained together, not in exotic layer types.

## Why it matters
Knowing the actual layer-by-layer shape matters for exam questions that ask you to describe "the
architecture of a GAN" rather than just the training concept, and it's the groundwork for
understanding why specific failure modes happen (e.g. why a mismatched G/D capacity causes training
problems, covered in the next topic).

## The core idea
Matlab, think of the Generator as running a funnel in reverse: it takes a small, low-dimensional
noise vector and keeps expanding it, layer by layer, until it's a full-sized sample (e.g. a 64×64×3
image). The Discriminator does the opposite: it takes a full-sized sample and keeps compressing it,
layer by layer, until it's a single number between 0 and 1.

## How it works

### Generator — input/output and structure
- **Input layer**: a latent noise vector `z`, typically sampled from `N(0, I)`, with dimensionality
  much smaller than the output (e.g. 100-dim noise → a much larger image).
- **Hidden layers**: a stack of layers that progressively increase spatial/feature size — in
  convolutional GANs these are transposed convolutions (a.k.a. deconvolutions) or
  upsampling+convolution blocks; in simple fully-connected GANs these are just widening dense layers.
  Each hidden layer is typically followed by **Batch Normalization** (stabilizes training) and a
  **ReLU** (or LeakyReLU) activation.
- **Output layer**: produces the final synthetic sample at full resolution, typically with a **Tanh**
  activation (squashing output to `[-1, 1]`, matching normalized image pixel ranges) or Sigmoid for
  `[0, 1]`-ranged data.

### Discriminator — input/output and structure
- **Input layer**: a full-size sample — either a real training example or a fake `G(z)`.
- **Hidden layers**: a stack of layers that progressively decrease spatial/feature size — regular
  (strided) convolutions in convolutional GANs, or narrowing dense layers in simple GANs. Each hidden
  layer typically uses **LeakyReLU** (preferred over plain ReLU here — avoids the "dying" flat-zero
  gradient region, keeping gradient flow healthier for this adversarial setup) and sometimes dropout
  for regularization.
- **Output layer**: a single unit with a **Sigmoid** activation, outputting `D(x) ∈ [0,1]` — the
  estimated probability that the input is real.

### One training iteration, forward and backward pass
1. **Forward (Generator)**: sample `z`, pass it through `G`'s layers to get `G(z)`.
2. **Forward (Discriminator, fake branch)**: pass `G(z)` through `D` to get `D(G(z))`.
3. **Forward (Discriminator, real branch)**: pass a real batch `x` through `D` to get `D(x)`.
4. **Backward (Discriminator)**: compute `D`'s loss from both `D(x)` and `D(G(z))`, backpropagate,
   update only `D`'s weights.
5. **Backward (Generator)**: compute `G`'s loss from `D(G(z))` (recomputed with the just-updated `D`,
   or reusing the forward pass depending on implementation), backpropagate the gradient *through* `D`
   (whose weights are frozen at this step) *into* `G`, update only `G`'s weights.

So in every iteration, gradients flow through `D` twice — once to update `D` itself, once (with `D`
frozen) purely as a conduit to pass gradient signal back into `G`.

## The maths
Same value function as the concept topic — architecture doesn't change the objective, only how `D`
and `G` are internally structured to compute `D(x)` and `G(z)`:
`min_G max_D V(D,G) = 𝔼_{x∼p_data}[log D(x)] + 𝔼_{z∼p_z}[log(1 − D(G(z)))]`

## Significance of the latent-space input
The noise vector `z` is what makes the Generator a *generative* model rather than a fixed function —
every distinct `z` should map to a distinct, plausible output. The latent space's structure (its
dimensionality, and how smoothly nearby `z` values map to visually-similar outputs) directly
determines how much diversity and controllability the Generator has. A latent space that's too small
or poorly structured limits how much variety `G` can produce; this is also why interpolating between
two `z` vectors and decoding the path is a classic way to probe how well a GAN has organized its
latent space.

## Worked example
Take a toy Generator for 28×28 grayscale digit images: input `z` is a 100-dim noise vector → dense
layer to 7×7×128 → BatchNorm + ReLU → transposed conv to 14×14×64 → BatchNorm + ReLU → transposed
conv to 28×28×1 → Tanh output. The matching Discriminator: input 28×28×1 image → strided conv to
14×14×64 → LeakyReLU → strided conv to 7×7×128 → LeakyReLU → flatten → dense layer to 1 unit →
Sigmoid → `D(x)`. This is a standard DCGAN-style shape (illustrative dimensions for a toy example —
sizes vary by implementation).

## Exam traps
- Don't say the Generator's output activation must be Sigmoid — Tanh (`[-1,1]`) is the more common
  choice when images are normalized to that range; which one is "correct" depends on your data's
  normalization, but Tanh is the standard GAN convention worth naming.
- LeakyReLU in the Discriminator isn't arbitrary — it's specifically chosen over plain ReLU to avoid
  dead (zero-gradient) units, which matters more here because the adversarial signal is already weak
  and noisy.
- Don't forget that during the Generator's backward pass, `D`'s weights are frozen — only used as a
  path for gradients, not updated at that step.
- The noise vector's dimensionality is a hyperparameter choice, not fixed by theory — too small limits
  output diversity, but there's no single "correct" size to quote.

## Remember this
Generator = funnel in reverse (small noise → full sample, ends in Tanh/Sigmoid); Discriminator =
funnel forward (full sample → single probability, ends in Sigmoid) — and every training step runs
gradients through `D` twice, once for its own update and once as a frozen conduit into `G`.
