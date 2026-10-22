---
title: "Conditional GAN and Applications"
order: 7
tagline: "Feeding a GAN a label so you can control exactly what it generates, instead of leaving it to chance"
definition: "A cGAN feeds an extra conditioning signal — usually a class label — into both the Generator and Discriminator, so generation can be steered toward a specific category instead of being random."
tags: ["GAN", "Conditional GAN", "Image-to-Image Translation"]
diagram:
  direction: LR
  nodes:
    - { id: z, label: "Noise z", tone: amber }
    - { id: y, label: "Condition y", tone: violet }
    - { id: gen, label: "Generator G(z|y)", tone: violet }
    - { id: fake, label: "Fake sample", tone: coral }
    - { id: real, label: "Real data x", tone: lime }
    - { id: disc, label: "Discriminator D(x|y)", tone: cyan }
  edges:
    - { from: z, to: gen }
    - { from: y, to: gen, label: "condition" }
    - { from: gen, to: fake }
    - { from: fake, to: disc }
    - { from: real, to: disc }
    - { from: y, to: disc, label: "condition" }
---

## TL;DR
A plain GAN generates *something* plausible but you can't control *what* — a Conditional GAN (cGAN)
fixes that by feeding an extra piece of information `y` (like a class label) into both the Generator
and Discriminator, so you can steer exactly what gets generated.

## Why it matters
Most real-world generative applications need control, not just plausibility — "generate a cat," not
"generate something." cGANs are the base idea behind image-to-image translation, colorization, and
class-controlled synthetic data generation — all things that show up constantly in both exams and
production systems.

## The core idea
Simple shabdo mein: a vanilla GAN's Generator only sees noise `z`, so it has no way to know "generate
specifically a 7" vs "generate specifically a 3" — it just generates *some* plausible digit. A
Conditional GAN hands the Generator an extra input `y` (say, the digit's class label) alongside the
noise, so now it learns `G(z|y)` — "given this noise *and* this condition, produce a sample matching
that condition." The Discriminator is told the condition too, learning `D(x|y)` — "given this
condition, is this a real example *of that condition*, or a fake?" This second part matters: the
Discriminator isn't just checking realism anymore, it's checking realism *conditioned on* `y`
matching.

## How it works
Referring to the diagram above:
1. Sample noise `z` as usual, and pick (or sample) a condition `y` — e.g. a class label, a sketch, a
   grayscale image, depending on the application.
2. Concatenate (or otherwise inject) `y` into the Generator's input alongside `z`, so the Generator
   computes `G(z|y)` instead of plain `G(z)`.
3. The Discriminator receives both a sample (real `x` or fake `G(z|y)`) *and* the same condition `y`,
   and outputs whether that sample is a real example matching `y` or not — `D(x|y)`.
4. Training proceeds exactly like a standard GAN's adversarial loop (forward/backward passes as in
   the architecture topic), except both networks now also condition on `y` at every step.
5. At generation time, you pick whatever `y` you want and sample `z` — the output is steered toward
   that specific condition.

In practice, `y` is injected by concatenating it (often as a one-hot vector, for class labels) to the
noise vector at the Generator's input layer, and to the image (or an embedded version of it) at the
Discriminator's input layer — simplest and most common injection point, though deeper architectures
inject `y` at multiple layers.

## The maths
**cGAN objective**: condition `y` fed to both networks — `G(z|y)`, `D(x|y)`; the objective becomes
`min_G max_D 𝔼[log D(x|y)] + 𝔼[log(1 − D(G(z|y)|y))]`

Compared to the unconditional value function, every term now carries `y` — the Discriminator judges
realism *given* `y`, and the Generator produces samples *given* `y`, so both networks are solving a
conditional version of the same adversarial game.

## Worked example — class-controlled digit generation
Say `y` is a one-hot label for digit class, e.g. `y = [0,0,0,1,0,0,0,0,0,0]` for digit "3"
(illustrative encoding). The Generator's input becomes `[z ; y]` (noise concatenated with the one-hot
label) instead of just `z`. During training, when a real "3" image `x` is shown, it's paired with
that same `y` and fed to `D` as `D(x|y)` — `D` should output close to 1 (real "3", correctly labeled).
If instead a real "3" image were paired with the *wrong* label, say `y` for "7", a well-trained `D`
should learn to flag that as not matching — this is what forces the Generator to actually respect the
condition rather than ignore it. At generation time, fixing `y` to "3" and sampling different `z`
values produces different-looking but all recognizably-3 digit images; switching `y` to "7" with the
same `z` values produces 7s instead.

## Applications
- **Class-controlled generation** — e.g. generate a digit image of a specific requested class (MNIST-
  style), or a specific requested object category.
- **Image-to-image translation** — e.g. turning a building facade sketch into a photorealistic
  rendering, or a daytime photo into a nighttime one; here `y` is itself an image (the source), not a
  simple class label.
- **Colorization** — feeding a grayscale image as the condition `y` and generating a plausible
  colorized version as the output.

## Exam traps
- Don't forget the condition `y` must be fed to **both** networks, not just the Generator — if only
  `G` sees `y`, the Discriminator has no way to check that the generated sample actually matches the
  requested condition, and `G` has no incentive to respect `y` at all.
- `y` doesn't have to be a class label — it can be any side information: a sketch, a grayscale image,
  a text embedding. The formula is the same regardless of what `y` represents.
- Don't write the objective without `y` appearing in both the `D(x|y)` and `D(G(z|y)|y)` terms — both
  the real-data check and the fake-data check are conditioned.
- A cGAN with a mismatched (wrong) `y`-`x` pair during training is a useful way to force `D` to learn
  condition-matching, not just realism — some implementations deliberately include such mismatched
  pairs as an additional "fake" case.

## Remember this
A cGAN is a standard GAN where both `G` and `D` additionally take a condition `y` — this single
change turns "generate something plausible" into "generate exactly what I asked for."
