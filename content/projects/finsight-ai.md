---
title: "FinSight AI"
description: "An AI-powered financial intelligence platform — parallel agents deliver probabilistic revenue forecasts, buy/sell signals, and peer benchmarks in under 20 seconds."
metaDescription: "An AI-powered financial intelligence platform — parallel agents deliver revenue forecasts, buy/sell signals, and peer benchmarks in under 20 seconds."
date: "2025-03-01"
tags: ["Python", "FastAPI", "React", "Scikit-learn", "SHAP", "Groq LLaMA", "MongoDB"]
github: "https://github.com/simplysandeepp/finSight-AI"
featured: true
priority: 4
---

## Overview

FinSight AI is an agentic, multi-model **financial intelligence platform** that automates analysis which traditionally takes analysts hours. Enter a ticker and a date — get a probabilistic revenue forecast, a buy/sell signal, peer benchmarks, and a full audit trail in **under 20 seconds**. It combines quantitative finance, multi-agent LLM reasoning, and real-time market data into one fast pipeline.

## The Problem

Traditional financial analysis means reading earnings transcripts by hand, building Excel models, monitoring news, and running competitive comparisons — repetitive work that's slow and hard to keep consistent. FinSight AI integrates all of it into a single automated pipeline with explainable outputs.

## What I Built

- **Parallel AI agents** running concurrently via Python `asyncio` for sub-20-second results
- **Probabilistic forecasts** — Bear / Base / Bull scenarios via quantile regression, not a single point estimate
- **SHAP explainability** so every forecast can be traced to its drivers
- **News + NLP + competitor analysis** for macro and peer context
- **PDF reports with a full audit trail** of how each signal was produced

## Architecture

Specialized agents run concurrently and a final ensembler fuses their outputs into one calibrated signal:

- **Transcript NLP agent** — extracts and summarizes key financial drivers from earnings calls
- **Financial model agent** — quantitative forecasting with quantile regression (Bear/Base/Bull)
- **News macro agent** — aggregates, classifies, and scores macro news sentiment
- **Competitor agent** — benchmarks the target against industry peers
- **Ensembler (CIO agent)** — fuses all outputs into one calibrated investment signal with reasoning

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS

**Backend:** FastAPI, Python, asyncio

**ML:** Scikit-learn, quantile regression, SHAP

**LLM:** Groq (LLaMA 3)

**Database:** MongoDB Atlas

## Use Case

Retail and analyst users who want a fast, explainable second opinion on a stock — forecast, signal, peer context, and the reasoning behind it — without spending hours building models by hand.

## Status

Production (v2.0) with CI; actively maintained.
