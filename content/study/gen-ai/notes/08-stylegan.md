---
title: "8. StyleGAN & Modern GAN Variants"
order: 8
diagram:
  direction: TB
  nodes:
    - { id: z, label: "z (512)", tone: lime }
    - { id: mapping, label: "Mapping network f (8 FC layers)", tone: cyan }
    - { id: w, label: "w (disentangled space W)", tone: violet }
    - { id: const, label: "Learned constant 4×4×512", tone: amber }
    - { id: coarse, label: "Coarse 4×4–8×8: pose, face shape, glasses", tone: coral }
    - { id: middle, label: "Middle 16×16–32×32: hairstyle, eyes, features", tone: coral }
    - { id: fine, label: "Fine 64²–1024²: colour, skin texture, micro detail", tone: coral }
    - { id: noise, label: "Per-pixel noise B", tone: amber }
    - { id: image, label: "Image 1024²", tone: lime }
  edges:
    - { from: z, to: mapping }
    - { from: mapping, to: w }
    - { from: w, to: coarse, label: "AdaIN style" }
    - { from: w, to: middle, label: "AdaIN style" }
    - { from: w, to: fine, label: "AdaIN style" }
    - { from: const, to: coarse }
    - { from: coarse, to: middle }
    - { from: middle, to: fine }
    - { from: fine, to: image }
    - { from: noise, to: middle }
    - { from: noise, to: fine }
---

> **StyleGAN** (NVIDIA, Karras et al. 2019) is a style-based generator: instead of feeding noise z directly to the generator, z is first transformed by a **mapping network** into an intermediate latent **w**, and w controls the **style** at every resolution layer through **AdaIN**. This gives very high quality (1024×1024 faces) and fine control over coarse-to-fine attributes.

## Key components (Q37–Q40)

- **Mapping network:** 8-layer MLP, z (512) → w (512). Z must follow a fixed Gaussian, which "entangles" features; W is learned freely, so features become **disentangled** (one direction ≈ one attribute).
- **Learned constant input:** synthesis network starts from a learned 4×4×512 tensor, not from z.
- **AdaIN (style modulation):** AdaIN(x_i, y) = y_(s,i) · (x_i − μ(x_i)) / σ(x_i) + y_(b,i). Normalise each feature map, then scale and shift using style from w. (StyleGAN2 replaces with weight modulation/demodulation to remove "droplet" artifacts.)
- **Noise injection:** random noise added per layer gives stochastic variation (hair placement, pores) without changing identity.
- **Style mixing:** use w₁ for coarse layers and w₂ for fine layers → pose of person A with colours/texture of person B. Also acts as regulariser.
- **Truncation trick:** w' = w̄ + ψ(w − w̄), ψ\<1 → higher quality, less diversity.
- **Progressive / multi-scale:** built on ProGAN — trains from low to high resolution.

## Traditional GAN vs StyleGAN (Q41, Q43)

| Basis | Traditional GAN / DCGAN | StyleGAN |
|---|---|---|
| Input | z directly into first layer | Learned constant; z → mapping → w → every layer |
| Latent space | Entangled Z | Disentangled W |
| Control | Hardly any | Coarse / middle / fine control, style mixing |
| Stochastic detail | From z only | Separate noise inputs |
| Resolution & quality | 64–256 px, artifacts | 1024 px photorealistic, FID much lower |
| Stability | Unstable | Progressive growing, R1 penalty, more stable |

**Latent-space manipulation (face editing):** find direction vector for "age" in W (e.g. via labelled samples / InterFaceGAN); w_new = w + α·d_age. Real photo → **GAN inversion** to find its w → edit → regenerate.

## Fashion virtual studio design (Q42)

- Train StyleGAN2/3 on fashion model images (aligned, high-res).
- **Coarse styles** → pose, body shape, face structure. **Middle** → hairstyle, clothing shape, facial features. **Fine** → clothing texture/colour, background colour, lighting, micro detail. **Noise** → fabric wrinkles, hair strands.
- **Style mixing:** pose from model A + clothes texture from model B.
- **Attribute control:** discover semantic directions in W (hair length, smile), use conditional StyleGAN for clothing category, inversion to edit real catalogue photos.
- Risks: bias, identity misuse → watermark outputs.

**Other modern variants:** ProGAN (progressive growing), BigGAN (large-scale class-conditional, ImageNet), StyleGAN2 (weight demodulation, no droplets), StyleGAN3 (alias-free, smooth animation), CycleGAN, SRGAN, WGAN-GP, SAGAN (self-attention GAN).
