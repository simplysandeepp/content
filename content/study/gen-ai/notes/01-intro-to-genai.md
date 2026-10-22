---
title: "1. Introduction to Generative AI"
order: 1
---

> **Generative AI** is a class of AI models that learn the probability distribution of the training data, p(x), and then sample from it to create new data (images, text, audio, code) that looks like the training data but is not a copy.

## Fundamental mechanism (how it works)

**Large dataset → Learn patterns / distribution p(x) → Compress into latent space / parameters → Sample (noise z or prompt) → Decode → new data**

1. **Learning:** model sees many examples and learns hidden structure (shapes, textures, grammar).
2. **Latent representation:** data is mapped to a compact space where similar things are close.
3. **Sampling:** pick a random point / give a prompt.
4. **Generation:** decoder / generator / denoiser turns it into a realistic output.

## Characteristics

- **Novelty** – creates new samples, not copies.
- **Probabilistic** – same input can give different outputs (diversity).
- **Learns from unlabeled data** (mostly unsupervised / self-supervised).
- **Controllable** – conditioning with labels, text prompts, images.
- **Multimodal** – text, image, audio, video, code.
- **Data-hungry and compute-heavy.**

## Types of generative models

| Type | Idea | Advantage | Real application |
|---|---|---|---|
| VAE | Encoder → probabilistic latent space → decoder | Stable training, smooth latent space, fast sampling | Data augmentation, anomaly detection, drug molecules |
| GAN | Generator vs Discriminator game | Very sharp, realistic images; fast sampling | Face generation (StyleGAN), super-resolution, deepfakes |
| Diffusion | Add noise step-by-step, learn to remove it | Best quality + diversity, stable training | Stable Diffusion, DALL·E, Midjourney |
| Autoregressive / Transformer (LLM) | Predict next token given previous ones | Excellent for text & code, scalable | ChatGPT, Claude, Copilot |
| Flow-based | Invertible transforms, exact likelihood | Exact p(x) | Glow, audio synthesis |

## Use cases (with example)

| Domain | Use | Example |
|---|---|---|
| Healthcare | Synthetic medical images, drug discovery, report drafting | GAN/diffusion to make extra MRI tumour images; AlphaFold-style protein design |
| Education | Personal tutors, quiz generation, summaries | AI tutor that explains a topic at student's level |
| Entertainment | Game assets, music, film VFX, de-aging | Text-to-music, AI concept art |
| Marketing | Ad copy, product images, personalised emails | Generate 50 banner variants for A/B test |
| Software dev | Code generation, tests, documentation | GitHub Copilot, Claude Code |
| Content creation | Blogs, video, voice-overs, translations | Text-to-video, AI dubbing |

**Major challenges:** (1) **Hallucination / factual errors**, (2) **Bias** from training data, (3) **Privacy** (model may memorise patient data), (4) **Copyright & deepfakes / misuse**, (5) high compute cost & energy.

## Why GenAI suits synthetic medical-image augmentation (Q1)

- Medical data is **small, costly, privacy-restricted**, and **imbalanced** (rare diseases).
- Generative model learns p(x) of scans → samples new, realistic, varied scans → bigger and balanced training set → better classifier, less overfitting.
- Synthetic data can be shared with less privacy risk (no real patient).
- Best choice: **Diffusion** (quality + diversity) or **cGAN** (class control); **VAE** if data is very small and stability matters.
- Must validate: radiologist review, FID score, and train-on-synthetic-test-on-real accuracy.
