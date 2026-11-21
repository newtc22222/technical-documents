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
| [**Database design**](./architecture/database-design.md) | Column-level Postgres reference for assessment v2, flashcards, sharing, notifications, and migrations through `0029`. |
| [**API Documentation**](./architecture/api-documentation.md) | OpenAPI-oriented docs for Auth, Flashcards, Decks, Exams, Question Bank, and Media. |
| [**Question & Exam Design (Dev)**](./architecture/question-and-exam-design.md) | End-to-end design of the question bank, assessment v2 DSL, bank authoring pages, sitting, and grading. |
| [**Spaced Repetition (SM-2)**](./architecture/spaced-repetition-sm2.md) | Deep dive into the SM-2 mathematical model, quality mapping, ease factor bounds, and review queues. |

### Features

| Wiki Page | Description |
| --- | --- |
| [**AI Features (User Guide)**](./features/ai-features.md) | How to use explain, question generate, and non-spoiling exam hints. |
| [**Roles and Permissions**](./features/roles-and-permissions.md) | Client vs Operator vs env root admin. Stage 1 gates AI question generate. |
| [**AI Service Layer (Dev)**](./features/ai-service-layer.md) | Provider-agnostic client, `/api/ai/*` contracts, kill switch, migrations, and operator guide. |
| [**AI Feature Implementation Guide**](./features/ai-feature-guide.md) | Self-contained implementation blueprint for adding LLM-powered features. |
| [**Exam-Type Feature Flags**](./features/exam-type-feature-flags.md) | Backend-owned enable/disable flags per exam type — content-readiness gating, kill switch, data model, and operator guide. |
| [**TOEIC Listening Items**](./features/toeic-listening.md) | Parts 1–4 audio/photo on the shared bank, set-level clips, session play URLs, and the tape player. |
| [**Notifications & Reminders**](./features/notifications-and-reminders.md) | Inbox, live updates over SSE, Web Push (VAPID), and the hourly study-reminder job. |
| [**Themes & Appearance**](./features/themes-and-appearance.md) | The four presets, per-user `themeOverrides`, derived contrast, and the exam theme lock. |
| [**Deck Sharing**](./features/deck-sharing.md) | Share links that let a signed-in user preview a deck and copy it into their library; paged loading for big decks. |
| [**Practice Mode**](./features/practice-mode.md) | Drills from exams or the bank: `mode=practice`, pause, notes, optional immediate feedback, resits. |
| [**Card Image Uploads (R2 + CORS)**](./features/card-image-uploads.md) | Presign → browser PUT → confirm pipeline, required **bucket** CORS, and `.env` reload caveats. |

### Operations

| Wiki Page | Description |
| --- | --- |
| [**Deployment & DevOps Guide**](./operations/deployment-guide.md) | Current production: Vercel (SPA), a VPS running FastAPI and PostgreSQL in Docker Compose behind Caddy, Cloudflare R2, and the vercel.app proxy. |
| [**VPS deploy**](./operations/vps-deploy.md) | GitHub Actions build to GHCR and SSH deploy behind Caddy, for `main` (production) and `staging`. |
| [**Deployment Plan (Phase 1)**](./operations/deployment-plan.md) | The earlier Railway plan, kept for history. Not how the app is deployed now. |
| [**Domains and staging**](./operations/domain-cutover.md) | The phivo.dev and vercel.app hosts per environment, how a change reaches staging and production, and what a further domain move touches. |

### Releases

| Wiki Page | Description |
| --- | --- |
| [**Release v2.2.0**](./releases/release-v2.2.0.md) | **Current production** — flashcards and decks redesign, full-page bank authoring, admin console redesign, deck share links, vercel.app proxy. |
| [**Release v2.1.0**](./releases/release-v2.1.0.md) | Notification inbox with live SSE updates, Web Push and study reminders, per-user themes, practice hints, gzip and bundle performance. |
| [**Release v2.0.1**](./releases/release-v2.0.1.md) | Server-side section clocks, practice re-sit gates, bank drill cap. |
| [**Release v2.0.0**](./releases/release-v2.0.0.md) | Practice mode, exam blueprints, RBAC, AI listening, speaking prompts, skeletons & empty states. |
| [**Release v1.4.0**](./releases/release-v1.4.0.md) | Assessment v2 Question DSL, exam composer & booth, Question Bank console, AI provenance. |
| [**Release v1.3.1**](./releases/release-v1.3.1.md) | TOEIC part6/7 AI generation, editable passage sets, markdown-table passages. |
| [**Release v1.3.0**](./releases/release-v1.3.0.md) | AI tutor, flashcard TTS, sheet import, Learn. |
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
    VPS["VPS (Docker Compose behind Caddy)"]
    DB[("PostgreSQL 16 (asyncpg + SQLAlchemy)")]
    R2[("Cloudflare R2 Storage (S3 API)")]
    AI["AI Engine (Gemini Flash / OpenAI GPT-4o)"]

    Client -->|Static SPA| Vercel
    Client -->|HTTPS / JSON API| Backend
    Vercel -->|vercel.app pages: /api proxy| Backend
    VPS -->|Hosts| Backend
    VPS -->|Hosts| DB
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
> - **Optional AI tutor**: Explain cards/attempt items. Question generate is Operator-only; clients keep listening/TTS. See [AI Features](./features/ai-features.md) and [Roles and Permissions](./features/roles-and-permissions.md).
