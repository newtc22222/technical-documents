---
id: intro
title: LinguFlow Documentation
sidebar_label: Overview
sidebar_position: 0
description: Official technical documentation, architecture hub, and operational guide for LinguFlow.
---

# 🧠 LinguFlow Wiki

Welcome to the **LinguFlow** official technical wiki and documentation hub.

LinguFlow is a modern, high-performance, keyboard-driven language certification platform designed for HSK, JLPT, TOEIC, and IELTS candidates. It combines a distraction-free Vue 3 pixel-art arcade interface with an async Python FastAPI backend, PostgreSQL relational database, SuperMemo-2 (SM-2) spaced repetition engine, and multi-provider AI assistance (Gemini Flash & GPT-4o).

---

## 📚 Documentation Directory

### Start here

| Wiki Page | Description |
| --- | --- |
| [**Application Overview**](./architecture/application-overview.md) | What LinguFlow is, the feature set, technology stack, and repository layout. |
| [**Architecture & Database Schema**](./architecture/architecture-and-database-schema.md) | Layered architecture, ER diagrams, PostgreSQL models, Alembic migrations, and database design. |
| [**Database design**](./architecture/database-design.md) | Column-level Postgres reference for assessment v2, flashcards, sharing, and migrations through `0021`. |
| [**API Documentation**](./architecture/api-documentation.md) | OpenAPI-oriented docs for Auth, Flashcards, Decks, Exams, Question Bank, and Media. |
| [**Question & Exam Design (Dev)**](./architecture/question-and-exam-design.md) | End-to-end design of the question bank, assessment v2 DSL, sitting, and grading. |
| [**Spaced Repetition (SM-2)**](./architecture/spaced-repetition-sm2.md) | Deep dive into the SM-2 mathematical model, quality mapping, ease factor bounds, and review queues. |

### Features

| Wiki Page | Description |
| --- | --- |
| [**AI Features (User Guide)**](./features/ai-features.md) | How to use explain, question generate, and non-spoiling exam hints. |
| [**AI Service Layer (Dev)**](./features/ai-service-layer.md) | Provider-agnostic client, `/api/ai/*` contracts, kill switch, migrations, and operator guide. |
| [**AI Feature Implementation Guide**](./features/ai-feature-guide.md) | Self-contained implementation blueprint for adding LLM-powered features. |
| [**Exam-Type Feature Flags**](./features/exam-type-feature-flags.md) | Backend-owned enable/disable flags per exam type — content-readiness gating, kill switch, data model, and operator guide. |
| [**TOEIC Listening Items**](./features/toeic-listening.md) | Parts 1–4 audio/photo on the shared bank, set-level clips, session play URLs, and the tape player. |
| [**Practice Mode**](./features/practice-mode.md) | Drills from exams or the bank: `mode=practice`, pause, notes, optional immediate feedback, resits. |
| [**Card Image Uploads (R2 + CORS)**](./features/card-image-uploads.md) | Presign → browser PUT → confirm pipeline, required **bucket** CORS, and `.env` reload caveats. |

### Operations

| Wiki Page | Description |
| --- | --- |
| [**Deployment & DevOps Guide**](./operations/deployment-guide.md) | Deployment blueprints for Vercel (Frontend), Railway (FastAPI + PostgreSQL), Cloudflare R2, and Docker Compose. |
| [**Deployment Plan (Phase 1)**](./operations/deployment-plan.md) | Target infrastructure, platform setup steps, env-var matrix, and the deployment verification checklist. |
| [**Domain cutover**](./operations/domain-cutover.md) | Staging preview (no custom domain) and the move of production to `lingu-flow.com`. |

### Releases

| Wiki Page | Description |
| --- | --- |
| [**Release v1.4.0**](./releases/release-v1.4.0.md) | **Current production** — Assessment v2 architecture, Question DSL, Exam Composer & Booth. |
| [**Release v1.3.1**](./releases/release-v1.3.1.md) | TOEIC part6/7 AI generation, editable passage sets, markdown-table passages. |
| [**Release v1.3.0**](./releases/release-v1.3.0.md) | AI tutor, flashcard TTS, sheet import, Learn batch mode. |
| [**Release v1.2.1**](./releases/release-v1.2.1.md) | Three-theme system and the OMR answer sheet. |
| [**Release v1.2.0**](./releases/release-v1.2.0.md) | Multi-exam-type foundation: five new item types, IELTS registered, single-source version. |
| [**Release v1.1.1**](./releases/release-v1.1.1.md) | TOEIC Listening (bank media + player) and exam-integrity sitting lock. |
| [**Release v1.0.0**](./releases/release-v1.0.0.md) | Horizon A/B features, security, ops, and branding (MVP title removed). |
| [**Release Notes (v0.1.0)**](./releases/release-v0.1.0.md) | Earlier FastAPI + PostgreSQL platform milestone. |

---

## 🛠️ Technology Stack Overview

```mermaid
graph TD
    Client["Vue 3 Frontend (Vite, Pinia, TypeScript, Pixel Arcade CSS)"]
    Vercel["Vercel Edge Network"]
    Backend["FastAPI Async Backend (Python 3.12, Uvicorn, Pydantic v2)"]
    Railway["Railway Cloud Hosting"]
    DB[("PostgreSQL 16 (asyncpg + SQLAlchemy)")]
    R2[("Cloudflare R2 Storage (S3 API)")]
    AI["AI Engine (Gemini Flash / OpenAI GPT-4o)"]

    Client -->|HTTPS / JSON API| Vercel
    Vercel -->|Proxy / Reverse Proxy| Backend
    Backend -->|Async Connection Pool| DB
    Backend -->|Presigned S3 PUT/GET| R2
    Backend -->|Async AI Gateway| AI
```

### 1. Frontend Architecture

- **Framework**: Vue 3 (Composition API `<script setup>`), TypeScript, Pinia State Management, Vue Router 4.
- **Design System**: Arcade Pixel Art CSS design system (`arcade.css`), `Press Start 2P`, `IBM Plex Mono`, and `IBM Plex Sans` typography.
- **Key Views**: `AuthView.vue`, `FlashcardsView.vue`, `DeckManagementView.vue`, `QuestionBankView.vue`, `ExamListView.vue`, `ExamComposerView.vue`, `AttemptView.vue`, `ResultsView.vue`, `PracticeSetupView.vue`.

### 2. Backend Architecture

- **Framework**: FastAPI (Python 3.12+), Pydantic v2 schemas, `uvicorn` ASGI server.
- **ORM & Database**: SQLAlchemy 2.0 (Async Engine) with `asyncpg` driver for PostgreSQL 16.
- **Security & Auth**: `bcrypt` password hashing, `python-jose` JWT authentication, Google OAuth2, in-place guest account migration.
- **Assessment**: versioned bank + exams + attempts under `routers/assessment_*.py` (see [Question & Exam Design](./architecture/question-and-exam-design.md)).

---

## 🚀 Key Features

> **Key Features at a Glance**:
>
> - **SM-2 Spaced Repetition**: Dynamic card scheduling based on user memory retention scores (1-4).
> - **Full Exam Simulator**: Timed certification exams with version-pinned attempts, section clocks, multi-scale scores, and a separate **practice** mode (bank/exam draws, optional immediate feedback). TOEIC Listening (Parts 1–4) plays from shared stimulus blocks — see [TOEIC Listening Items](./features/toeic-listening.md) and [Question & Exam Design](./architecture/question-and-exam-design.md).
> - **In-Place Guest Account Migration**: Guest users can register at any time without losing a single flashcard or study deck.
> - **Optional AI tutor**: Explain cards/attempt items, generate unattached bank questions — core flows never depend on a vendor. See [AI Features](./features/ai-features.md).
