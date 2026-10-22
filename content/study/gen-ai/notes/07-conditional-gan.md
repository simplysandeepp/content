---
title: "7. Conditional GAN (cGAN) & Image-to-Image Translation"
order: 7
diagram:
  direction: LR
  nodes:
    - { id: z, label: "Noise z", tone: lime }
    - { id: y, label: "Label y (one-hot \"7\")", tone: amber }
    - { id: concat_zy, label: "concat [z, y]", tone: violet }
    - { id: g, label: "G(z|y)", tone: cyan }
    - { id: fake, label: "Fake \"7\"", tone: cyan }
    - { id: real, label: "Real x with its label y", tone: amber }
    - { id: concat_xy, label: "concat [x, y]", tone: violet }
    - { id: d, label: "D(x|y)", tone: coral }
    - { id: output, label: "Real & matches label? [0,1]", tone: coral }
  edges:
    - { from: z, to: concat_zy }
    - { from: y, to: concat_zy }
    - { from: y, to: concat_xy, label: "same label y also fed to D" }
    - { from: concat_zy, to: g }
    - { from: g, to: fake }
    - { from: fake, to: concat_xy }
    - { from: real, to: concat_xy }
    - { from: concat_xy, to: d }
    - { from: d, to: output }
---

> A **Conditional GAN** (Mirza & Osindero, 2014) gives **extra information y** (class label, text, image) to **both** the Generator and the Discriminator, so we can **control what is generated** (e.g., "generate digit 7").

## Conditional objective

```text
min_G max_D V = E_(x,y)[ log D(x | y) ] + E_(z,y)[ log(1 − D(G(z | y) | y)) ]
```

D now checks two things: **(1) is it realistic? (2) does it match the label?** So G must produce a realistic image of the *requested* class.

## Ways to inject the condition (Q35)

- **Concatenation:** one-hot y concatenated with z (G) and with flattened image (D).
- **Embedding:** label → learned embedding vector → concatenate / multiply with z.
- **Extra channels:** for conv D, label expanded to H×W×C maps and stacked with image channels.
- **Projection discriminator:** D output = ψ(φ(x)) + embed(y)^T φ(x).
- **Conditional BatchNorm / AdaIN:** label controls normalisation scale & shift.
- **Auxiliary classifier (AC-GAN):** D also predicts the class.
- **Image as condition** (Pix2Pix): input image concatenated with output image for D.

## MNIST example (Q33)

G input = 100-dim z + 10-dim one-hot (or embedding of 0–9) → 110 → dense layers → 784 Tanh. D input = 784 image + 10-dim label → dense → sigmoid. At test time: fix y = 3, change z → many different handwriting styles of "3".

## GAN vs cGAN (Q34)

| Basis | GAN | cGAN |
|---|---|---|
| Input to G | z only | z + condition y |
| Input to D | x | x + y |
| Objective | D(x), D(G(z)) | D(x\|y), D(G(z\|y)\|y) |
| Control | Random, no control | Choose class/attribute |
| Mode collapse | More likely | Less (labels force coverage) |
| Data | Unlabelled OK | Needs labelled / paired data |

**Applications:** class-specific augmentation (rare diseases), text-to-image, image-to-image (Pix2Pix), face aging with age label, product images with chosen colour/style. **Limitations:** needs labels, can ignore the label if poorly designed, only controls seen conditions, still has GAN instability.

## Image-to-image translation: Pix2Pix (Q44, Q45)

A cGAN where the condition is an **input image** (e.g. grayscale photo) and the output is the translated image (colour photo).

**Grayscale image (L channel) → U-Net Generator (encoder–decoder + skip connections) → Coloured image → PatchGAN D sees (gray, colour) pair → Real/fake for each 70×70 patch**

```text
L = L_cGAN(G, D) + λ · E[ ‖ y − G(x) ‖_1 ],   λ = 100
```

- **Generator (U-Net):** encoder downsamples to capture context; decoder upsamples; **skip connections** carry edges/details directly.
- **Discriminator (PatchGAN):** judges local patches → sharp textures.
- **L1 loss:** keeps output close to ground truth (correct colours/structure); GAN loss adds realism/sharpness.
- **Training:** paired data (convert colour photos to grayscale to create pairs).
- **E-commerce:** product sketch → photo, change background/day→night, style transfer. If no paired data → **CycleGAN** (two G's, two D's, cycle-consistency loss ‖F(G(x)) − x‖).
