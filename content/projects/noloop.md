---
title: "Noloop"
description: "A glass-box medical claims adjudication and fraud-defense platform — an AI agent pipeline turns unstructured claim documents into explainable, role-specific decisions for patients, hospitals, and insurers."
metaDescription: "A glass-box medical claims adjudication platform — an AI agent pipeline turns unstructured claims into explainable decisions for patients, hospitals, insurers."
date: "2026-06-19"
tags: ["Next.js", "React", "TypeScript", "FastAPI", "Python", "Gemini", "PostgreSQL", "Celery", "CI/CD", "Render & Vercel"]
github: "https://github.com/simplysandeepp/Noloop"
live: "https://noloop.sandeepp.in"
demo: "https://youtu.be/946GA4_ADkc?si=uAjakaqGzPJq23Ec"
featured: true
priority: 1
pinned: true
---

## Overview

Noloop is a full-stack healthcare insurance claims platform built around one idea: make medical claim adjudication **faster, more explainable, and more transparent** for everyone involved. It pairs a role-based web experience for patients, hospitals, and insurers with an AI-assisted backend that handles OCR, document understanding, policy-grounded review, fraud-risk analysis, and decision support.

It is the production evolution of an earlier prototype (**ClaimHeart**, v1) — rebuilt as a real, end-to-end system.

## The Problem

Medical claims get stuck. Manual document review, incomplete submissions, unclear policy interpretation, and fraud risk all create delay. Patients can't understand why a claim was approved or rejected, hospitals get caught in endless back-and-forth, and insurers need real auditability before they sign off.

Noloop closes that gap by turning unstructured claim documents into structured review workflows with **visible reasoning** — every automated decision is traceable, not a black box.

## What I Built

- **Role-based dashboards** for three distinct workflows — patient, hospital, and insurer — each seeing the same claim through a lens built for them
- **OCR upload pipeline** for images and PDFs, converting raw documents into structured claim data
- **Gemini-assisted document understanding** — classification and structured extraction from messy real-world paperwork
- **Claim queue, claim detail, fraud alerts, decision letters, reports, and policy views**
- **Glass-box adjudication** — policy-grounded, evidence-backed recommendations with supporting rationale surfaced to the operator
- A **multi-agent architecture** spanning intake, policy review, medical/fraud review, and cross-validation

## How It Works

1. A hospital (or stakeholder) uploads claim documents.
2. OCR + extraction convert raw files into structured claim data.
3. Policy and medical/fraud analysis review the claim against the evidence and the governing policy.
4. A final recommendation is surfaced **with its reasoning**, not just a verdict.
5. Patients, hospitals, and insurers each view the claim through their own role-specific dashboard.

## Tech Stack

**Frontend:** Next.js, React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand

**Backend:** FastAPI, Uvicorn, Python, SQLAlchemy, PostgreSQL

**AI / OCR:** Google Gemini, Groq, EasyOCR, Tesseract, OpenCV, PyMuPDF, pdf2image

**Async & Infra:** Celery, Redis, Docker, Prometheus + Grafana for observability

## Use Case

Insurers and hospitals processing high volumes of medical claims who need to cut manual review time while keeping every decision **auditable and explainable** — surfacing fraud and anomaly signals early, and giving patients clear, understandable outcomes.

## Status

The platform ships a polished, end-to-end multi-role frontend with demo workflows, working OCR + extraction services, and a FastAPI backend; the deeper multi-agent orchestration and async infrastructure are being expanded toward full production.
