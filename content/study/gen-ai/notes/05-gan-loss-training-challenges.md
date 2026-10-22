---
title: "5. GAN Loss Functions & Training Challenges"
order: 5
---

## Standard losses (Q26, Q27)

```text
Discriminator loss: L_D = −[ log D(x) + log(1 − D(G(z))) ]   (binary cross-entropy, real=1, fake=0)

Saturating (minimax) G loss: L_G = log(1 − D(G(z)))   (minimise)

Non-saturating G loss: L_G = −log D(G(z))   (minimise) ← used in practice
```

| Loss | Behaviour early in training (D strong, D(G(z)) ≈ 0) | Gradient quality |
|---|---|---|
| Saturating log(1−D(G(z))) | Curve is flat near 0 → gradient ≈ 0 | **Vanishing gradients**, G learns very slowly |
| Non-saturating −log D(G(z)) | Curve is very steep near 0 → large gradient | **Strong gradients** when G is bad, same fixed point, more stable |
| Discriminator BCE | Learns real vs fake | If D becomes perfect, G's signal dies |

**Tip:** Remember: both G losses want D(G(z)) → 1. Only the **shape of the curve** differs. Non-saturating = "maximise the chance D is fooled" instead of "minimise the chance D is right".

## Major training challenges (Q28)

1. **Mode collapse:** G produces only a few types of output (e.g. only digit "1") because those fool D. Low diversity. *Cause:* G finds one "safe" output; D adapts; G jumps to another mode — they chase each other.
2. **Vanishing gradients:** D becomes too good → D(G(z)) ≈ 0 → saturating loss gives no gradient → G stops learning. Also because JSD is constant (log 2) when distributions don't overlap.
3. **Training instability / non-convergence:** two networks optimise opposite objectives; losses oscillate, no clear stopping point; very sensitive to hyperparameters.
4. Others: no good evaluation metric (loss doesn't show quality → use FID/IS), checkerboard artifacts, overfitting/memorisation, hard to train at high resolution.

## Fixes

| Technique | Fixes |
|---|---|
| Non-saturating G loss | Vanishing gradients |
| **WGAN** (Wasserstein / Earth-Mover distance, critic without sigmoid, weight clipping) / **WGAN-GP** (gradient penalty) | Vanishing gradients, instability, mode collapse; loss correlates with quality |
| **LSGAN** (least squares loss) | Vanishing gradients, gives more stable training, better quality |
| Minibatch discrimination / minibatch std-dev layer | Mode collapse (D sees diversity of batch) |
| Unrolled GAN, experience replay | Mode collapse |
| Spectral normalisation, gradient penalty | Instability (limits D's Lipschitz constant) |
| Label smoothing (real = 0.9), adding noise to D input | Over-confident D |
| TTUR (different learning rates), Adam lr=0.0002, β₁=0.5 | Instability |
| Progressive growing, StyleGAN, DCGAN rules | High-res quality, artifacts |

```text
LSGAN: L_D = ½E[(D(x) − 1)²] + ½E[D(G(z))²],   L_G = ½E[(D(G(z)) − 1)²]

WGAN: min_G max_‖D‖_L≤1 E[D(x)] − E[D(G(z))]
WGAN-GP penalty: λ · E[ (‖∇_x̂ D(x̂)‖₂ − 1)² ], x̂ = random mix of real and fake, λ = 10
```

## Case: handwritten digits, only few styles, D very confident (Q29)

**Diagnosis:** Mode collapse + discriminator overpowering (vanishing gradient). **Causes:** D trains too fast/too strong, saturating loss, small batch, high learning rate, no diversity signal. **Remedies:** non-saturating or WGAN-GP loss, minibatch discrimination, label smoothing, add noise to D inputs, lower D lr / update G more often, spectral norm, conditional GAN with digit labels (forces all 10 classes), monitor diversity with FID/class histogram.

## Case: MRI GAN – collapse, unstable loss, artifacts, missing detail (Q30)

| Objective | Distance minimised | Stability | Medical image quality |
|---|---|---|---|
| Standard GAN | JS divergence | Poor – vanishing gradient, collapse | Can be sharp but unreliable, artifacts |
| LSGAN | Pearson χ² divergence | Better – penalises samples far from boundary even if "correctly classified" | Fewer artifacts, better detail |
| WGAN / WGAN-GP | Wasserstein-1 (Earth Mover) | Best – smooth gradients even with no overlap; loss tracks quality | Most diverse, fewer collapses; recommended |

Extra fixes for fine detail: progressive growing / StyleGAN2, PatchGAN discriminator, perceptual loss, spectral norm, higher resolution, radiologist validation, privacy check (no memorised patient scans). Consider **diffusion models** as a modern alternative.
