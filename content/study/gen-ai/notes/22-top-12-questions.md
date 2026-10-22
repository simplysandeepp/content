---
title: "⭐ 22. The 12 Most-Likely Exam Questions — Answer Plans"
order: 22
---

Each plan tells you exactly what to write. Expand using the sections above.

### Q1. Explain GAN working principle / architecture with diagram, minimax objective and training algorithm. (10–16 marks)

1. Definition + counterfeiter-police analogy.
2. Labelled diagram: z → G → fake; real x; both → D → P(real); feedback arrows (§4).
3. Value function min_G max_D V; explain each term; D* = p_(data)/(p_(data)+p_g); equilibrium D = ½, JSD.
4. Alternating training algorithm (5 steps); forward/backward passes.
5. G/D design table (Tanh, Sigmoid, LeakyReLU).
6. Role of latent z.
7. Applications + 2 challenges.

### Q2. VAE: architecture, reparameterization trick, derive ELBO, role of KL. (16 marks)

1. Definition; AE vs VAE quick table.
2. Diagram x → encoder → μ, logσ² → z = μ + σε → decoder → x̂.
3. Encoder, latent, decoder roles.
4. Reparameterization: why sampling blocks gradients; formula; ∂z/∂μ = 1.
5. ELBO derivation via Jensen (§3) + log p(x) = ELBO + KL(q‖p(z|x)).
6. Loss = Recon + KL; closed-form KL; why both needed.
7. Generation from N(0,I); 3 limitations (blurry, posterior collapse, loose bound).

### Q3. Generative vs Discriminative models; Bayes; Naïve Bayes vs Logistic Regression. (7–16 marks)

1. Definitions; joint vs conditional with spam example.
2. Bayes derivation P(y|x) = P(x|y)P(y)/P(x).
3. Diagram (class blobs vs boundary).
4. 10-row comparison table.
5. NB formula vs LR sigmoid formula, training, decision, pros/cons.
6. Conclusion: generative for small data / generation / OOD; discriminative for accuracy.

### Q4. GAN loss functions and training challenges (mode collapse, vanishing gradients, instability) + LSGAN / WGAN. (10–16 marks)

1. L_D, saturating L_G, non-saturating L_G with formulas.
2. Explain gradient issue: log(1−D) flat near 0 vs −log D steep near 0.
3. Three challenges with cause + symptom.
4. Fix table; LSGAN & WGAN-GP formulas.
5. Comparison table standard / LSGAN / WGAN; conclude WGAN-GP for medical images.

### Q5. Diffusion models: forward & reverse process + numerical. (10 marks)

1. Definition; chain diagram x₀ → x_T and back.
2. q(x_t|x_(t−1)), α, ᾱ, closed form x_t.
3. Loss ‖ε − ε_θ‖²; training steps; sampling steps.
4. Numerical: compute α → ᾱ (product) → √ᾱ, √(1−ᾱ) → x_t → contributions → trend (§9 tables).
5. Role of Gaussian noise; diffusion vs GAN table.

### Q6. Self-attention with numerical example (Q, K, V, softmax). (10 marks)

1. Concept + Q/K/V meaning + "it → animal" example.
2. Formula and flow diagram.
3. Five computational steps exactly as §12 (Q, K, V table → QKᵀ → ÷√d_k → softmax rows → AV).
4. Why √d_k; heatmap interpretation.

### Q7. Transformer architecture (encoder, decoder, FFN, residual, LayerNorm) + positional encoding. (16 marks)

1. Motivation table (RNN problems).
2. Big encoder–decoder diagram (§11).
3. Encoder layer steps; decoder: masked self-attn, cross-attn, FFN, linear+softmax.
4. Formulas: attention, MHA, FFN, PE sin/cos.
5. Residual & LayerNorm purpose.
6. Variants: BERT (encoder), GPT (decoder), T5 (both).

### Q8. Conditional GAN (+ MNIST digit control / image colourisation). (10 marks)

1. Definition; cGAN diagram with y into both G and D.
2. Objective with D(x|y), G(z|y).
3. Injection methods (concat, embedding, channels, projection).
4. MNIST example; GAN vs cGAN table.
5. Pix2Pix: U-Net + PatchGAN + L1 (for colourisation question).
6. Applications + limitations.

### Q9. StyleGAN: mapping network, W space, AdaIN, coarse/middle/fine control, style mixing. (10–16 marks)

1. Key idea: style-based generator.
2. Diagram (§8): z → 8-layer MLP → w → A → AdaIN at each resolution; learned constant; noise.
3. AdaIN formula.
4. Coarse / middle / fine table with attributes.
5. Style mixing, truncation, stochastic variation.
6. Traditional GAN vs StyleGAN table; latent editing w + α·d.

### Q10. RAG architecture / design for a university portal. (10–16 marks)

1. Definition + why (hallucination, fresh/private data).
2. Two-phase diagram (§19).
3. 8 steps: ingestion → chunking → embeddings → indexing → retrieval → prompt → generation → citations.
4. Specific design choices (chunk size, metadata, hybrid search, reranker, date filter).
5. Sample prompt template; evaluation; challenges.

### Q11. Zero/one/few-shot and Chain-of-Thought prompting with examples. (7 marks)

1. Definition of prompt engineering & in-context learning.
2. Same-task examples (sentiment) for 0/1/few-shot.
3. CoT example (apples).
4. When-to-use table; comparison with role & instruction prompting.

### Q12. Intro to GenAI: mechanism, types with applications, use cases & challenges, medical augmentation. (7–10 marks)

1. Definition (learns p(x), samples new data) + flow diagram.
2. Characteristics list.
3. Types table (VAE, GAN, Diffusion, Transformer, Flow) with one application each.
4. Domain use-case table; 2 challenges (hallucination, bias/privacy/deepfakes).
5. Medical augmentation justification.

**Tip:** **Also prepare quickly:** Multi-head attention (§13), cross-attention translation example (§15), DCGAN guidelines (§6), decoding strategies table (§16), Stable Diffusion pipeline (§9), code snippets (§10, §21) for any "implement" question — write the code skeleton + explain each block.
