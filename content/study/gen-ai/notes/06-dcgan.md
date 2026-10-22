---
title: "6. DCGAN (Deep Convolutional GAN)"
order: 6
---

> **DCGAN** (Radford et al., 2015) replaces the fully connected layers of a vanilla GAN with **convolutional layers**, which preserve spatial structure, giving much better and more stable image generation.

## Architecture

**Generator:**

**z (100) → Project & reshape 4×4×1024 → ConvT 8×8×512 → ConvT 16×16×256 → ConvT 32×32×128 → ConvT 64×64×3 + Tanh**

**Discriminator:**

**Image 64×64×3 → Conv s2 32×32×128 → Conv s2 16×16×256 → Conv s2 8×8×512 → Conv s2 4×4×1024 → Flatten + Sigmoid**

## Architecture guidelines (memorise these 5)

1. Replace pooling with **strided convolutions** (D) and **transposed (fractionally-strided) convolutions** (G) — network learns its own up/down-sampling.
2. Use **Batch Normalisation** in both G and D (except G output & D input layers).
3. Remove fully connected hidden layers.
4. G: **ReLU** in all layers, **Tanh** at output.
5. D: **LeakyReLU (0.2)** in all layers, sigmoid at output. Adam lr = 0.0002, β₁ = 0.5.

## Vanilla GAN vs DCGAN

| Vanilla GAN | DCGAN |
|---|---|
| Fully connected (MLP) | Convolutional |
| Flattens image, loses spatial info | Keeps spatial structure, local features |
| Small, blurry, unstable | Sharper, more stable, scales to 64×64+ |
| Many parameters | Weight sharing → fewer parameters |

**Transposed convolution:** opposite of convolution — increases spatial size (upsampling) using learnable filters. Output size = (in − 1)·stride − 2·pad + kernel.
