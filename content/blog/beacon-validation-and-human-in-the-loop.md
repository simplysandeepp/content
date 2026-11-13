---
title: "Trusting AI Drafts Less — Validation Flags, Versioned Sections and Human-in-the-Loop Edits"
description: "How Beacon keeps a generated document reviewable: rule-based gap detection, an LLM check for requirement-versus-decision contradictions, append-only section versions with human-edit locking, and natural-language edit requests that go through the same ledger."
metaDescription: "Validation and human-in-the-loop design for AI-generated documents — gap and contradiction flags, versioned section ledger, lock on human edits and natural-language edits."
date: "2026-06-07"
tags: ["LLM", "Human-in-the-Loop", "Validation", "Python", "PostgreSQL", "Dev Log"]
published: true
---

The most important question for an AI-generated document is not "is it good?" but "**how will a person find out where it's wrong?**" This post covers the parts of Beacon that exist to answer that: validation, versioning and human editing.

## Two Kinds of Validation

`validate_brd` runs after generation and records flags in a `brd_validation_flags` table with a type, a description, a severity and an `auto_resolvable` field.

**1. Rule-based gaps.** If a section contains the "Insufficient data" placeholder, a *gap* flag (medium severity) is recorded saying the section needs stakeholder clarification. No model call is needed; it's just string matching on a convention agents already follow.

**2. LLM contradiction check.** If both *functional requirements* and *decisions* exist and are non-empty, a second prompt asks the model to find any requirement that directly conflicts with a decision, and to answer in strict JSON: `{"has_contradiction": bool, "description": str}`. A contradiction is recorded as a high-severity cross-section flag.

Two things I like about this check:

- It is **skipped** when either input is missing, so it doesn't invent a conflict out of nothing.
- It is wrapped so that a failure of the AI check logs an error and does not fail the whole validation. A validator that can crash generation would soon be switched off.

An LLM judge has its own error rate, so these flags are *prompts for a human to look*, not verdicts. They're stored with `auto_resolvable = False` for exactly that reason.

## Sections Are Versioned, Not Overwritten

Every edit — by an agent, by a regeneration, or by a person — creates a **new row** with an incremented `version_number` for that session and section, rather than updating in place. Each row records its content, the snapshot it belongs to, the source chunk ids, whether it was human-edited, and when it was created. Reading "the current section" is `ORDER BY version_number DESC LIMIT 1`.

Append-only versions give three things nearly for free: history, the ability to see what an AI regeneration changed, and the groundwork for undo.

## A Human Edit Locks the Section

When a person edits a section, that version is marked `human_edited`. `is_section_locked` checks the latest version, and the natural-language editor refuses to apply an AI change to a locked section. This is the rule behind the product claim "lock sections once reviewed so edits do not overwrite approved content": a regeneration should never silently erase something a reviewer approved.

## Natural-Language Edits Use the Same Ledger

A user can type an instruction such as "make the timeline section more specific about the launch phase". The flow is:

1. `parse_ad_hoc_prompt` asks the model to turn the request into a structured intent (which section, what change).
2. `store_edit_intent` records the request.
3. `apply_edit` checks the lock, fetches the current content and snapshot, rewrites the section with the model, and calls `create_new_version(..., origin="ai")`.

Because AI edits go through the same versioned ledger as human edits, they are auditable and reversible in the same way, and the origin of every version is recorded.

## Review Queue Upstream Too

The noise filter has the same philosophy earlier in the pipeline: low-confidence labels are kept and **flagged for review** instead of being silently discarded, and a human can restore a suppressed chunk. So the human has a hook at three points — which messages count, what the document says, and whether the document contradicts itself.

## Lessons

1. Give the model an explicit way to say "I don't have the data", and make that machine-readable.
2. Put a cheap rule check in front of expensive model checks.
3. Treat LLM validators as advisory; never let them block the pipeline.
4. Append, don't overwrite; protect reviewed content with a lock.
5. Every AI action should leave an auditable record.
