---
title: "23. Formula Cheat-Sheet"
order: 23
---

| Topic | Formula |
|---|---|
| Bayes | P(y\|x) = P(x\|y)P(y) / P(x) |
| Naïve Bayes | P(y\|x) ∝ P(y) Π P(x_i\|y) |
| Logistic regression | P(y=1\|x) = σ(wᵀx + b) |
| VAE reparam | z = μ + σ ⊙ ε, ε ~ N(0, I) |
| ELBO | E_(q(z\|x))[log p(x\|z)] − KL(q(z\|x) ‖ p(z)) ≤ log p(x) |
| Gaussian KL | −½ Σ (1 + log σ² − μ² − σ²) |
| GAN value | min_G max_D E[log D(x)] + E[log(1 − D(G(z)))] |
| Optimal D | D*(x) = p_(data) / (p_(data) + p_g) |
| Non-saturating G | L_G = −log D(G(z)) |
| LSGAN | L_D = ½(D(x)−1)² + ½D(G(z))²; L_G = ½(D(G(z))−1)² |
| WGAN-GP | E[D(G(z))] − E[D(x)] + λE[(‖∇D(x̂)‖ − 1)²] |
| cGAN | E[log D(x\|y)] + E[log(1 − D(G(z\|y)\|y))] |
| Pix2Pix | L_(cGAN) + λ‖y − G(x)‖₁ (λ = 100) |
| AdaIN | y_s·(x − μ(x))/σ(x) + y_b |
| DDPM forward | x_t = √ᾱ_t x₀ + √(1−ᾱ_t) ε; α_t = 1 − β_t; ᾱ_t = Πα_s |
| DDPM loss | ‖ε − ε_θ(x_t, t)‖² |
| CFG | ε̂ = ε_u + s(ε_c − ε_u) |
| Attention | softmax(QKᵀ/√d_k) V |
| Multi-head | Concat(head₁…head_h) W^O; d_k = d_(model)/h |
| FFN | max(0, xW₁ + b₁)W₂ + b₂ |
| Residual + Norm | LayerNorm(x + Sublayer(x)) |
| Positional enc. | PE(pos,2i) = sin(pos/10000^(2i/d)); PE(pos,2i+1) = cos(…) |
| LM loss | −Σ log P(x_t \| x_(\<t)) |
| Temperature | softmax(logits / T) |
| Cosine similarity | A·B / (‖A‖‖B‖) |
