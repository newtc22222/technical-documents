---
id: ai-and-integrations
title: AI Assistance, Webhooks, GitHub & API Keys
sidebar_label: AI & Integrations
sidebar_position: 3
description: AI feedback cleanup and duplicate detection, Slack/Discord/generic webhooks, GitHub issue promotion, and project API keys.
---

# AI Assistance, Webhooks, GitHub & API Keys

Milestones 2–4 add optional AI assistance and external integrations designed to degrade gracefully when external API keys or tokens are not configured.

---

## AI Cleanup, Auto-Triage & Duplicate Detection (`lib/ai-triage.ts`)

`POST /api/feedback/ai-triage` powers `AiTriagePanel` on both `/feedback/[id]` and `/projects/[id]/feedback/new`:

### Provider Resolution & Graceful Fallback
1. Reads `AI_PROVIDER` (`openai`, `gemini`, or `heuristic`). If unset, selects `openai` when `OPENAI_API_KEY` is present, `gemini` when `GEMINI_API_KEY` is present, or `heuristic` otherwise.
2. External calls (`api.openai.com` with `OPENAI_MODEL` defaulting to `gpt-4o-mini`, or `generativelanguage.googleapis.com` with `GEMINI_MODEL` defaulting to `gemini-2.5-flash`) enforce an 8-second `AbortSignal.timeout(8000)` and request structured JSON output.
3. On missing credentials, network errors, timeouts, or invalid responses, `analyzeFeedbackText()` automatically falls back to `analyzeWithHeuristics()` and sets `fallbackUsed: true`.

### Deterministic Heuristic Engine & Extension Context Preservation
- Cleans and capitalizes the title (capped at 200 chars).
- Calls `splitExtensionContext()` to detach any `---\nSubmitted via extension` block before formatting the user text into `Summary:` / `Details:` sections, then reattaches the extension block verbatim.
- Classifies `suggestedType` (`bug`, `question`, `feature`, `improvement`) and `suggestedPriority` (`high`, `medium`, `low`) from keyword signals.

### Duplicate Detection (`findDuplicateCandidates`)
- Fetches up to 100 recent feedback items for `projectId`.
- Tokenizes titles and descriptions (lowercased alphanumeric tokens of at least 3 characters, excluding stop words) and computes a weighted Jaccard score (`0.65` title similarity + `0.35` full-text similarity + `0.15` substring containment bonus).
- Returns up to 5 candidates at or above the `0.25` similarity threshold, excluding `feedbackId`.

---

## Outgoing Webhooks (`lib/notifications.ts`)

When a project has `webhookUrl` configured (`http://` or `https://`), `POST /api/submit/[slug]` and `POST /api/v1/feedback` invoke `sendFeedbackNotification()` with a 5-second timeout:

| URL Pattern | Format | Payload Shape |
| --- | --- | --- |
| Contains `hooks.slack.com` | **Slack** | `{ text, blocks }` with mrkdwn section summary |
| Contains `discord.com/api/webhooks` or `discordapp.com/api/webhooks` | **Discord** | `{ content, embeds }` with Project, Type, Source, and Page URL fields |
| Any other HTTP(S) URL | **Generic JSON** | `{ event: "feedback.created", project, feedback }` |

Webhook errors are caught and returned as `{ sent: false, error }` so intake requests never fail if a downstream webhook is unreachable.

---

## One-Click GitHub Issue Promotion (`lib/github.ts`)

From `/feedback/[id]`, clicking **Promote to GitHub Issue** calls `POST /api/feedback/[id]/github`:

1. Parses `{ owner, repo }` via `extractGithubOwnerRepo(project.repoUrl)` (supports full GitHub URLs, `.git` suffixes, or `owner/repo` slugs).
2. Requires `GITHUB_TOKEN` on the server (`400` if absent) and rejects duplicate promotion with `409` if `githubIssueUrl` is already set.
3. Calls `POST https://api.github.com/repos/{owner}/{repo}/issues` with `buildGithubIssuePayload()` (description + metadata footer + type label).
4. Persists `githubIssueUrl` and `githubIssueNumber` on `FeedbackItem` and renders a `GitHub Issue #N` link badge in the UI.

---

## Programmatic API Keys (`lib/api-keys.ts` & `POST /api/v1/feedback`)

Projects can issue scoped API keys on `/projects/[id]` (`components/project-api-keys-panel.tsx`):

- Keys are generated as `btk_` followed by 48 random hex characters (`crypto.randomBytes(24)`).
- Only the `keyPrefix` (`btk_` + 8 hex chars) and SHA-256 `keyHash` are stored in `ProjectApiKey`; the raw key is returned once upon creation (`POST /api/projects/[id]/api-keys`).
- Keys can be soft-revoked at any time (`DELETE /api/projects/[id]/api-keys?keyId=...`), immediately blocking future `POST /api/v1/feedback` calls with HTTP `401`.
- Valid requests create `FeedbackItem` records with `source: "api"`, stamp `lastUsedAt`, and trigger project webhooks if configured.
