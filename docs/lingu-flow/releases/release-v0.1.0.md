---
id: release-v0.1.0
title: Release Notes — v0.1.0 (MVP)
sidebar_label: v0.1.0 (MVP)
sidebar_position: 5
description: Release notes for LinguFlow v0.1.0, representing the initial MVP release and migration to FastAPI & PostgreSQL.
---

> **Latest official release:** [**v1.2.1**](./release-v1.2.1.md) — three themes, OMR answer sheet, and accessibility updates.

---

# 🚀 Release Notes — v0.1.0

**Release Version**: `v0.1.0`  
**Release Date**: August 5, 2026  
**Target Environment**: Production (Vercel + Railway + Cloudflare R2)

---

## 🌟 Major Milestone Overview

LinguFlow **v0.1.0** represents the initial production release of the platform, marking the complete architectural migration from Node.js/MongoDB to an async **Python FastAPI** backend with **PostgreSQL 16**, **SQLAlchemy 2.0 (Async)**, **Alembic**, and **SuperMemo-2 (SM-2)** spaced repetition engine.

---

## 📋 Feature Breakdown

### 🔐 1. Authentication & Security
- **JWT & Bcrypt Security**: Direct password hashing using `bcrypt` and JWT token handling.
- **Google OAuth2**: Seamless social login integration.
- **In-Place Guest Account Migration**: Guest users can register a permanent account without losing any study cards or decks.
- **Password Reset**: Added `POST /api/auth/forgot-password` endpoint.

### 🃏 2. Flashcards & SuperMemo-2 (SM-2) Engine
- **Pure Python SM-2 Engine**: Quality rating scale (1-4 -> 0-5), dynamic interval calculation, and ease factor floor (1.3).
- **Study Queue**: `GET /api/cards/study` returns cards due for review (`srs_next_review <= now()`).
- **CamelCase SRS Contract**: Full frontend compatibility with `srsData: { interval, easeFactor, repetitions, nextReviewDate }`.

### 📚 3. Deck Management
- **Deck CRUD API**: Full support for deck creation, updating, listing, and deletion.
- **Dynamic `cardCount` Aggregation**: Aggregated deck card counts via Outer Join queries.

### 📝 4. Exam Simulator Engine
- **Certification Test Banks**: Pre-seeded with **33 built-in practice questions** across TOEIC Part 5, IELTS Academic Reading, HSK Level 2, and JLPT N5.
- **Timed Practice Sessions**: Real-time timer countdown, question passage rendering, multiple-choice options, instant scoring, and detailed review maps.

### ⚡ 5. Storage
- **Cloudflare R2 Integration**: S3 presigned PUT/GET URLs for fast and secure media uploads.

---

## 🧪 Test & Build Verification

- **Backend Pytest Suite**: 31/31 tests passing.
- **Frontend Production Build**: Vue 3 / Vite production bundle compiled without errors.
