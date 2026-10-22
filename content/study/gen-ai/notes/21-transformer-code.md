---
title: "21. Transformer Hands-on (Hugging Face)"
order: 21
---

## Text generation with tokenization, inference, decoding

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
tok = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")

prompt = "Artificial intelligence will change education by"
ids = tok(prompt, return_tensors="pt")           # 1) tokenization -> input_ids
print(ids["input_ids"])                          #    e.g. tensor([[8001, 9542, 4430, ...]])

greedy = model.generate(**ids, max_new_tokens=40, do_sample=False)                 # greedy
temp   = model.generate(**ids, max_new_tokens=40, do_sample=True, temperature=0.8)  # temperature
topk   = model.generate(**ids, max_new_tokens=40, do_sample=True, top_k=50)         # top-k
topp   = model.generate(**ids, max_new_tokens=40, do_sample=True, top_p=0.9)        # nucleus
for name, out in [("greedy", greedy), ("temp", temp), ("top-k", topk), ("top-p", topp)]:
    print(name, ":", tok.decode(out[0], skip_special_tokens=True))   # 3) detokenize
```

**Observation to write:** greedy = coherent but repetitive; temperature 1.2 = creative but can drift; top-k/top-p = best balance of diversity and coherence.

## Summarization

```python
from transformers import pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
text = """Generative AI models learn the distribution of data ... (input paragraph)"""
print(summarizer(text, max_length=60, min_length=20, do_sample=False)[0]["summary_text"])
```

**How it finds important info:** BART/T5 is an encoder–decoder. The encoder's self-attention builds context for every sentence; while generating, cross-attention gives high weight to the most informative parts (named entities, main claims); it was fine-tuned on article→summary pairs (CNN/DailyMail) so it learned what humans keep. This is **abstractive** (writes new sentences) vs extractive (copies sentences).

## Classification

```python
clf = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
print(clf("The lecture on GANs was really clear!"))   # [{'label': 'POSITIVE', 'score': 0.99}]
```
