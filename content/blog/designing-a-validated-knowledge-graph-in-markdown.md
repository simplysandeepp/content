---
title: "Designing a Knowledge Base You Can Validate — A Markdown Node Format and 13 Rules"
description: "Why I started the Encyclopedia project with a file format and a validation spec instead of content: a typed frontmatter schema, ids that encode their own rules, prerequisites as a graph that must stay acyclic, and an honest look at what mass AI-assisted generation does and doesn't give you."
metaDescription: "Designing a validated markdown knowledge graph — frontmatter schema, ID rules, acyclic prerequisites, body structure checks and the limits of AI-generated content."
date: "2026-09-19"
tags: ["Knowledge Graph", "Markdown", "Data Modelling", "Validation", "AI-Assisted Writing", "Dev Log"]
published: true
---

It is easy to produce a lot of text. It is hard to produce a lot of text that stays *consistent*. When I started a CS knowledge base, I wrote the structure down before writing any content, on the theory that a bad format costs more the more content you pour into it. This post describes that format and what I'd check next.

## A Node Is a Typed Record

Every piece of knowledge is one markdown file with frontmatter:

| Field | Purpose |
|---|---|
| `id` | Globally unique, `lowercase-word-word-number` (e.g. `acid-001`) |
| `kind` | One of subject, unit, topic, subtopic, concept, lesson |
| `parent_id` | The node one level up |
| `difficulty` | beginner / intermediate / advanced |
| `tags` | At least one |
| `prerequisites`, `related_to` | Optional lists of other ids |

The body is a fixed ten-section skeleton: overview, explanation, real example, key takeaway, related concepts, quiz, interview questions, code example, references. A fixed skeleton sounds rigid, but it means a reader always knows where to look, and a validator can check structure mechanically.

## Hierarchy Lives in the Data, Not the Folders

Folders mirror the hierarchy for human browsing, but the **truth is `parent_id`**. That makes moving a file harmless to the graph and lets a concept be re-parented by editing one field. It also means a validator has a precise job: check that every `parent_id` resolves to a real node.

## Thirteen Rules, Written Before the Validator

The spec lists the checks a validator must enforce. They fall into three groups:

**Per-file (local):** frontmatter present with required fields; id format; allowed `difficulty` and `kind` values; at least one tag; all ten sections present and in order; at least two quiz questions; at least two interview questions with expected answers.

**Cross-file (referential):** ids unique across the corpus; every `prerequisite` and `related_to` resolves; `parent_id` resolves; in-body links like `[text](some-id-001)` point to real nodes.

**Graph-level:** **no circular prerequisites.** If A requires B and B requires A, a learning path can't be computed. Detecting that is a standard cycle check (depth-first search with a visiting set, or Kahn's algorithm) and it is the one rule that can't be checked by looking at a file in isolation.

Because the rules are written as a spec, the validator's expected output is also specified: per-file failures with the rule broken and how to fix it, and a summary report.

## What I Haven't Built Yet

The validator doesn't exist. That's the honest status, and it matters because of the next section.

## The Honest Part About Generated Content

The corpus is produced with AI assistance, through scripts that emit node files. The format makes that *safer*, not *correct*:

- A validator can guarantee structure — sections, ids, links — but it **cannot guarantee accuracy**. A well-formed node can still be wrong.
- Mass generation produces uniform prose. Some files are overview-level and some are long, and not every one earns its place.
- Early scripts embed content as long string literals, which makes them hard to regenerate or diff. A better design generates from a structured source (a CSV or outline) and keeps prose out of the code. The repository already reserves a `data/` folder for exactly that.

My plan is to **finish the validator first, then take one subject through review end to end** — checking facts, running the code examples, trimming repetition — before generating anything more. A small reviewed corpus is more useful than a large unreviewed one.

## Takeaways

1. Define the schema and the rules before the content.
2. Put relationships in data (`parent_id`, `prerequisites`), not in the folder tree.
3. Some rules are graph rules; budget time for cycle detection.
4. Structure validation is necessary but isn't a substitute for human review of the content.
