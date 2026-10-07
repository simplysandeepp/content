---
title: "Stateful"
description: "An all-in-one CS study platform — algorithm visualizations, a VS Code-grade online compiler, an admin dashboard, and focus tools in one glassmorphic interface."
date: "2025-01-01"
tags: ["React 19", "TypeScript", "Vite", "Monaco Editor", "Firebase", "Framer Motion", "Piston API"]
github: "https://github.com/simplysandeepp/Stateful"
live: "https://stateful.sandeepp.in"
featured: true
priority: 5
---

## Overview

Stateful (formerly Algorithmm) is a comprehensive **Computer Science education platform** built to bridge the gap between theory and practice. Whether you're a student mastering DSA, a developer practicing competitive programming, or an admin running a coding cohort, Stateful brings the tools into one unified, glassmorphic interface.

## The Problem

CS learners juggle a dozen disconnected tools — one site to visualize algorithms, another to compile code, a separate timer to stay focused, and nothing to manage a cohort. Stateful consolidates all of it into a single focused environment.

## What I Built

**Online Compiler & IDE**
- Powered by **Monaco Editor** (the engine behind VS Code)
- Multi-language: C, C++, Java, Python
- Secure, sandboxed execution via the **Piston API**, with full `stdin` support
- Cloud sync — code auto-saves to Firebase Firestore

**Algorithm Visualizer**
- Smooth 60fps animations (Framer Motion) for sorting and pathfinding
- Covers Bubble/Merge/Quick Sort, BFS, DFS, Dijkstra, and more
- Step-by-step execution with speed control, plus side-by-side code and theory

**Admin Dashboard**
- User management — searchable table, role toggling (User/Admin), password reset, profile deletion
- File management — inspect, edit, create, and delete user-submitted code
- Analytics on user registration and file activity

**Study Tools**
- Pomodoro timer with customizable focus/break intervals
- Stopwatch with lap timing and an aesthetic full-screen IST clock

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion

**Editor & Execution:** Monaco Editor, Piston API

**Backend & Data:** Firebase (Auth + Firestore)

## Use Case

Students learning DSA, developers drilling competitive programming, and instructors managing a coding cohort — everything from running code to visualizing algorithms to staying focused, in one place.
