---
title: "HydroVexel — AI Oil Spill Detection"
description: "A deep learning system that detects oil spills from satellite imagery with 94.57% accuracy using U-Net with Attention Gates, deployed on Streamlit."
date: "2024-09-01"
tags: ["Python", "TensorFlow", "U-Net", "Attention Gates", "Streamlit", "OpenCV", "Deep Learning"]
github: "https://github.com/simplysandeepp/INFOSYS-_INTERNSHIP-OIL_SPILL_DETECTION-"
live: "https://hydrovexel.streamlit.app"
featured: false
---

## Overview

HydroVexel is an AI-powered oil spill detection system that analyzes satellite imagery and instantly identifies oil spills in the ocean — at **94.57% accuracy**. Built for the **GDG Noida Build-a-thon**, it's aimed at protecting marine environments through rapid detection and faster response.

## Why It Matters

Oil spills devastate marine life, pollute coastlines, damage fishing and tourism economies, and cause long-term ecological harm. Traditional detection is slow and manual — HydroVexel makes it instant and accurate, so response teams can act faster.

## What I Built

- **Real-time detection** — upload a satellite image, get an instant result
- **94.57% accuracy** from a U-Net segmentation model with Attention Gates
- **Visual analysis** — heatmaps, segmentation overlays, and confidence scores
- **Cloud storage** to save and track detections over time
- **Zero-install web app** with an ocean-themed, animated UI

## How It Works

A modular segmentation pipeline:

1. **Preprocessing** — image resizing, normalization, and augmentation
2. **Model** — U-Net with Attention Gates focuses the network on spill regions
3. **Inference** — pixel-level segmentation produces the spill mask
4. **Visualization** — overlays, heatmaps, and a confidence score are rendered back to the user

## Tech Stack

**ML / CV:** Python, TensorFlow, U-Net + Attention Gates, OpenCV

**App & Deploy:** Streamlit (live), cloud storage for detection history

## Use Case

Environmental agencies and maritime responders who need rapid, automated screening of satellite imagery to spot oil spills early — replacing slow manual review with instant, explainable detection.

## Outcome

Built for the GDG Noida Build-a-thon; deployed and publicly usable on Streamlit with a measured **94.57% detection accuracy**.
