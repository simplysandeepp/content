---
title: "Practical Hands-on: GAN or VAE Implementation"
order: 10
tagline: "What the training loop actually looks like, and the three bugs that bite everyone once"
definition: "Implementing a GAN or VAE in PyTorch means defining the two (or encoder/decoder) networks, picking matching activation functions and loss terms, and training carefully — detaching the Generator's output before the Discriminator's step, and watching loss curves and sample grids rather than a single metric."
tags: ["PyTorch", "GAN", "VAE", "Implementation"]
---

## TL;DR
A GAN training loop is just two models and two optimizers, alternating: update the discriminator on
real + fake batches, then update the generator through the (now slightly smarter) discriminator.
Almost every beginner bug comes from getting the `detach()`, the loss sign, or the data
normalization wrong — all three are easy to check for explicitly.

## Why it matters
Knowing the formulas for the GAN objective doesn't help if the implementation silently does the
wrong thing — GANs are notorious for training "successfully" (loss numbers look fine) while
producing garbage, because the usual failure modes don't crash, they just quietly make the model
worse. Being able to read a training loop and spot the bug is as much an exam-relevant skill here as
the theory.

## The core idea
End to end, a GAN training script needs exactly these pieces:
1. **Data loading** — a `DataLoader` over real images, normalized to match whatever activation the
   generator's output layer uses.
2. **Model definitions** — `Generator`: latent noise `z` → image-shaped tensor. `Discriminator`:
   image-shaped tensor → single scalar (real/fake probability).
3. **Loss** — binary cross-entropy, since the discriminator is a binary classifier.
4. **Two optimizers** — one for `G`, one for `D`, since they're trained on different objectives and
   you never want a single `.step()` moving both.
5. **Alternating updates** — each iteration: train `D` first (on a real batch and a fake batch),
   then train `G` (using `D`'s judgment of fresh fake images).

Matlab, the generator never sees a label — it only ever gets a gradient signal by routing through
the discriminator, so if that routing (the `detach`, the sign, the forward pass) is wrong, `G` gets
no useful signal and training stalls or diverges without an obvious crash.

## How it works
Per iteration, on a batch of real images `real_imgs`:

- **Train D**: sample noise `z`, generate `fake_imgs = G(z)`. Compute `D`'s loss on real images
  (target label = 1, "real") and on fake images (target label = 0, "fake") — crucially using
  `fake_imgs.detach()` so gradients from this step don't flow back into `G`. Backprop, step `D`'s
  optimizer only.
- **Train G**: reuse (or regenerate) fake images, but this time **don't** detach — the whole point
  is for the gradient to flow back through `D` into `G`. Compute the loss as if the fake images
  should be classified "real" (target label = 1) — this is the standard **non-saturating**
  generator loss, which gives stronger gradients early in training than the original saturating
  formulation. Backprop, step `G`'s optimizer only.

**Three bugs that account for most broken GAN runs:**
- **Forgetting `.detach()` on D's fake input**: without it, `D`'s backward pass also computes
  gradients through `G`, and depending on how optimizers are wired, `G`'s weights can get nudged by
  `D`'s optimizer step — or at minimum you waste memory and time building a graph you don't need. At
  worst it silently corrupts training dynamics.
- **Wrong loss sign**: the generator must be trained to **maximize** `log D(G(z))` (equivalently,
  minimize BCE loss treating fake images as if labeled real). Flipping this — training `G` to
  directly minimize `D(G(z))`'s "fake" probability instead — teaches it to look *more* fake, the
  opposite of the intended direction.
- **Mismatched normalization**: if the generator's final layer is `tanh` (output range `[-1, 1]`)
  but the real images were normalized to `[0, 1]`, the discriminator sees two different data ranges
  for real vs fake from the start and learns to distinguish them trivially on that alone, instead of
  on actual image content. Always normalize real images to match the generator's output activation
  range.

**Sanity-checking training** (since loss numbers alone can lie):
- Plot `D` and `G` losses per epoch. A healthy run has both losses hovering in a moderate range,
  not `D`'s loss collapsing to ~0 (means `D` is crushing `G`, which then gets no useful gradient) and
  not wildly oscillating without settling.
- Periodically generate a grid of samples from a **fixed** noise batch (same `z` every time) and
  save it every few epochs — watching the same seeds evolve is the single best signal that `G` is
  actually learning, independent of what the loss numbers say.
- Watch for mode collapse: if the sample grid shows the same image (or a handful of near-identical
  images) regardless of the input noise, that's a diversity failure the loss curves alone won't
  reveal.

## The maths
Discriminator maximizes `log D(x) + log(1 − D(G(z)))`; generator (non-saturating, used in practice)
maximizes `log D(G(z))` instead of minimizing `log(1 − D(G(z)))` — stronger gradients early in
training, when `D` easily rejects `G`'s samples. In code, "maximize `log D(G(z))`" becomes "minimize
BCE loss between `D(G(z))` and the label `1`," since BCE with target 1 is exactly `−log(D(G(z)))`.

## Worked example — the core alternation in code
```python
criterion = nn.BCELoss()
opt_D = torch.optim.Adam(D.parameters(), lr=2e-4, betas=(0.5, 0.999))
opt_G = torch.optim.Adam(G.parameters(), lr=2e-4, betas=(0.5, 0.999))

for real_imgs in dataloader:                 # real_imgs already normalized to [-1, 1]
    b = real_imgs.size(0)
    real_labels = torch.ones(b, 1)
    fake_labels = torch.zeros(b, 1)

    # ---- 1. Train Discriminator ----
    z = torch.randn(b, z_dim)
    fake_imgs = G(z)

    opt_D.zero_grad()
    loss_D_real = criterion(D(real_imgs), real_labels)
    loss_D_fake = criterion(D(fake_imgs.detach()), fake_labels)   # detach: no grad into G here
    loss_D = loss_D_real + loss_D_fake
    loss_D.backward()
    opt_D.step()

    # ---- 2. Train Generator ----
    opt_G.zero_grad()
    loss_G = criterion(D(fake_imgs), real_labels)   # NOT detached: non-saturating G loss
    loss_G.backward()
    opt_G.step()
```
Why this is correct: `fake_imgs` is computed once from `G(z)`. For `D`'s update, it's detached so no
gradient reaches `G`. For `G`'s update, the *same* `fake_imgs` tensor (still attached to `G`'s graph)
is passed through `D` again — a fresh forward pass through `D`'s (just-updated) weights — and the
loss treats it as if it should be labeled real, which is exactly the non-saturating generator
objective. Each optimizer only ever steps its own model's parameters.

## Exam traps
- If asked to spot a bug in a given snippet: check `detach()` placement first, then the label used
  in the generator's loss (should be `1`, i.e. "fool D into saying real"), then whether real-image
  normalization matches the generator's final activation.
- A VAE loop looks different — no adversary, no alternation — it's one forward pass (encode → sample
  `z` via the reparameterization trick → decode), one combined loss (reconstruction + KL), one
  optimizer step. Don't describe a VAE loop as "alternating" anything.
- Calling `opt_G.step()` without a fresh `opt_G.zero_grad()` beforehand accumulates gradients across
  iterations — a quieter bug than the ones above, but worth knowing as "why would gradients keep
  growing."

## Remember this
Detach the fake images for D's step, don't detach them for G's step, train G to make D say "real,"
and match your image normalization to your generator's output activation — get those four things
right and the rest is just plumbing.
