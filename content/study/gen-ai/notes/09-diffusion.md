---
title: "9. Diffusion Models — DDPM & Stable Diffusion"
order: 9
diagram:
  direction: LR
  nodes:
    - { id: x0, label: "x_0 (clean image)", tone: lime }
    - { id: x1, label: "x_1 (slight noise)", tone: cyan }
    - { id: xt, label: "x_t (more noise)", tone: amber }
    - { id: xT, label: "x_T (pure noise)", tone: coral }
  edges:
    - { from: x0, to: x1, label: "forward q(x_t|x_t−1): add noise, fixed" }
    - { from: x1, to: xt }
    - { from: xt, to: xT }
    - { from: xT, to: xt, label: "reverse p_θ(x_t−1|x_t): U-Net removes noise, learned" }
    - { from: xt, to: x1 }
    - { from: x1, to: x0 }
---

> A **diffusion model** learns to generate data by reversing a gradual noising process. **Forward process:** slowly add Gaussian noise to a real image over T steps until it becomes pure noise. **Reverse process:** a neural network (U-Net) learns to remove the noise step-by-step, so starting from random noise it can create a new image. (T ≈ 1000 steps)

## Forward process (math)

```text
q(x_t | x_t−1) = N( √(1−β_t) · x_t−1, β_t I )   β_t = noise schedule (e.g. 10^-4 → 0.02)
α_t = 1 − β_t,   ᾱ_t = α_1 · α_2 · … · α_t (cumulative product)

Closed form (jump directly to any t):   x_t = √ᾱ_t · x_0 + √(1 − ᾱ_t) · ε,   ε ~ N(0, I)
```

√ᾱ_t = **signal coefficient**, √(1−ᾱ_t) = **noise coefficient**. As t increases, ᾱ_t → 0, so signal fades and noise dominates. Note: ᾱ_t + (1−ᾱ_t) = 1 → variance stays controlled.

## Training (noise prediction) & reverse sampling

```text
Loss: L = E_(x_0, t, ε) [ ‖ ε − ε_θ( √ᾱ_t x_0 + √(1−ᾱ_t) ε , t ) ‖² ]

Sampling step: x_(t−1) = (1/√α_t) · ( x_t − (β_t/√(1−ᾱ_t)) · ε_θ(x_t, t) ) + σ_t z
```

1. **Training:** take real x_0 → pick random t → sample ε → make x_t with closed form → U-Net predicts ε → MSE loss between true and predicted noise → backprop.
2. **Generation:** start x_T ~ N(0,I) → for t = T…1: predict noise, subtract a bit, add small random noise → x_0 = new image.

**Role of Gaussian noise (Q47):** (1) destroys data gradually in a mathematically simple way (sum of Gaussians is Gaussian → closed form); (2) final state N(0,I) is easy to sample from; (3) predicting noise gives a simple, stable MSE objective; (4) random noise in reverse steps gives diversity.

## ✏️ Numerical type 1 (Q48 pattern)

**Given:** ᾱ_t = 0.64, x_0 = 3, ε = 1. (Use your exam's values — method is identical.)

```text
(a) √ᾱ_t = √0.64 = 0.8;   √(1 − ᾱ_t) = √0.36 = 0.6
(b) x_t = 0.8 × 3 + 0.6 × 1 = 2.4 + 0.6 = 3.0
(c) Signal contribution = 0.8 × 3 = 2.4;   Noise contribution = 0.6 × 1 = 0.6
    (in variance terms: 64% signal, 36% noise)
(d) As t ↑, ᾱ_t ↓ (product of numbers < 1), so √ᾱ_t ↓ → signal shrinks, √(1−ᾱ_t) ↑ → noise grows. At t = T, ᾱ_T ≈ 0 ⇒ x_T ≈ ε (pure noise).
```

If exam gives β_t instead: α_t = 1 − β_t first, then ᾱ_t = product.

## ✏️ Numerical type 2 (Q49 pattern) — multi-step schedule

**Given:** β_1 = 0.1, β_2 = 0.2, β_3 = 0.3, x_0 = 2, ε = 0.5.

| t | β_t | α_t = 1−β_t | ᾱ_t | √ᾱ_t | √(1−ᾱ_t) | Signal (√ᾱ·x_0) | Noise (√(1−ᾱ)·ε) | x_t |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.1 | 0.9 | 0.9 | 0.9487 | 0.3162 | 1.8974 | 0.1581 | **2.0555** |
| 2 | 0.2 | 0.8 | 0.9×0.8 = 0.72 | 0.8485 | 0.5292 | 1.6971 | 0.2646 | **1.9617** |
| 3 | 0.3 | 0.7 | 0.72×0.7 = 0.504 | 0.7099 | 0.7043 | 1.4199 | 0.3521 | **1.7720** |

**Analysis:** signal fraction (ᾱ) falls 90% → 72% → 50.4%; noise fraction (1−ᾱ) rises 10% → 28% → 49.6%. By step 3 signal and noise are almost equal. With more steps the image becomes pure noise.

## Stable Diffusion = Latent Diffusion + text conditioning (Q51)

**Text prompt → Tokenizer + CLIP Text Encoder (77×768 embeddings) → Cross-attention into U-Net**

**Random latent 64×64×4 (noise) → U-Net denoises T steps (predicts ε, scheduler: DDIM/DPM) → Clean latent → VAE Decoder → 512×512 image**

- **VAE encoder/decoder:** compresses 512×512×3 image into 64×64×4 latent (48× smaller) → diffusion runs in latent space → much faster and cheaper than pixel-space DDPM.
- **Text encoder (CLIP):** converts prompt into embeddings that capture meaning.
- **U-Net:** encoder–decoder with skip connections, residual blocks, time-step embedding, and **cross-attention layers** (Q = image latent features, K, V = text embeddings) → this is the conditioning mechanism.
- **Classifier-free guidance (CFG):** ε̂ = ε_uncond + s·(ε_cond − ε_uncond), s ≈ 7.5 → stronger prompt following.
- **Training:** image → VAE encode → add noise to latent → U-Net predicts noise given caption → MSE loss.
- **Advantages:** high quality, diverse, controllable by text, open-source, img2img, inpainting, ControlNet. **Limitations:** slow (many steps), struggles with text in images/hands/counting, bias, copyright & deepfake concerns, needs GPU.

## Diffusion vs GAN (Q50)

| Basis | GAN | Diffusion |
|---|---|---|
| Training | Adversarial, unstable | Simple MSE, stable |
| Mode coverage / diversity | Mode collapse risk | Covers all modes, high diversity |
| Quality | Sharp | State-of-the-art |
| Sampling speed | Fast (1 forward pass) | Slow (tens–1000 steps) |
| Likelihood | None | Has a variational bound |
| Control | cGAN, StyleGAN | Text, image, mask conditioning (very flexible) |

**Medical use — benefits:** augment rare conditions, balance classes, share data without real patients. **Challenges:** very small data (fine-tune pretrained / use latent diffusion), clinical validity (hallucinated lesions), evaluation by radiologists, compute. **Privacy risks:** diffusion models can **memorise and reproduce training images** → membership-inference attacks; mitigate with deduplication, differential privacy (DP-SGD), nearest-neighbour checks, ethics approval.
