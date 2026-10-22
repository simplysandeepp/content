---
title: "3. Variational Autoencoder (VAE)"
order: 3
diagram:
  direction: LR
  nodes:
    - { id: input, label: "Input x", tone: lime }
    - { id: encoder, label: "Encoder q_φ(z|x)", tone: cyan }
    - { id: mu, label: "μ", tone: violet }
    - { id: logvar, label: "log σ²", tone: violet }
    - { id: eps, label: "ε ~ N(0,I)", tone: amber }
    - { id: reparam, label: "z = μ + σ⊙ε", tone: coral }
    - { id: decoder, label: "Decoder p_θ(x|z)", tone: cyan }
    - { id: output, label: "Reconstruction x̂", tone: lime }
  edges:
    - { from: input, to: encoder }
    - { from: encoder, to: mu }
    - { from: encoder, to: logvar }
    - { from: mu, to: reparam }
    - { from: logvar, to: reparam }
    - { from: eps, to: reparam, label: "reparameterize" }
    - { from: reparam, to: decoder }
    - { from: decoder, to: output }
---

> A **VAE** is a generative model with an encoder that maps an input x to a **probability distribution** (mean μ, variance σ²) in latent space, samples z from it, and a decoder that reconstructs x from z. Because the latent space is forced to be close to N(0, I), we can sample random z and decode it to **generate new data**.

## Autoencoder vs VAE (Q10)

| Basis | Standard Autoencoder | VAE |
|---|---|---|
| Encoder output | One fixed vector z | Two vectors: μ and log σ² (a distribution) |
| Latent space | Deterministic, irregular, has gaps | Probabilistic, smooth, continuous, ≈ N(0,I) |
| Loss | Reconstruction only | Reconstruction + KL divergence |
| Sampling | Random z → garbage | Random z ~ N(0,I) → meaningful new sample |
| Purpose | Compression, denoising | Generation, interpolation, augmentation |

**Why VAE is better for generation:** the KL term makes the latent space continuous and centred, so any nearby point decodes to a valid image, and interpolation between two points gives smooth morphing.

## Architecture (the diagram above)

Loss:
```text
Loss = ‖x − x̂‖² (reconstruction) + KL(q(z|x) ‖ N(0,I))
```

## Role of each part (Q11)

- **Encoder q_φ(z|x):** neural net (CNN/MLP) that outputs μ(x) and log σ²(x) — the "approximate posterior".
- **Latent space:** low-dimensional space (e.g. 2–128 dims) where each input is a Gaussian blob. Prior p(z) = N(0, I).
- **Reparameterization trick:** makes sampling differentiable (see below).
- **Decoder p_θ(x|z):** maps z back to data space; output layer sigmoid (pixels in [0,1]).
- **Generation:** throw away the encoder → sample z ~ N(0,I) → decoder → new image.

## Reparameterization trick (Q13)

**Problem:** z ~ N(μ, σ²) is a random sampling step. You cannot backpropagate through "random sampling" — the gradient of a random draw with respect to μ, σ is undefined.

**Solution:** move the randomness outside the network into a separate variable ε.

```text
z = μ + σ ⊙ ε,   ε ~ N(0, I),   σ = exp(½ · log σ²)

∂z/∂μ = 1,   ∂z/∂σ = ε   → gradients flow to the encoder
```

**Significance:** z still has distribution N(μ, σ²) (same randomness), but now z is a **deterministic, differentiable function** of μ and σ, so the whole VAE trains end-to-end with normal backprop / SGD. We predict log σ² (not σ) so the value can be any real number while σ itself stays positive.

## ELBO derivation (Q14, Q15, Q17) — write all steps

Goal: maximise log-likelihood log p_θ(x) = log ∫ p_θ(x|z) p(z) dz. This integral is **intractable** (over all z), and the true posterior p(z|x) is also intractable. So we introduce an approximate posterior q_φ(z|x).

```text
log p(x) = log ∫ p(x, z) dz
         = log ∫ q(z|x) · [ p(x, z) / q(z|x) ] dz
         = log E_q(z|x)[ p(x, z) / q(z|x) ]
         ≥ E_q(z|x)[ log p(x, z) − log q(z|x) ]      (Jensen's inequality: log E[·] ≥ E[log ·])
         = E_q[ log p(x|z) + log p(z) − log q(z|x) ]
         = E_q(z|x)[ log p(x|z) ] − KL( q(z|x) ‖ p(z) )   = ELBO
```

**Exact relation (alternate derivation):**

```text
log p(x) = ELBO + KL( q(z|x) ‖ p(z|x) )   and since KL ≥ 0 ⇒ log p(x) ≥ ELBO
```

- **Term 1 – reconstruction likelihood** E_q[log p(x|z)]: how well the decoder rebuilds x. In practice = −BCE or −MSE.
- **Term 2 – KL divergence** KL(q(z|x)‖p(z)): how far the encoder's distribution is from the prior N(0,I).
- Maximising ELBO pushes up a lower bound on log p(x) (a better generative model) **and** makes q(z|x) close to the true posterior.
- **VAE Loss = −ELBO = Reconstruction loss + KL loss.**

## KL divergence term (Q12)

```text
KL(P‖Q) = Σ P(x) log [P(x)/Q(x)]   (≥ 0, = 0 only when P = Q, not symmetric)

For q = N(μ, σ²), p = N(0, 1) (closed form):
KL = −½ Σ_(j=1..d) ( 1 + log σ_j² − μ_j² − σ_j² )
```

**Why needed / how it regularises:**

- Without KL, the encoder would make σ → 0 and put codes far apart → becomes a plain autoencoder → latent space has holes, random z gives garbage.
- KL pulls every μ towards 0 and σ towards 1 → codes overlap and fill the space → **continuous, complete** latent space.
- Acts like a regulariser, prevents overfitting, enables sampling from N(0,I).
- **Why both losses?** Only reconstruction → good copies, no generation. Only KL → all codes identical, outputs blurry average. Together → balance between accuracy and smooth latent space. (β-VAE: Loss = Recon + β·KL; β>1 gives more disentangled features.)

## Assumptions & limitations (Q15)

- Assumes prior N(0,I) and Gaussian (diagonal) posterior — too simple for complex data.
- Assumes pixel independence given z (Gaussian/Bernoulli likelihood).
- **Limitation 1: Blurry outputs** — MSE/BCE loss averages possibilities (GANs/diffusion are sharper).
- **Limitation 2: Posterior collapse** — with a powerful decoder, KL → 0 and the decoder ignores z.
- **Limitation 3: ELBO is only a bound** — there's a gap between ELBO and the true log p(x).
- **Limitation 4:** trade-off between reconstruction and KL (needs tuning β).
- Advantages: stable training, no mode collapse, meaningful latent space, encoder gives representations.

## Design: VAE for small-dataset augmentation (Q16, Q18)

**Small real dataset → Preprocess (resize, normalise [0,1]) → Train VAE (Recon + KL) → Sample z~N(0,I) or perturb real z → Decode synthetic images → Quality filter → Real + synthetic → train classifier → Test on REAL test set**

- **Class-wise generation:** train one VAE per class or a Conditional VAE (add label to encoder & decoder).
- **Latent sampling:** random z ~ N(0,I), or encode a real image and add small noise, or interpolate between two images.
- **Quality filtering:** remove samples with low classifier confidence, high reconstruction error, or near-duplicates of training images (privacy).
- **Evaluation:** (1) Visual / expert check; (2) FID, IS scores; (3) **Downstream test**: train a classifier on real only vs real+synthetic, compare accuracy/F1 on the real test set — if accuracy improves, the synthetic data is useful; (4) TSTR (train on synthetic, test on real).
