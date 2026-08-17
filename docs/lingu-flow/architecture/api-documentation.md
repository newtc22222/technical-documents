---
id: api-documentation
title: API Documentation
sidebar_label: API Reference
sidebar_position: 3
description: RESTful JSON API endpoints for authentication, flashcards, decks, exams, and media.
---

# 📡 API Documentation

LinguFlow exposes a RESTful JSON API implemented using **FastAPI**. All endpoints are prefixed with `/api`.

Interactive API documentation is automatically available at runtime:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 🔒 Authentication Headers

Protected endpoints require a valid JWT bearer token in the HTTP request header:
```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account with email & password | No |
| `POST` | `/api/auth/login` | Authenticate user with credentials | No |
| `POST` | `/api/auth/guest` | Instant guest login (returns temporary guest token) | No |
| `POST` | `/api/auth/google` | Authenticate via Google OAuth2 ID token | No |
| `POST` | `/api/auth/forgot-password` | Request password reset verification link | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | **Yes** |

### Request & Response Schemas:

#### `POST /api/auth/register`
**Request Body**:
```json
{
  "username": "candidate1",
  "email": "candidate1@example.com",
  "password": "Password123!"
}
```
**Response (201 Created)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c1f7b8e2-9d3a-4e2b-8a1f-0b2c3d4e5f6a",
    "username": "candidate1",
    "email": "candidate1@example.com",
    "isGuest": false
  }
}
```

---

## 2. Flashcard & SM-2 Endpoints (`/api/cards`)

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/cards/study` | Fetch cards due for review (`srs_next_review <= now()`) | **Yes** |
| `POST` | `/api/cards/review/{id}` | Process review score (1-4) via SM-2 algorithm | **Yes** |
| `GET` | `/api/cards` | List all flashcards owned by user | **Yes** |
| `POST` | `/api/cards` | Create a new flashcard | **Yes** |
| `PUT` | `/api/cards/{id}` | Update flashcard prompt or definition | **Yes** |
| `DELETE` | `/api/cards/{id}` | Delete flashcard | **Yes** |

#### Card Response Format (CamelCase `srsData` Contract):
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
  "userId": "c1f7b8e2-9d3a-4e2b-8a1f-0b2c3d4e5f6a",
  "deckId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "front": "Ephemeral",
  "back": "Lasting for a very short time",
  "srsData": {
    "interval": 1,
    "easeFactor": 2.5,
    "repetitions": 1,
    "nextReviewDate": "2026-08-05T00:00:00Z"
  },
  "createdAt": "2026-08-04T00:00:00Z",
  "updatedAt": "2026-08-04T00:00:00Z"
}
```

---

## 3. Deck Management Endpoints (`/api/decks`)

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/decks` | List all decks owned by user with aggregated `cardCount` | **Yes** |
| `POST` | `/api/decks` | Create a new study deck | **Yes** |
| `PUT` | `/api/decks/{id}` | Update deck name and description | **Yes** |
| `DELETE` | `/api/decks/{id}` | Delete deck (unlinks attached cards) | **Yes** |

#### Deck Response Format:
```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "userId": "c1f7b8e2-9d3a-4e2b-8a1f-0b2c3d4e5f6a",
  "name": "TOEIC Essential Vocabulary",
  "description": "High-frequency Part 5 & 6 words",
  "cardCount": 42,
  "createdAt": "2026-08-04T00:00:00Z",
  "updatedAt": "2026-08-04T00:00:00Z"
}
```

---

## 4. Exam Simulator Endpoints (`/api/exams`)

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/exams/templates` | List public & user custom templates | Optional |
| `POST` | `/api/exams/templates` | Create custom exam template | **Yes** |
| `GET` | `/api/exams/templates/{id}` | Get template metadata | Optional |
| `DELETE` | `/api/exams/templates/{id}` | Delete custom template | **Yes** |
| `GET` | `/api/exams/templates/{id}/questions` | List template questions | Optional |
| `POST` | `/api/exams/templates/{id}/questions` | Add question to template | **Yes** |
| `GET` | `/api/exams/sessions` | List user exam history (last 50) | **Yes** |
| `POST` | `/api/exams/sessions` | Start new exam session | **Yes** |
| `GET` | `/api/exams/sessions/{id}` | Fetch session status | **Yes** |
| `GET` | `/api/exams/sessions/{id}/details` | Fetch session, template, questions, answers, and session-signed `audioPlayUrl` / `imagePlayUrl` | **Yes** |
| `PUT` | `/api/exams/sessions/{id}/answer` | Record answer for a question | **Yes** |
| `PUT` | `/api/exams/sessions/{id}/finish` | Finalize session & calculate percentage score | **Yes** |

---

## 5. Exam-Type Feature Flags (`/api/exam-types`)

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/exam-types` | Enabled/disabled state for every flag-controlled exam type | No |

**Response** — `key` matches an `exam_templates.exam_type` / `questions.exam_type`
value; a type absent from this list is enabled by default:
```json
[
  { "key": "toeic", "enabled": true },
  { "key": "hsk", "enabled": false }
]
```

See [Exam-Type Feature Flags](../features/exam-type-feature-flags.md) for the enforcement model
(what disabling a type actually blocks) and the operator guide for toggling one.

---

## 6. Feature Flags (`/api/feature-flags`)

Product-wide kill switches. Same “missing row = enabled” rule as exam-type flags.
See [AI Service Layer](../features/ai-service-layer.md) for the `ai` flag.

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/feature-flags` | All product flags (`key`, `enabled`) | No |
| `PATCH` | `/api/feature-flags/{key}` | Toggle a known flag (`ai`) | **Root admin** |

---

## 7. AI Endpoints (`/api/ai`)

Registered **non-guest** users only. Guests get 403. Provider failures and the
`ai` kill switch return **503** (never 500). Full contracts, cache, and jobs:
[AI Service Layer](../features/ai-service-layer.md). Learner guide: [AI Features](../features/ai-features.md).

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/ai/explain-card` | Explain a card the caller owns | **Yes** (non-guest) |
| `POST` | `/api/ai/explain` | Explain a question on a **completed** session | **Yes** (non-guest) |
| `POST` | `/api/ai/generate-questions` | Enqueue generation (`202 { jobId }`) | **Yes** (non-guest) |
| `GET` | `/api/ai/jobs/{jobId}` | Poll a job the caller owns | **Yes** (non-guest) |
| `POST` | `/api/ai/hint` | Non-spoiling hint for an in-progress session | **Yes** (non-guest) |

---

## 8. Question Bank Endpoints (`/api/questions`)

Questions are a **shared bank**, not exam property. Attach/detach lives on
`/api/exams/templates/{id}/questions`. Listening fields: [TOEIC Listening Items](../features/toeic-listening.md).

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/questions` | List / filter the live bank | Optional |
| `POST` | `/api/questions` | Create a standalone question (`audioUrl`, `imageUrl` optional) | **Yes** |
| `POST` | `/api/questions/sets` | Create 2–30 stems sharing passage and optional `audioUrl` | **Yes** |
| `GET` | `/api/questions/{id}` | Fetch one bank question (no session play URLs) | Optional |
| `PUT` | `/api/questions/{id}` | Replace content; media/options freeze after a submitted answer (409) | **Yes** |
| `DELETE` | `/api/questions/{id}` | Soft-delete (`archived_at`) | **Yes** |
| `GET` | `/api/questions/tags` | Distinct tags for filters | Optional |
| `GET` | `/api/questions/parts` | Distinct parts for filters | Optional |

`audioUrl` / `imageUrl` accept an R2 key or an **https** URL. `http://` is **422**.
`POST /api/questions/sets` copies a top-level `audioUrl` onto every stem and
allows audio without passage/documents (listening Parts 3–4).

---

## 9. Real-Time & Media Endpoints

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/media/presign-upload` | Sign a PUT. Body `purpose`: `"card"` (default) or `"question"` | **Yes** |
| `POST` | `/api/media/confirm-upload` | Validate staging object; copy to `cards/…` or `questions/…` | **Yes** |
| `GET` | `/api/media/presign-download/{file_key}` | Sign a GET for a **final** owner key only | **Yes** |
| `DELETE` | `/api/media/{file_key}` | Delete staging or unattached final object (409 if a card **or** question still references it) | **Yes** |
| `GET` | `/api/health` | Health check endpoint (`{"status": "ok"}`) | No |

Question uploads must send `purpose: "question"` (audio + image types). Card
uploads stay image-only. Pipeline and CORS: [Card Image Uploads](../features/card-image-uploads.md).
