---
title: "Cross-attention"
order: 20
tagline: "Query from the decoder, key and value from the encoder — how the decoder reads the full input"
tags: ["Cross-Attention", "Transformers", "Machine Translation"]
---

## TL;DR
Cross-attention is the same scaled dot-product attention mechanism as self-attention, except the
query comes from the decoder's own sequence while the keys and values come from the encoder's
output — it's how the decoder "reads" the full input while generating each output token.

## Why it matters
Cross-attention is the mechanism that connects the two halves of an encoder-decoder Transformer —
machine translation, summarization, speech-to-text — letting generation stay grounded in the source
sequence rather than only in whatever has already been generated. Without it, a decoder would only
ever see its own previously generated tokens (via masked self-attention) and would have no way to
refer back to the actual input at all — the two attention types do genuinely different jobs, and a
decoder block needs both.

## The core idea
Self-attention: `Q`, `K`, and `V` all come from the *same* sequence (a sequence attending to
itself). Cross-attention: `Q` comes from the decoder's current sequence (what am I about to
generate, what do I need to know), while `K` and `V` come from the encoder's output (what did the
input actually contain). Matlab, decoder apne andar se sawaal (query) banata hai, aur encoder ke
output mein se jawaab (key/value) dhoondta hai.

## How it works
Cross-attention uses the identical formula as self-attention: `softmax(QK^T/√d_k)V`, with
`Q = decoder_state · W_Q`, `K = encoder_output · W_K`, `V = encoder_output · W_V`. Each decoder
layer typically has its own cross-attention sublayer with its own learned `W_Q, W_K, W_V` — separate
from the self-attention projections used in that same block. Because `K` and `V` only depend on the
encoder's output, they're computed once and reused by every decoder step and every decoder layer;
only `Q` changes as generation progresses.

## The maths
`Attention(Q,K,V) = softmax(QK^T / √d_k) V`

- `Q` — projected from the decoder's own sequence representation at the current step.
- `K, V` — projected from the encoder's final output, computed once for the whole input sequence.
- `√d_k` — same scaling as self-attention, keeping dot products from growing too large before the
  softmax.
- The softmax produces, for each decoder position, a weighted distribution over *all* encoder
  positions — a soft alignment, not a hard pick-one match.

## Worked example
Translating English *"I love cats"* to French *"J'aime les chats"*, step by step (qualitative —
these are illustrative attention patterns to show the idea, not measured numbers from a real model):

- **Step 1**: decoder has only `<BOS>`, about to generate `"J'"` (the subject pronoun contraction).
  Cross-attention weight is concentrated mostly on **"I"** in the encoder output — the subject.
- **Step 2**: decoder has `<BOS, J'>`, about to generate `"aime"` (the verb). Cross-attention weight
  shifts toward **"love"** — the verb in the source sentence.
- **Step 3**: decoder has `<BOS, J', aime>`, about to generate `"les"` (plural article for the
  object). Cross-attention weight shifts toward **"cats"** — the object.
- **Step 4**: generating `"chats"`. Cross-attention weight stays on **"cats"**.

Notice the decoder re-attends to the input *fresh* at every step, and the correspondence doesn't
need source and target word order to match — cross-attention finds the relevant source word(s)
regardless of where they sit in the sentence.

## Why this lets the decoder "see" the full input
At every single generation step, cross-attention has access to `K, V` built from the *entire*
encoder output — all input positions — not a fixed-size summary vector or just the most recent
hidden state, the way older RNN encoder-decoder models worked with a single bottleneck context
vector. That means the decoder can freshly re-attend to any part of the input at any output step,
which also handles alignment problems — differing word order, one-to-many word mappings between
languages — naturally through learned attention weights, instead of needing a hard-coded alignment.

## Exam traps
- Cross-attention's `K, V` are computed once from the encoder output and reused at every decoder
  step/layer — only `Q` changes as generation proceeds, so there's no need to re-run the encoder.
- No causal mask is needed on the encoder side for cross-attention — the whole input is already
  fully known, so there's no future-leakage issue there. Masking is only needed in the decoder's own
  self-attention, over the target tokens being generated.
- Cross-attention's `W_Q, W_K, W_V` are separate, independently learned parameters from the
  self-attention sublayer's — they are not shared.
- "Attends to" means a soft, weighted distribution over all source tokens via softmax, not a hard,
  single-token alignment — don't describe it as picking exactly one source word.
- Don't confuse cross-attention with self-attention just because the formula looks identical — the
  *source* of `Q` versus `K, V` is the entire distinction, and it's what every exam question on this
  topic is really probing.
- Every decoder layer typically has its own cross-attention sublayer, sitting after that layer's
  masked self-attention sublayer and before its feed-forward sublayer — it isn't a single global
  step applied once to the whole decoder stack.

## Remember this
Cross-attention = the decoder asks a question (`Q`), and the encoder's output answers with keys and
values — giving the decoder a fresh, full look at the entire input sequence at every single
generation step.
