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

| Method | Endpoint                    | Description                                         | Protected |
| ------ | --------------------------- | --------------------------------------------------- | --------- |
| `POST` | `/api/auth/register`        | Register new account with email & password          | No        |
| `POST` | `/api/auth/login`           | Authenticate user with credentials                  | No        |
| `POST` | `/api/auth/guest`           | Instant guest login (returns temporary guest token) | No        |
| `POST` | `/api/auth/google`          | Authenticate via Google OAuth2 ID token             | No        |
| `POST` | `/api/auth/forgot-password` | Request password reset verification link            | No        |
| `GET`  | `/api/auth/me`              | Fetch authenticated user profile                    | **Yes**   |

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
    "isGuest": false,
    "role": "client",
    "permissions": []
  }
}
```

---

## 2. Flashcard & SM-2 Endpoints (`/api/cards`)

| Method   | Endpoint                 | Description                                             | Protected |
| -------- | ------------------------ | ------------------------------------------------------- | --------- |
| `GET`    | `/api/cards/study`       | Fetch cards due for review (`srs_next_review <= now()`) | **Yes**   |
| `POST`   | `/api/cards/review/{id}` | Process review score (1-4) via SM-2 algorithm           | **Yes**   |
| `GET`    | `/api/cards`             | List all flashcards owned by user                       | **Yes**   |
| `POST`   | `/api/cards`             | Create a new flashcard                                  | **Yes**   |
| `PUT`    | `/api/cards/{id}`        | Update flashcard prompt or definition                   | **Yes**   |
| `DELETE` | `/api/cards/{id}`        | Delete flashcard                                        | **Yes**   |

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

| Method   | Endpoint          | Description                                              | Protected |
| -------- | ----------------- | -------------------------------------------------------- | --------- |
| `GET`    | `/api/decks`      | List all decks owned by user with aggregated `cardCount` | **Yes**   |
| `POST`   | `/api/decks`      | Create a new study deck                                  | **Yes**   |
| `PUT`    | `/api/decks/{id}` | Update deck name and description                         | **Yes**   |
| `DELETE` | `/api/decks/{id}` | Delete deck (unlinks attached cards)                     | **Yes**   |
| `GET`    | `/api/decks/progress`            | Per-deck status counts for every deck the caller can read | **Yes** |
| `GET`    | `/api/decks/{id}/progress`       | Status counts for one deck                                | **Yes** |
| `GET`    | `/api/decks/{id}/cards/page`     | One window of a deck's cards (see below)                  | **Yes** |
| `GET` `PUT` `DELETE` | `/api/decks/{id}/share-link` | Read, turn on / rotate, or turn off the deck's share link | **Yes** (owner) |
| `GET`    | `/api/shared/{token}`            | Preview a deck from its share link                        | **Yes**   |
| `POST`   | `/api/shared/{token}/copy`       | Copy the linked deck into the caller's library            | **Yes**   |

### Paged cards and progress

Big decks (1,000+ cards) paint counts first and stream rows in windows.

- `GET /api/decks/{id}/cards/page?offset=0&limit=100&q=&status=`: `limit` is 1–200 (default 100), `q` is a search string (max 200 chars), `status` is one of the card statuses (**422** otherwise). Returns `{ items, total, offset, limit, hasMore }`; `total` counts every match so a client can size its scrollbar. **404** when the deck is missing or unreadable.
- `GET /api/decks/progress` and `/{id}/progress` return `{ deckId, total, new, learning, mastered, due }` per caller. `due` counts started cards whose review date has passed; unstarted cards count under `new`.

### Share links

One capability link per deck, managed by the owner. See [Deck Sharing](../features/deck-sharing.md).

- `GET /api/decks/{id}/share-link` returns `{ enabled, token?, createdAt? }`. Only the owner may read it, since the token is the credential.
- `PUT` turns the link on; body `{ "rotate": true }` replaces the token so the old URL stops working. `DELETE` turns it off (**204**).
- `GET /api/shared/{token}` returns `{ deckName, description, cardCount, ownerName, cards[{front, back}] }` (the first cards only). `POST /api/shared/{token}/copy` returns the new `DeckResponse` (**201**). Both are **404** when the link is off or unknown. Token path length is 8–64.

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

| Method      | Endpoint                               | Description                                   | Protected            |
| ----------- | -------------------------------------- | --------------------------------------------- | -------------------- |
| `GET`       | `/api/exams`                           | List visible exams (disabled types omitted)   | Optional             |
| `POST`      | `/api/exams`                           | Create draft exam                             | **Yes**              |
| `GET`       | `/api/exams/{id}`                      | Exam detail                                   | Optional / ownership |
| `GET` `PUT` | `/api/exams/{id}/draft`                | Working structure                             | **Yes** (edit)       |
| `POST`      | `/api/exams/{id}/publish`              | Freeze an `ExamVersion`                       | **Yes**              |
| `GET` `PUT` | `/api/exams/{id}/sharing`              | Sharing state                                 | **Yes**              |
| `POST`      | `/api/attempts`                        | Start exam attempt (**403** if type disabled) | **Yes**              |
| `GET`       | `/api/attempts`                        | Caller’s attempts                             | **Yes**              |
| `GET`       | `/api/attempts/{id}`                   | Attempt paper / status                        | **Yes**              |
| `PUT`       | `/api/attempts/{id}/responses`         | Save answers                                  | **Yes**              |
| `POST`      | `/api/attempts/{id}/pause` · `/resume` | Pause clock                                   | **Yes**              |
| `POST`      | `/api/attempts/{id}/finish`            | Score & complete                              | **Yes**              |
| `GET`       | `/api/attempts/{id}/results`           | Multi-scale scores + review                   | **Yes**              |
| `POST`      | `/api/practice/from-exam`              | Practice draw from an exam                    | **Yes** (non-guest)  |
| `POST`      | `/api/practice/from-bank`              | Practice draw from bank filters               | **Yes** (non-guest)  |
| `POST`      | `/api/practice/drills/{id}/resit`      | Resit a practice drill                        | **Yes** (non-guest)  |
| `PUT`       | `/api/practice/notes`                  | Upsert per-question note                      | **Yes**              |

---

## 5. Exam-Type Feature Flags (`/api/exam-types`)

| Method | Endpoint          | Description                                                | Protected |
| ------ | ----------------- | ---------------------------------------------------------- | --------- |
| `GET`  | `/api/exam-types` | Enabled/disabled state for every flag-controlled exam type | No        |
| `PATCH` | `/api/exam-types/{type}` | Body `{ enabled }`. Returns the row. **404** for an unknown or ungated type | **Root admin** |

**Response** — `key` matches an `exams.exam_type` value; a type absent from this
list is enabled by default. `updatedAt` is when the row last changed (an ISO
timestamp in UTC), or `null` for a type with no stored row. The list is publicly
cacheable for 30 s, so read a toggle's result from the `PATCH` response rather
than a refetch:

```json
[
  { "key": "toeic", "enabled": true, "updatedAt": "2026-11-01T07:43:18+00:00" },
  { "key": "hsk", "enabled": false, "updatedAt": "2026-11-19T07:43:18+00:00" }
]
```

See [Exam-Type Feature Flags](../features/exam-type-feature-flags.md) for the enforcement model
(what disabling a type actually blocks) and the operator guide for toggling one.

---

## 6. Feature Flags (`/api/feature-flags`)

Product-wide kill switches. Same “missing row = enabled” rule as exam-type flags.
See [AI Service Layer](../features/ai-service-layer.md) for the `ai` flag.

| Method  | Endpoint                   | Description                          | Protected      |
| ------- | -------------------------- | ------------------------------------ | -------------- |
| `GET`   | `/api/feature-flags`       | All product flags (`key`, `enabled`, `updatedAt`) | No             |
| `PATCH` | `/api/feature-flags/{key}` | Toggle a known flag (`ai`). Returns `{ key, enabled, updatedAt }` | **Root admin** |

`updatedAt` is `null` for a flag that has never been switched (it has no row).

---

## 7. AI Endpoints (`/api/ai`)

Explain and hint: registered **non-guest** users. Question generate also needs
permission `ai.generate_question` (Operator, or root admin). Guests get 403.
Provider failures and the `ai` kill switch return **503** (never 500).
[Roles and Permissions](../features/roles-and-permissions.md). Learner guide:
[AI Features](../features/ai-features.md).

| Method | Endpoint                                      | Description                                            | Protected                         |
| ------ | --------------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| `POST` | `/api/ai/explain-card`                        | Explain a card the caller owns                         | **Yes** (non-guest)               |
| `POST` | `/api/attempts/{id}/items/{position}/explain` | Explain a pinned attempt item (completed, or practice) | **Yes** (non-guest)               |
| `POST` | `/api/attempts/{id}/items/{position}/hint`    | Non-spoiling nudge on one **open practice** item (never an exam sitting). A reply that gives the answer away is retried once, then refused with **503** `hint_leaked`; **409** when the item cannot take a hint. Not cached; rate-limited per user | **Yes** (non-guest)               |
| `POST` | `/api/generate`                               | Generate question drafts (synchronous)                 | **Yes** + `ai.generate_question`  |
| `POST` | `/api/questions/{id}/regenerate`              | New AI version of a question the caller can edit      | **Yes** + `ai.generate_question`  |

`POST /api/ai/generate-questions` and `GET /api/ai/jobs/{jobId}` were removed
with `ai_generation_jobs` in `0018`.

---

## 8. Question Bank Endpoints (`/api/questions`, `/api/stimuli`)

Questions are a **shared bank**, not exam property. Exam placement is
`exam_slots` on a published `exam_version`. Media lives in DSL **blocks** on
stimulus/question versions — see [TOEIC Listening Items](../features/toeic-listening.md) and
[Question & Exam Design](./question-and-exam-design.md).

| Method               | Endpoint                      | Description                    | Protected      |
| -------------------- | ----------------------------- | ------------------------------ | -------------- |
| `GET`                | `/api/questions`              | List / filter the live bank    | Optional       |
| `POST`               | `/api/questions`              | Create a question (draft)      | **Yes**        |
| `GET`                | `/api/questions/facets`       | Filter vocabularies            | Optional       |
| `GET`                | `/api/questions/{id}`         | Fetch one bank question        | Optional / ACL |
| `PUT`                | `/api/questions/{id}`         | Update draft / editable fields | **Yes**        |
| `POST`               | `/api/questions/{id}/publish` | Publish current version        | **Yes**        |
| `DELETE`             | `/api/questions/{id}`         | Soft-delete (`archived_at`)    | **Yes**        |
| `GET`                | `/api/questions/{id}/preview` | Preview payload                | Optional / ACL |
| `GET` `PUT`          | `/api/questions/{id}/sharing` | Sharing state                  | **Yes**        |
| `GET` `PUT` `DELETE` | `/api/stimuli/{id}`           | Shared stimulus CRUD           | ACL            |
| `GET`                | `/api/stimuli/{id}/questions` | Stems linked to a stimulus     | ACL            |

---

## 9. Real-Time & Media Endpoints

| Method   | Endpoint                                 | Description                                                                                   | Protected |
| -------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- | --------- |
| `POST`   | `/api/media/presign-upload`              | Sign a PUT. Body `purpose`: `"card"` (default) or `"question"`                                | **Yes**   |
| `POST`   | `/api/media/confirm-upload`              | Validate staging object; copy to `cards/…` or `questions/…`                                   | **Yes**   |
| `GET`    | `/api/media/presign-download/{file_key}` | Sign a GET for a **final** owner key only                                                     | **Yes**   |
| `DELETE` | `/api/media/{file_key}`                  | Delete staging or unattached final object (409 if a card **or** question still references it) | **Yes**   |
| `GET`    | `/api/health`                            | Health check endpoint (`{"status": "ok"}`)                                                    | No        |

Question uploads must send `purpose: "question"` (audio + image types). Card
uploads stay image-only. Pipeline and CORS: [Card Image Uploads](../features/card-image-uploads.md).

Live notifications (`GET /api/notifications/stream`, server-sent events) are in section 11 below.

---

## 10. Settings Endpoints (`/api/settings`)

All require a signed-in user. Bodies and responses are camelCase.

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET`  | `/api/settings` | The caller's settings, with defaults filled in. Never 500s on stale stored values: invalid fields are dropped on read |
| `PUT`  | `/api/settings` | Partial update. Send only the fields that changed |
| `GET`  | `/api/settings/limits` | Question-generate limits (`GENERATE_MAX_SINGLE`, `GENERATE_MAX_SET`, …) so the UI clamps to exactly what the server enforces |

Settings fields: `locale`, `theme`, `crtEnabled`, `dailyXpGoal`, `audioSfxEnabled`, `speechLang`, `notificationsEnabled`, `reminderHour`, `timeZone`, `themeOverrides`.

| Field | Rules |
| ----- | ----- |
| `theme` | `arcade-light` (default), `arcade-dark`, `simple-light`, `simple-dark`. The legacy ids `light`, `dark`, `simple` are accepted and mapped. `exam` is rejected (**422**) |
| `reminderHour` | Integer 0–23, default `19`. `true`/`false` are rejected, not stored as 1/0 |
| `timeZone` | A real IANA name (default `UTC`); anything else is **422** on write |
| `notificationsEnabled` | Boolean, default `false` |
| `themeOverrides` | Replaces the stored overrides **as a whole**: omit to leave them alone, send `{}` to clear. Unknown keys are **422**. Field list and ranges: [Themes & Appearance](../features/themes-and-appearance.md) |

---

## 11. Notifications & Push Endpoints (`/api/notifications`, `/api/push`)

Behaviour, delivery and reminders: [Notifications & Reminders](../features/notifications-and-reminders.md).

| Method   | Endpoint                          | Description | Protected |
| -------- | --------------------------------- | ----------- | --------- |
| `GET`    | `/api/notifications`              | Newest first. Query `before` (a `seq` cursor) and `limit` (1–50, default 20). Returns `{ items: [...] }` | **Yes** (guests included) |
| `GET`    | `/api/notifications/unread-count` | `{ count }` | **Yes** |
| `POST`   | `/api/notifications/read`         | Body `{ ids: [uuid] }`. Returns `{ updated }` | **Yes** |
| `POST`   | `/api/notifications/read-all`     | Returns `{ updated }` | **Yes** |
| `GET`    | `/api/notifications/stream`       | Server-sent events. **Header** auth only (never a query-string token). `Last-Event-ID` resumes. **429** with `Retry-After: 30` beyond 5 open streams per user | **Yes** |
| `GET`    | `/api/push/vapid-public-key`      | `{ publicKey }`; **404** when push is not configured | No |
| `POST`   | `/api/push/subscriptions`         | Body `{ endpoint, p256dh, auth, userAgent? }`. Upserts on `endpoint`. Returns `{ id, endpoint }` | **Yes** (non-guest) |
| `DELETE` | `/api/push/subscriptions`         | Body `{ endpoint }`. **204**; **404** if missing *or owned by someone else* | **Yes** (non-guest) |
| `POST`   | `/api/admin/announcements`        | Body `{ title (≤120), body (≤4000) }`, plain text. Inserts one `system.announcement` row per active registered user. **201** `{ created }` | Admin only |

A notification is `{ id, seq, type, payload, createdAt, readAt }`. `seq` is a monotonically increasing cursor, used for paging and for SSE event ids. `type` is `srs.due`, `content.shared` or `system.announcement`; there is no public route to create a notification.
