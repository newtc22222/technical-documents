---
id: roles-and-permissions
title: "Roles and Permissions"
sidebar_label: "Roles and Permissions"
sidebar_position: 8
description: "Client, Operator and root admin: permission keys, the admin users API, and how the UI gates AI question generation."
---

# Roles and Permissions

Stage 1 access control for product features. A registered user has **one role**. A role has **many permissions**. This is not deck/card sharing (`services/access.py`) and not the exam-type or `ai` feature flags.

Ships on branch `feature/rbac` (migration `0024_rbac`).

---

## Who is who

| Principal | Where it lives | What they can do in stage 1 |
| --- | --- | --- |
| **Root admin** | Env `ROOT_ADMIN_EMAILS` (comma-separated, case-insensitive). Not a database role. | `/api/admin/*`, including assigning roles. Bypasses every permission check. |
| **Operator** | Role key `operator` | Everything a client can do, plus AI **question** generate and regenerate. |
| **Client** | Role key `client`. Default for every new email/password and Google signup. | The rest of the app, including AI explain, hints, and listening/TTS. **Cannot** generate or regenerate questions. |
| **Guest** | `users.role_id` is null. `is_guest` stays true. | No role. Cannot be promoted from the admin role picker. AI routes that require a registered user still 403. |

Existing non-guest users are backfilled to **Client** by `0024_rbac`.

Root admin bypass is server-side. `/api/auth/me` still lists every seeded permission key for those emails so the UI `can()` helper does not need a special case. Changing a root admin's database role does **not** remove `/api/admin/*` — that stays the env allowlist.

---

## Permission

| Key | Granted to | Routes |
| --- | --- | --- |
| `ai.generate_question` | `operator` (and root admin, by bypass) | `POST /api/generate`, `POST /api/questions/{id}/regenerate` |

Missing permission → **403** `Missing permission: ai.generate_question`. The denial is checked **before** the generate rate-limit window, so a client does not spend budget.

Not gated by this permission:

- Listening script and TTS (`assessment_listening`) — clients keep them
- Explain and hint
- The global `ai` feature flag (still **503** for everyone, including root admin and operator, when off)

Check order on question generate: authenticate → permission → `ai` flag → hourly rate limit → in-flight cap.

---

## API

`GET /api/auth/me` and login/register payloads add:

```json
{
  "role": "client",
  "permissions": []
}
```

`role` is the role key, or `null` for a guest. `permissions` is the list of keys. An operator's list is `["ai.generate_question"]`.

Admin (root admin only, same router as user deactivate):

| Method | Path | Body / result |
| --- | --- | --- |
| `GET` | `/api/admin/roles` | `[{ "key", "name", "description" }]` |
| `GET` | `/api/admin/users` | Query `q`, `isGuest`, `page`, `pageSize` (≤100). `{ items, total, page, pageSize }`. Never includes the acting admin, in the items or the total. |
| `PATCH` | `/api/admin/users/{id}` | Optional `isActive` and/or `role` (role key). Guest + `role` → 400. Unknown key → 422. Deactivating yourself → 400; changing another allowlisted admin → 403. |

The admin Users panel lists **accounts** and **guests** as two groups, each with its count, behind one search. Accounts have a role dropdown; guests show when they joined. The panel also drops the signed-in admin's own row itself, so an older API that still returns it changes nothing on screen. The question-bank AI tab is hidden when `permissions` does not include `ai.generate_question`. The API remains the source of truth.

---

## Data model

Migration `0024_rbac`:

| Table | Notes |
| --- | --- |
| `roles` | `key` unique (`client`, `operator`), `name`, `description` |
| `permissions` | `key` unique |
| `role_permissions` | `(role_id, permission_id)` |
| `users.role_id` | FK → `roles.id` ON DELETE SET NULL, nullable, indexed |

Seed is also idempotent in `rbac_service.ensure_seeded` so a SQLite `create_all` boot (no Alembic upgrade) still gets the two roles. Postgres staging/prod must run `alembic upgrade head`.

Code: `backend/app/models/rbac.py`, `backend/app/services/rbac_service.py`, `require_permission` in `backend/app/core/dependencies.py`.

---

## Later (not in this stage)

Per-role **quotas** for AI hint counts and AI question-generate counts. Generate-audio / listening TTS stays outside those quotas. New permissions are new rows plus `require_permission(...)` — not a schema redesign. One role per user; no per-user permission overrides.
