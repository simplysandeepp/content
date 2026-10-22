---
title: "19. Retrieval-Augmented Generation (RAG)"
order: 19
diagram:
  direction: LR
  nodes:
    - { id: question, label: "User question", tone: lime }
    - { id: embed, label: "Embed query", tone: cyan }
    - { id: search, label: "Similarity search", tone: cyan }
    - { id: prompt, label: "Augmented prompt", tone: violet }
    - { id: llm, label: "LLM", tone: amber }
    - { id: answer, label: "Answer + citations", tone: lime }
  edges:
    - { from: question, to: embed }
    - { from: embed, to: search }
    - { from: search, to: prompt, label: "top-k chunks" }
    - { from: prompt, to: llm }
    - { from: llm, to: answer }
---

> **RAG** combines a **retriever** (search over your documents using embeddings) with a **generator** (LLM). Relevant chunks are retrieved and put into the prompt, so the LLM answers using **up-to-date, private, verifiable** information and cites sources — reducing hallucination without retraining.

The diagram above shows the online query-time path. Offline, a matching indexing pipeline runs first: **Documents → Load & clean → Chunking → Embedding model → Vector DB**, so that the query-time similarity search above has something to search against.

## Step-by-step workflow

1. **Ingestion:** load PDFs, web pages, notices; clean text; attach metadata (title, date, page, department).
2. **Chunking:** split into pieces (e.g. 300–800 tokens) with overlap (10–20%) so meaning isn't cut. Strategies: fixed size, recursive by paragraphs/headings, semantic chunking.
3. **Embedding generation:** each chunk → vector using embedding model (e.g. all-MiniLM, text-embedding-3).
4. **Indexing:** store vectors + text + metadata in a vector database with ANN index (HNSW).
5. **Retrieval:** embed user query with the same model → cosine similarity → top-k chunks. Improve with **hybrid search** (BM25 keyword + vector) and a **re-ranker** (cross-encoder). Metadata filters (e.g. "2026 notices only").
6. **Prompt augmentation:** "Answer ONLY using the context below. If not present, say 'not found'. Cite sources. Context: [chunk1 (source)] … Question: …"
7. **Generation:** LLM writes the answer.
8. **Source grounding:** show citations (document name, page/section) so users can verify.

## University knowledge-portal design

- **Sources:** syllabus PDFs, academic regulations, exam guidelines, notices (with dates).
- **Chunking:** by section headings (e.g. "Attendance rule 4.2"), 500 tokens, 50 overlap; metadata = doc type, program, semester, date, URL.
- **Vector store:** Chroma/FAISS/pgvector; re-index automatically when new notices are uploaded; latest notice overrides older (date filter).
- **Retrieval:** hybrid + re-rank, filter by student's program.
- **Prompt:** role "university assistant", answer only from context, cite, say "contact office" if unsure.
- **Output:** "Minimum attendance is 75% [Academic Regulations 2025, §4.2]".
- **Evaluation:** retrieval recall@k, answer faithfulness, relevance (RAGAS), human feedback. **Access control** for internal docs.

## Applications & benefits

Customer support bots, enterprise document Q&A, legal/medical search, university helpdesk, code-base assistants. Benefits: fresh knowledge without retraining, fewer hallucinations, citations, private data stays in your DB, cheaper than fine-tuning. Challenges: bad chunking/retrieval → bad answers, context-window limits, latency, outdated index, prompt injection from documents.

```python
# Minimal RAG (LangChain-style pseudocode)
chunks   = RecursiveTextSplitter(chunk_size=500, overlap=50).split(load_pdfs("docs/"))
db       = Chroma.from_documents(chunks, embedding=HuggingFaceEmbeddings("all-MiniLM-L6-v2"))
docs     = db.similarity_search(question, k=4)
context  = "\n\n".join(f"[{d.metadata['source']}] {d.page_content}" for d in docs)
prompt   = f"Answer only from the context and cite sources.\nContext:\n{context}\nQuestion: {question}"
answer   = llm.invoke(prompt)
```
