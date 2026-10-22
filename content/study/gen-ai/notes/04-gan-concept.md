---
title: "4. Generative Adversarial Network (GAN)"
order: 4
diagram:
  direction: LR
  nodes:
    - { id: z, label: "Noise z ~ N(0,I)", tone: amber }
    - { id: generator, label: "Generator G", tone: coral }
    - { id: fake, label: "Fake sample G(z)", tone: lime }
    - { id: realdata, label: "Real data x ~ p_data", tone: violet }
    - { id: realsample, label: "Real sample x", tone: cyan }
    - { id: discriminator, label: "Discriminator D", tone: coral }
    - { id: output, label: "P(real) ∈ [0,1]", tone: lime }
  edges:
    - { from: z, to: generator }
    - { from: generator, to: fake }
    - { from: realdata, to: realsample }
    - { from: fake, to: discriminator }
    - { from: realsample, to: discriminator }
    - { from: discriminator, to: output }
    - { from: output, to: discriminator, label: "update D: real→1, fake→0" }
    - { from: discriminator, to: generator, label: "gradient feedback to G" }
---

> A **GAN** (Goodfellow, 2014) has two neural networks trained against each other: the **Generator G** turns random noise z into fake data G(z); the **Discriminator D** outputs the probability that its input is real. G tries to fool D, D tries to catch G. This competition (a **two-player minimax game**) makes G produce realistic data.

**Analogy:** G = counterfeiter making fake notes, D = police. Both keep improving until fakes are indistinguishable from real.

## Architecture / workflow diagram (Q19, Q20, Q22, Q54)

## Objective function (value function) — MUST memorise

```text
min_G max_D V(D, G) = E_x∼p_data[ log D(x) ] + E_z∼p_z[ log(1 − D(G(z))) ]
```

- **D maximises V:** wants D(x) → 1 (log 1 = 0, max) for real, and D(G(z)) → 0 so log(1−0)=0.
- **G minimises V:** only second term depends on G; wants D(G(z)) → 1 so log(1−D(G(z))) → −∞.
- **Optimal discriminator** for fixed G: **D*(x) = p_data(x) / (p_data(x) + p_g(x))**.
- Plugging D* back: V = −log 4 + 2·JSD(p_data ‖ p_g). Minimum when p_g = p_data → JSD = 0, D*(x) = ½ everywhere (**Nash equilibrium**, D just guesses).

## Training algorithm (alternating updates) (Q21, Q24)

1. Sample mini-batch of m real images x and m noise vectors z.
2. **Update D** (G fixed) by gradient **ascent**: ∇_θd (1/m) Σ [ log D(x^i) + log(1 − D(G(z^i))) ]. Can repeat k steps.
3. Sample new noise z.
4. **Update G** (D fixed) by gradient **descent** on (1/m) Σ log(1 − D(G(z^i))) — in practice **maximise log D(G(z))** (non-saturating).
5. Repeat until D(G(z)) ≈ 0.5 and samples look real.

**How G learns gradually:** G never sees real images. It only gets the gradient of D's output with respect to its fake image — this tells G "change these pixels in this direction to look more real". Early: blobs → mid: rough shapes → late: sharp, realistic samples.

**Forward pass:** z → G → G(z) → D → D(G(z)); x → D → D(x). **Backward pass:** D-loss gradients update only θ_d; G-loss gradients flow **through D** back into G, updating only θ_g.

## Generator & Discriminator design (Q23, Q25)

| | Generator | Discriminator |
|---|---|---|
| Input | Noise z (e.g. 100-dim, N(0,1)) | Image (real or fake), e.g. 28×28×1 |
| Layers (vanilla) | Dense 100→256→512→1024→784 | Dense 784→512→256→1 |
| Hidden activation | ReLU / LeakyReLU, BatchNorm | LeakyReLU (0.2), Dropout |
| Output | **Tanh** → pixels in [−1, 1] (reshape 28×28) | **Sigmoid** → probability real |
| Loss | −log D(G(z)) | BCE: real label 1, fake label 0 |

**Significance of latent input z:** provides randomness → diversity (different z → different output); the latent space becomes organised (nearby z → similar images; directions = attributes like smile, age) → enables interpolation & editing. Without z, G would produce one fixed output.

## GAN applications

**Face synthesis (StyleGAN)**, **Super-resolution (SRGAN)**, **Image-to-image (Pix2Pix, CycleGAN)**, **Colourisation**, **Data augmentation (medical, agriculture)**, **Text-to-image (StackGAN)**, **Inpainting**, **Tabular synthetic data (CTGAN)**, **Anomaly detection**.

## Scenario designs (Q52, Q53, Q54)

- **Diseased leaf generation (agriculture):** collect few diseased-leaf images → resize 64×64/128×128, normalise [−1,1] → DCGAN or cGAN (label = disease type) → train with minimax loss → filter outputs (expert / classifier confidence) → mix with real → train disease classifier → measure accuracy gain + FID.
- **Network-flow (tabular) GAN:** numeric features → min-max / mode-specific normalisation; categorical (protocol, flag) → one-hot; G output: Tanh for numeric, **Gumbel-Softmax** for categorical; D = MLP (or LSTM/Transformer for sequences); use **CTGAN / conditional vector** for imbalanced classes, WGAN-GP for stability. Evaluate: per-column distribution similarity (KS test), correlation matrix difference, TSTR intrusion-detection accuracy, privacy (distance to closest record).
- **Satellite images:** DCGAN/Progressive GAN with conv layers, multi-band input (RGB + NIR), real path vs fake path into D, value function as above, WGAN-GP or spectral norm for stability; evaluate with FID and domain experts.
