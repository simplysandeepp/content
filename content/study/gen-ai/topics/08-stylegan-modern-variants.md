---
title: "StyleGAN & Modern GAN Variants"
order: 8
tagline: "Separating 'what to generate' from 'how to control it' via a mapping network and per-layer style injection"
definition: "StyleGAN replaces a single latent vector with a learned mapping network and injects \"style\" at every resolution of the Generator via AdaIN, so coarse features like pose and fine features like texture can be controlled independently."
tags: ["StyleGAN", "GAN Variants", "Latent Space", "AdaIN"]
diagram:
  direction: LR
  nodes:
    - { id: z, label: "Latent z (Z-space)", tone: violet }
    - { id: map, label: "Mapping Network f", tone: cyan }
    - { id: w, label: "Intermediate w (W-space)", tone: violet }
    - { id: synth, label: "Synthesis Network", tone: cyan }
    - { id: noise, label: "Per-layer noise", tone: amber }
    - { id: img, label: "Generated Image", tone: lime }
  edges:
    - { from: z, to: map }
    - { from: map, to: w, label: "8 FC layers" }
    - { from: w, to: synth, label: "AdaIN per layer" }
    - { from: noise, to: synth, label: "stochastic detail" }
    - { from: synth, to: img }
---

## TL;DR
StyleGAN doesn't feed the latent code straight into the generator like a vanilla GAN. It first
passes `z` through a mapping network to get a less-tangled latent `w`, then injects `w` as "style"
at every resolution level of the synthesis network — which is what gives it clean, disentangled
control over coarse-to-fine attributes.

## Why it matters
Vanilla GANs generate plausible images but you can't easily say "keep the pose, change the hair
color." StyleGAN's whole design is built around giving you that knob. This is the architecture
behind most high-quality face generation demos, and the ideas (disentangled latent space, style
injection, mixing) show up again whenever a generative model needs controllable, interpretable
latent directions — not just GANs.

## The core idea
Normal GAN: `z ~ N(0,I)` goes straight into the generator's first layer. Problem — `z` is forced to
follow a fixed, simple distribution (usually Gaussian), but the real attributes in the data (pose,
age, lighting, hairstyle) don't vary like a Gaussian at all. To fit the data anyway, the generator
has to warp and entangle the space — changing one direction in `z` ends up changing multiple
unrelated attributes at once.

StyleGAN fixes this with an extra step: learn a mapping `f: Z → W` (an 8-layer fully connected
network) that transforms `z` into an intermediate latent `w`. `w` isn't bound to any fixed prior —
it's free to take whatever shape makes the attributes disentangled. Simple shabdo mein, `z` is the
"random seed" and `w` is the "settings panel" derived from it, and the settings panel is much more
linear and controllable than the raw seed.

## How it works
Follow the diagram left to right:

1. Sample `z` from the usual simple prior (Gaussian).
2. Pass `z` through the **mapping network** (8 FC layers) to get `w` in **W-space**. This is a
   one-time transformation per image, not per layer.
3. The **synthesis network** doesn't start from `z` or `w` directly as an image seed — it starts
   from a **learned constant** 4×4 tensor. `w` is injected into every layer of the synthesis
   network as a *style*, via learned affine transforms that turn `w` into per-layer scale/bias
   parameters.
4. Style injection uses **AdaIN** (Adaptive Instance Normalization): it normalizes the feature map
   at that layer, then rescales and shifts it using the style parameters derived from `w`.
5. Independently, per-layer **noise** (fresh random noise at each resolution) is added to control
   small stochastic details (hair strand placement, skin pore texture) that shouldn't be tied to
   the overall "identity" encoded in `w`.
6. Resolution doubles layer by layer (4×4 → 8×8 → ... → 1024×1024 in the original StyleGAN, built
   on a progressively-growing backbone), each level re-injecting style from `w`.

**Coarse/middle/fine control**: because style is injected separately at each resolution level, and
different resolutions dominate different visual scales, controlling which layers receive which `w`
gives you attribute-level control:
- **Coarse** (lowest resolutions, e.g. 4×4–8×8): pose, overall face shape, broad structure.
- **Middle** (e.g. 16×16–32×32): finer facial features, hairstyle, eyes open/closed.
- **Fine** (highest resolutions): color scheme — skin tone, hair color, eye color, micro-detail.

**Style mixing**: during training, instead of always feeding one `w` to all layers, two latent
codes `z1`, `z2` are mapped to `w1`, `w2`, and the synthesis network is fed `w1` up to a random
crossover layer and `w2` after it. This regularizes the network — it can't assume styles at
adjacent layers are correlated, which forces each layer's style to control only its own local
attributes instead of leaking into neighbouring scales. At inference time, style mixing is also a
feature: you can blend the "coarse" identity of one image with the "fine" color palette of another.

## The maths
No new canonical formula beyond AdaIN's own definition (not in the course's core formula sheet, but
worth stating in words since it's the mechanism asked about): AdaIN takes a feature map, normalizes
it to zero mean/unit variance per channel, then applies a learned per-channel scale and bias derived
from the style vector `w` — i.e. the *content* (spatial structure) comes from the feature map, and
the *style* (textures, colors at that scale) comes entirely from `w`. That's the general GAN value
function from the earlier GAN topic (`min_G max_D 𝔼[log D(x)] + 𝔼[log(1−D(G(z)))]`) still underneath
— StyleGAN changes the generator's internal architecture, not the adversarial training objective
itself.

## Worked example
Say you generate a face with `w_A` (brown hair, smiling, frontal pose) and another with `w_B`
(blonde hair, neutral expression, three-quarter pose). If you feed `w_A` to the coarse layers and
`w_B` to the fine layers: the output keeps `w_A`'s pose and face shape (coarse) but picks up `w_B`'s
color palette (fine) — a face with `w_A`'s pose wearing `w_B`'s coloring. This is exactly style
mixing in action, and it's a direct demonstration that coarse and fine styles are controlling
genuinely different, separable attributes.

## Exam traps
- Don't say StyleGAN removes the discriminator or changes the adversarial loss — it doesn't; the
  discriminator and the min-max objective are essentially unchanged from the Progressive GAN
  backbone. All the innovation is in the **generator's** architecture.
- `w` is not "just a deeper `z`" — the point is specifically that it's *not* constrained to match a
  fixed prior distribution, which is what lets it disentangle.
- Don't mix up style injection (AdaIN from `w`, controls identity/attributes) with noise injection
  (random per-layer noise, controls only small stochastic detail) — they're two separate inputs to
  the synthesis network with different jobs.
- Style mixing is a **training-time regularizer** as well as an inference-time trick — mention both
  if asked "why does style mixing help."

## Remember this
StyleGAN's trick is architectural, not objective-level: map `z` to a disentangled `w`, then inject
`w` as per-layer style via AdaIN — so different layers control coarse, middle, and fine attributes
independently, and style mixing proves (and reinforces) that separation.
