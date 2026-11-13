---
title: "Encyclopedia — A Structured CS Knowledge Base"
description: "An early-stage personal CS and software-engineering knowledge platform: a strict node file format with a six-level hierarchy, a 13-rule validation spec, scaffolding for 57 subjects, generation scripts, and a small Next.js reader that renders the markdown graph."
metaDescription: "A structured, validated markdown knowledge base for CS and SE topics — frontmatter schema, hierarchy, prerequisite graph rules, generation scripts and a Next.js reader."
date: "2026-09-19"
tags: ["Next.js 16", "TypeScript", "Markdown", "Knowledge Graph", "Content Pipeline", "Python", "Node.js"]
featured: false
---

## Overview

Encyclopedia is a personal project to build a structured, cross-linked knowledge base of computer-science and software-engineering topics. The interesting part is not the volume of text but the **structure**: every piece of knowledge is a node with a defined shape, a place in a hierarchy, and explicit prerequisites, so the whole thing can be validated and navigated like a graph instead of being a pile of notes.

It is early-stage and I want to be clear about that. The design documents and the tooling are the finished part. The content is **machine-generated and not yet reviewed line by line**, so it should be read as a draft corpus, not authoritative reference material. The project isn't published as a public repository yet.

## What's There

- **Node file format:** YAML frontmatter (`id`, `kind`, `parent_id`, `title`, `difficulty`, `tags`, optional `prerequisites` and `related_to`) followed by a fixed ten-section body — overview, explanation, real example, key takeaway, related concepts, quiz, interview questions, code example, references
- **Six-level hierarchy:** Subject → Unit → Topic → Subtopic → Concept → Lesson, with parentage defined by `parent_id` rather than folder placement
- **Validation spec:** 13 rules covering ID format and uniqueness, reference resolution, circular prerequisites, allowed values, body section order, minimum quiz and interview-question counts, and in-body link integrity
- **Scaffolding:** 57 subject folders spanning programming fundamentals to AI/agentic engineering and interview preparation
- **Generation scripts:** Python and Node scripts that emit node files and print directory trees
- **Reader app:** a small Next.js 16 site with subject pages and lesson pages that render GitHub-flavoured markdown, list a node's children as "next in this path", and read content from disk

## Design Documents

Seven short docs describe the hierarchy, file format, validation rules, architecture (source of truth and layers), planned tech stack, tracking metrics and a week-by-week workflow. They are written so that a validator and a database import can be built straight from them.

## Tech Stack

**Reader:** Next.js 16, React 19, TypeScript, `react-markdown`, `remark-gfm`

**Tooling:** Python and Node.js scripts for generation

## Status

The validator described in the spec is not built yet; that is the next step before expanding any subject's content. I'd rather finish the validator and review a single subject end to end than keep generating.
