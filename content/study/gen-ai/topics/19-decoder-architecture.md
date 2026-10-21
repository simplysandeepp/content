---
title: "Decoder Architecture"
order: 19
tagline: "Masked self-attention, cross-attention, and feed-forward, stacked and repeated one token at a time"
tags: ["Decoder", "Transformers", "Masked Self-Attention"]
diagram:
  direction: TB
  nodes:
    - { id: in, label: "Decoder Input (shifted right)", tone: lime }
    - { id: mask, label: "Masked Self-Attention", tone: cyan }
    - { id: encout, label: "Encoder Output (K, V)", tone: amber }
    - { id: cross, label: "Cross-Attention", tone: violet }
    - { id: ffn, label: "Feed-Forward", tone: cyan }
    - { id: out, label: "Next-token Probs", tone: lime }
  edges:
    - { from: in, to: mask, label: "+ residual/LN" }
    - { from: mask, to: cross, label: "+ residual/LN" }
    - { from: encout, to: cross, label: "K, V" }
    - { from: cross, to: ffn, label: "+ residual/LN" }
    - { from: ffn, to: out, label: "linear + softmax" }
---

## TL;DR
One Transformer decoder block stacks masked self-attention (look only at the past), cross-attention
(look at the full encoder output), and a feed-forward network — each wrapped in residual + layer
norm — and the whole stack finishes with a linear projection and softmax over the vocabulary to
predict the next token, one step at a time.

## Why it matters
This is the architecture behind every sequence-generation model built on an encoder-decoder
Transformer (machine translation, summarization) — and, with the cross-attention sublayer simply
removed, it's also the backbone of decoder-only LLMs like the GPT family.

## The core idea
A decoder generates output **autoregressively**: one token at a time, where each new token is
conditioned on every token generated so far, plus — in an encoder-decoder setup — the entire input
sequence. Masked self-attention handles "what have I generated so far," cross-attention handles
"what does the input actually say," and the feed-forward layer processes each position's combined
information further. Matlab, decoder apne hi output ko dekhte hue, aur encoder ke diye hue context
ko dekhte hue, ek-ek token aage badhta hai.

## How it works
Referring to the diagram, each decoder block runs (and this block is repeated `N` times):

1. **Masked (causal) self-attention sublayer** — standard self-attention over the decoder's own
   sequence so far, but with scores for any future position masked out before the softmax, so token
   `i` can only mix value vectors from positions `≤ i`. This is needed because at generation time
   future tokens genuinely don't exist yet, and during training (teacher forcing) the model must be
   prevented from peeking at the very tokens it's being trained to predict.
2. **Residual connection + layer norm** around that sublayer: `LayerNorm(x + Sublayer(x))`.
3. **Cross-attention sublayer** — queries `Q` come from the decoder's own (masked-attention) output;
   keys and values `K, V` come from the encoder's output. This lets the decoder "look up" whatever
   part of the input is relevant to the token it's about to generate.
4. **Residual connection + layer norm** around the cross-attention sublayer.
5. **Position-wise feed-forward network** — a small two-layer network with a nonlinearity, applied
   independently to each position.
6. **Residual connection + layer norm** around the feed-forward sublayer.
7. After `N` stacked blocks, a **final linear projection** maps each position's output to
   vocabulary-sized logits, and a **softmax** turns those into a probability distribution over the
   next token.
8. **Autoregressive loop** — pick the next token (sampling or argmax), append it to the sequence
   generated so far, feed the extended sequence back in as decoder input, and repeat until an
   end-of-sequence token or a maximum length is reached.

## The maths
Masked self-attention uses the same core formula as self-attention, with a mask added to the scores
before the softmax:

`scores = QK^T/√d_k + M`, where `M_ij = −∞` for `j > i` (future positions) and `M_ij = 0` otherwise,
then `Attention(Q,K,V) = softmax(scores) V`.

Cross-attention uses the identical formula, `softmax(QK^T/√d_k)V`, but `Q` is derived from the
decoder sequence while `K` and `V` are derived from the encoder's output — no masking is needed here
since the full input is already known.

Each sublayer is wrapped as `LayerNorm(x + Sublayer(x))` — the residual keeps gradients flowing
through the deep stack, and layer norm stabilizes the activation scale going into the next sublayer.

## Worked example
Translating French *"Je vais bien"* to English, generating one token per step:

- Step 1: decoder input is just `<BOS>`. Masked self-attention has only itself to attend to.
  Cross-attention looks across the whole encoded French sentence. Output: `"I"`.
- Step 2: decoder input is `<BOS, I>`. Masked self-attention can now use both positions (but not any
  future one). Cross-attention again looks at the full French input. Output: `"am"`.
- Step 3: decoder input is `<BOS, I, am>`. Output: `"fine"`.
- Generation stops at an end-of-sequence token.

At every step the decoder re-runs cross-attention against the *same, full* encoder output — it never
loses access to any part of the input, no matter how many tokens it has already generated.

## Exam traps
- Masking is applied **before** the softmax (adding `−∞` to disallowed positions), not after.
- "Masked self-attention" (causal masking during generation) is a completely different concept from
  BERT-style "masked language modeling" (masking input tokens to predict them) — don't conflate the
  two just because both use the word "masked."
- Decoder-only models (GPT-style) drop the cross-attention sublayer entirely and keep only masked
  self-attention + feed-forward — there's no encoder to attend to.
- Residual + layer norm wraps **each** sublayer individually, not just once at the very end of the
  whole block.

## Remember this
A decoder block = masked self-attention (see only the past) + cross-attention (see the whole input)
+ feed-forward, each guarded by residual + layer norm, repeated `N` times, finished with a softmax
over the vocabulary — one new token per pass through the autoregressive loop.
