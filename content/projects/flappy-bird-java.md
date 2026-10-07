---
title: "Flappy Bird (Pure Java)"
description: "A complete browser-based Flappy Bird recreation in pure Java — custom game engine, physics, collision detection, all built from scratch."
date: "2024-04-01"
tags: ["Java", "Java Swing", "AWT", "OOP"]
github: "https://github.com/simplysandeepp/FlappyBird-Game"
featured: false
---

## Overview

A complete recreation of Flappy Bird built in **pure Java** — no game engine, no external libraries. Every part of it (rendering loop, physics, collision, scoring) is written from scratch using Java Swing and AWT, as an exercise in core game-programming fundamentals and object-oriented design.

## What I Built

- **Custom game loop** — a fixed-timestep render/update cycle driving the animation
- **Physics** — gravity, flap impulse, and velocity integration for the bird's motion
- **Collision detection** — pixel/bounds checks between the bird and the pipes
- **Procedural pipes** — randomized gaps that scroll and recycle
- **Scoring & game states** — start, playing, and game-over screens with score tracking
- **Keyboard input** handling for the flap control

## Tech Stack

**Language:** Java

**UI / Rendering:** Java Swing, AWT

**Design:** Object-oriented architecture (separate entities for bird, pipes, game manager)

## Why It Matters

Building a game without an engine forced me to understand the fundamentals most frameworks hide — the render loop, frame timing, physics integration, and collision math — all in clean OOP Java.
