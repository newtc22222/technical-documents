---
id: api-documentation
title: API Documentation
sidebar_label: API Documentation
sidebar_position: 4
description: Interactive RESTful OpenAPI endpoint documentation for LinguFlow.
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
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register new account with email & password | No |
| `POST` | `/api/auth/login` | Authenticate user with credentials | No |
| `POST` | `/api/auth/guest` | Instant guest login (returns temporary guest token) | No |
| `POST` | `/api/auth/google` | Authenticate via Google OAuth2 ID token | No |
| `POST` | `/api/auth/forgot-password` | Request password reset verification link | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | **Yes** |

### Request & Response Schemas

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
| --- | --- | --- | --- |
| `GET` | `/api/cards/study` | Fetch cards due for review (`srs_next_review <= now()`) | **Yes** |
| `POST` | `/api/cards/review/{id}` | Process review score (1-4) via SM-2 algorithm | **Yes** |
| `GET` | `/api/cards` | List all flashcards owned by user | **Yes** |
| `POST` | `/api/cards` | Create a new flashcard | **Yes** |
| `PUT` | `/api/cards/{id}` | Update flashcard prompt or definition | **Yes** |
| `DELETE` | `/api/cards/{id}` | Delete flashcard | **Yes** |

### Card Response Format (CamelCase `srsData` Contract)

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
| --- | --- | --- | --- |
| `GET` | `/api/decks` | List all decks owned by user with aggregated `cardCount` | **Yes** |
| `POST` | `/api/decks` | Create a new study deck | **Yes** |
| `PUT` | `/api/decks/{id}` | Update deck name and description | **Yes** |
| `DELETE` | `/api/decks/{id}` | Delete deck (unlinks attached cards) | **Yes** |

### Deck Response Format

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

## 4. Exams, Attempts & Practice (`/api/exams`, `/api/attempts`, `/api/practice`)

Assessment v2 surface. Full invariants:
[Question & Exam Design](./question-and-exam-design.md). Practice drills:
[Practice Mode](../features/practice-mode.md).

| Method | Endpoint | Description | Protected |
| --- | --- | --- | --- |
| `GET` | `/api/exams` | List visible exams (disabled types omitted) | Optional |
| `POST` | `/api/exams` | Create draft exam | **Yes** |
| `GET` | `/api/exams/{id}` | Exam detail | Optional / ownership |
| `GET` `PUT` | `/api/exams/{id}/draft` | Working structure | **Yes** (edit) |
| `POST` | `/api/exams/{id}/publish` | Freeze an `ExamVersion` | **Yes** |
| `GET` `PUT` | `/api/exams/{id}/sharing` | Sharing state | **Yes** |
| `POST` | `/api/attempts` | Start exam attempt (**403** if type disabled) | **Yes** |
| `GET` | `/api/attempts` | Caller’s attempts | **Yes** |
| `GET` | `/api/attempts/{id}` | Attempt paper / status | **Yes** |
| `PUT` | `/api/attempts/{id}/responses` | Save answers | **Yes** |
| `POST` | `/api/attempts/{id}/pause` · `/resume` | Pause clock | **Yes** |
| `POST` | `/api/attempts/{id}/finish` | Score & complete | **Yes** |
| `GET` | `/api/attempts/{id}/results` | Multi-scale scores + review | **Yes** |
| `POST` | `/api/practice/from-exam` | Practice draw from an exam | **Yes** (non-guest) |
| `POST` | `/api/practice/from-bank` | Practice draw from bank filters | **Yes** (non-guest) |
| `POST` | `/api/practice/drills/{id}/resit` | Resit a practice drill | **Yes** (non-guest) |
| `PUT` | `/api/practice/notes` | Upsert per-question note | **Yes** |

---

## 5. Exam-Type Feature Flags (`/api/exam-types`)

| Method | Endpoint | Description | Protected |
| --- | --- | --- | --- |
| `GET` | `/api/exam-types` | Enabled/disabled state for every flag-controlled exam type | No |

**Response** — `key` matches an `exams.exam_type` value; a type absent from this
list is enabled by default:

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
| --- | --- | --- | --- |
| `GET` | `/api/feature-flags` | All product flags (`key`, `enabled`) | No |
| `PATCH` | `/api/feature-flags/{key}` | Toggle a known flag (`ai`) | **Root admin** |

---

## 7. AI Endpoints (`/api/ai`)

Registered **non-guest** users only. Guests get 403. Provider failures and the
`ai` kill switch return **503** (never 500). Full contracts, cache, and jobs:
[AI Service Layer](../features/ai-service-layer.md). Learner guide: [AI Features](../features/ai-features.md).

| Method | Endpoint | Description | Protected |
| --- | --- | --- | --- |
| `POST` | `/api/ai/explain-card` | Explain a card the caller owns | **Yes** (non-guest) |
| `POST` | `/api/attempts/{id}/items/{position}/explain` | Explain a pinned attempt item (completed, or practice) | **Yes** (non-guest) |
| `POST` | `/api/ai/generate-questions` | Enqueue generation (`202 { jobId }`) | **Yes** (non-guest) |
| `GET` | `/api/ai/jobs/{jobId}` | Poll a job the caller owns | **Yes** (non-guest) |

---

## 8. Question Bank Endpoints (`/api/questions`, `/api/stimuli`)

Questions are a **shared bank**, not exam property. Exam placement is
`exam_slots` on a published `exam_version`. Media lives in DSL **blocks** on
stimulus/question versions — see [TOEIC Listening Items](../features/toeic-listening.md) and
[Question & Exam Design](./question-and-exam-design.md).

| Method | Endpoint | Description | Protected |
| --- | --- | --- | --- |
| `GET` | `/api/questions` | List / filter the live bank | Optional |
| `POST` | `/api/questions` | Create a question (draft) | **Yes** |
| `GET` | `/api/questions/facets` | Filter vocabularies | Optional |
| `GET` | `/api/questions/{id}` | Fetch one bank question | Optional / ACL |
| `PUT` | `/api/questions/{id}` | Update draft / editable fields | **Yes** |
| `POST` | `/api/questions/{id}/publish` | Publish current version | **Yes** |
| `DELETE` | `/api/questions/{id}` | Soft-delete (`archived_at`) | **Yes** |
| `GET` | `/api/questions/{id}/preview` | Preview payload | Optional / ACL |
| `GET` `PUT` | `/api/questions/{id}/sharing` | Sharing state | **Yes** |
| `GET` `PUT` `DELETE` | `/api/stimuli/{id}` | Shared stimulus CRUD | ACL |
| `GET` | `/api/stimuli/{id}/questions` | Stems linked to a stimulus | ACL |

---

## 9. Real-Time & Media Endpoints

| Method | Endpoint | Description | Protected |
| --- | --- | --- | --- |
| `POST` | `/api/media/presign-upload` | Sign a PUT. Body `purpose`: `"card"` (default) or `"question"` | **Yes** |
| `POST` | `/api/media/confirm-upload` | Validate staging object; copy to `cards/…` or `questions/…` | **Yes** |
| `GET` | `/api/media/presign-download/{file_key}` | Sign a GET for a **final** owner key only | **Yes** |
| `DELETE` | `/api/media/{file_key}` | Delete staging or unattached final object (409 if a card **or** question still references it) | **Yes** |
| `GET` | `/api/health` | Health check endpoint (`{"status": "ok"}`) | No |

Question uploads must send `purpose: "question"` (audio + image types). Card
uploads stay image-only. Pipeline and CORS: [Card Image Uploads](../features/card-image-uploads.md).
