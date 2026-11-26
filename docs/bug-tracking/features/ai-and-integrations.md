---
id: ai-and-integrations
title: AI Assistance, Webhooks, GitHub & API Keys
sidebar_label: AI & Integrations
sidebar_position: 3
description: AI feedback cleanup and duplicate detection, Slack/Discord/generic webhooks, GitHub issue promotion, and project API keys.
---

# AI Assistance, Multi-Tracker Sync & Built-In MCP Server

Bug Tracking `v0.2.0` pairs zero-config AI triage and repo-aware multimodal investigation with multi-platform Git & external issue tracker syncing (including incoming two-way webhooks), outgoing notifications, scoped project API keys, and a built-in **Model Context Protocol (MCP)** server. Every external integration degrades gracefully when optional provider credentials are omitted.

---

## AI Triage, Cleanup & Duplicate Detection (`lib/ai-triage.ts`)

`POST /api/feedback/ai-triage` powers `AiTriagePanel` on `/feedback/[id]` and `/projects/[id]/feedback/new`:

### Provider Resolution & Graceful Fallback
1. Reads `AI_PROVIDER` (`openai`, `gemini`, or `heuristic`). If unset, selects `openai` when `OPENAI_API_KEY` is present, `gemini` when `GEMINI_API_KEY` is present, or `heuristic` otherwise.
2. External calls (`OPENAI_MODEL` defaulting to `gpt-4o-mini`, or `GEMINI_MODEL` defaulting to `gemini-2.5-flash`) enforce an 8-second timeout and request structured JSON output.
3. On missing credentials, network errors, timeouts, or invalid responses, `analyzeFeedbackText()` automatically falls back to `analyzeWithHeuristics()` and sets `fallbackUsed: true`.

### Structured Cleanup, `Urgent` Classification & Duplicate Linking
- Cleans and capitalizes the title (capped at 200 chars) and detaches any `---\nSubmitted via extension` block (`splitExtensionContext()`) before structuring the description, then reattaches the extension block verbatim.
- Classifies `suggestedType` (`bug`, `improvement`, `feature`, `question`) and `suggestedPriority` (`urgent`, `high`, `medium`, `low`) from keyword signals or LLM analysis.
- `findDuplicateCandidates()` scans up to 100 recent project tickets using weighted Jaccard token similarity (`0.65` title + `0.35` full-text + `0.15` substring bonus, threshold `0.25`) and surfaces up to 5 candidates with a 1-click **"Link dup"** button that creates a `duplicates` `FeedbackLink`.

---

## Repo-Aware Multimodal AI Investigate (`lib/ai-investigate.ts`)

`POST /api/feedback/[id]/investigate` (also exposed via the MCP `investigate_ticket` tool) performs deep engineering triage on a ticket:

### Context Gathering
1. **Ticket & Triage Context:** Pulls `ticketKey`, `title`, `description`, `type`, `status`, `priority`, `source`, `pageUrl`, `browserInfo`, linked tickets (with resolved directional labels), and up to 5 recent internal notes.
2. **Multimodal Visual Analysis:** When `screenshotDataUrl` (`data:image/...`) is attached, the image is sent directly to OpenAI (`image_url`) or Gemini (`inlineData`) alongside the structured JSON ticket context (15-second timeout).
3. **Live GitHub Repository Context (`fetchRepoContextForInvestigation()`):** When `GITHUB_TOKEN` is configured and the project uses GitHub (`gitPlatform === "github"` or a `github.com` `repoUrl`), the server fetches the repository's top-level directory/file listing (`/contents`, up to 40 entries) and a README excerpt (`/readme`, up to 800 chars, 4-second timeout) to ground hypotheses and coding-agent prompts in the actual codebase structure.

### Structured Output & Heuristic Fallback
`investigateTicket()` returns `{ rootCauseHypotheses, investigationChecklist, suggestedSolution, agentPrompt, provider, fallbackUsed }`:
- **`rootCauseHypotheses`:** Ranked `{ title, likelihood: "high" | "medium" | "low", explanation }` entries.
- **`investigationChecklist`:** Concrete reproduction and verification steps.
- **`suggestedSolution`:** Markdown-formatted fix plan.
- **`agentPrompt`:** A copyable, ready-to-paste Markdown prompt (`buildAgentFixPrompt()`) bundling ticket metadata, repo files, URLs, browser diagnostics, linked tickets, triage notes, and regression-testing instructions for coding agents.
- **Deterministic Offline Fallback:** When `AI_PROVIDER=heuristic`, no API keys are configured, or an upstream LLM call fails, `investigateWithHeuristics()` generates pattern-matched hypotheses (API/backend, UI layout/hydration, state/validation), a checklist, a suggested approach, and the full copyable `agentPrompt`.

---

## Multi-Platform Git & External Issue Trackers (`lib/git-platforms.ts` & `lib/trackers.ts`)

### Source Repository Platforms (`GitPlatform`)
Projects support `none`, `github`, `gitlab`, `bitbucket`, `azure_devops`, `gitea`, and `custom` alongside `repoUrl` and `gitDefaultBranch`. When `gitPlatform` is omitted on creation, `detectGitPlatform(repoUrl)` infers it automatically.

### External Issue Trackers (`TrackerPlatform`)
Projects can configure an external tracker (`github_issues`, `gitlab_issues`, `linear`, `jira`, or `bitbucket_issues`) with non-secret metadata in `Project.trackerConfig` (`owner`/`repo`, `gitlabBaseUrl`/`gitlabProjectId`, `linearTeamId`/`linearProjectId`, `jiraSiteUrl`/`jiraProjectKey`/`jiraIssueType`, or `bitbucketWorkspace`/`bitbucketRepoSlug`).

From `/feedback/[id]` or the Review Drawer, `/api/feedback/[id]/tracker` supports:
- **Promote via API (`POST`):** Creates an external issue using the configured server token (`GITHUB_TOKEN`, `GITLAB_TOKEN`, `LINEAR_API_KEY`, `JIRA_EMAIL` + `JIRA_API_TOKEN`, or `BITBUCKET_TOKEN`), persists an `ExternalIssueLink`, and keeps legacy `githubIssueUrl`/`githubIssueNumber` columns synchronized for GitHub.
- **Manual URL Link (`POST` with `mode: "manual"`):** Attaches any existing external issue URL (`externalKey`, `externalUrl`) without calling external APIs.
- **On-Demand Status Pull (`PATCH`):** Queries the external tracker API for the current issue state and updates `ExternalIssueLink.externalStatus` and `lastSyncedAt`.
- **Unlink (`DELETE ?linkId=...`):** Removes the `ExternalIssueLink` record.

:::note Legacy GitHub endpoint compatibility
`POST /api/feedback/[id]/github` remains available for backward compatibility with v0.1 integrations (`lib/github.ts`), rejecting duplicate promotions with HTTP `409`.
:::

### Two-Way Tracker Webhooks (`POST /api/webhooks/trackers/[provider]`)
Configure external trackers to send issue-update webhooks back into Bug Tracking:

| Provider Path | `TrackerPlatform` | Signature / Token Header (when `TRACKER_WEBHOOK_SECRET` is set) |
| --- | --- | --- |
| `/api/webhooks/trackers/github` (or `github_issues`) | `github_issues` | `x-hub-signature-256` (`sha256=<hmac>`) or `x-webhook-secret` |
| `/api/webhooks/trackers/gitlab` (or `gitlab_issues`) | `gitlab_issues` | `x-gitlab-token` or `x-webhook-secret` |
| `/api/webhooks/trackers/linear` | `linear` | `linear-signature` (hex HMAC-SHA256) or `x-webhook-secret` |
| `/api/webhooks/trackers/jira` | `jira` | `x-webhook-secret` |

When a matching `ExternalIssueLink` is found (by `externalId`, `externalKey`, or `externalUrl`), the handler updates `externalStatus` and `lastSyncedAt`, and whenever the status changes it appends an internal `FeedbackNote` authored by `webhook:<provider>` so triage history reflects external tracker updates without bypassing the strict local workflow.

---

## Built-In MCP Server (`/api/mcp` & `scripts/mcp-server.ts`)

Bug Tracking ships a native **Model Context Protocol (MCP)** server so AI coding assistants (Cursor, Claude Desktop, Antigravity, etc.) can inspect, triage, link, and investigate tickets directly.

### Transports & Discovery
- **Streamable HTTP (`POST /api/mcp`):** Implements JSON-RPC 2.0 (`protocolVersion: "2024-11-05"`) supporting `initialize`, `notifications/initialized` (`204`), `ping`, `tools/list`, and `tools/call`.
- **Discovery Metadata (`GET /api/mcp`):** Unauthenticated endpoint returning server name (`bug-tracking-mcp`), protocol description, auth instructions, and the list of exposed tool names/descriptions.
- **Local Stdio Bridge (`scripts/mcp-server.ts`):** Line-delimited stdio wrapper that forwards JSON-RPC messages to `${BUG_TRACKER_URL}/api/mcp` with `Authorization: Bearer ${BUG_TRACKER_API_KEY}`.

### Authentication & Scoping
- **Project API Key (`Authorization: Bearer btk_...` or `x-api-key: btk_...`):** Authenticates against active `ProjectApiKey` hashes, updates `lastUsedAt`, stamps actions as `mcp:<keyName>`, and **strictly scopes all queries and mutations to that key's project**.
- **Admin Session Cookie:** Grants workspace-wide access across all projects and attributes actions to the signed-in admin's email.

### Exposed MCP Tools (8 Tools)

| Tool | Required Args | Optional Args | Behavior |
| --- | --- | --- | --- |
| `list_projects` | *(none)* | *(none)* | Lists accessible projects (`id`, `name`, `slug`, `keyPrefix`, `domain`, `gitPlatform`, `repoUrl`, `trackerPlatform`) |
| `list_tickets` | *(none)* | `projectId`, `status`, `priority`, `type`, `q`, `limit` (default `25`, max `100`) | Lists tickets with filters and search across `ticketKey`, `title`, and `description` |
| `get_ticket` | `identifier` | *(none)* | Fetches full ticket by CUID or case-insensitive `ticketKey` (e.g., `WEB-12`), including up to 15 notes, resolved ticket links, and external links |
| `create_ticket` | `title`, `type` | `projectId` (required for admin session; auto-scoped for API keys), `description`, `priority` | Allocates the next `ticketKey` and creates an `open` ticket (`source: "api"`) |
| `update_ticket` | `identifier` | `status`, `priority` (nullable), `type`, `title`, `description` | Updates ticket fields with **strict 6-state workflow enforcement** and appends a `FeedbackStatusEvent` on status change |
| `add_ticket_note` | `identifier`, `body` | *(none)* | Appends an internal Markdown note attributed to the authenticated caller |
| `link_tickets` | `sourceIdentifier`, `targetIdentifier`, `direction` | *(none)* | Creates a canonical `FeedbackLink` (`blocks`, `is_blocked_by`, `causes`, `is_caused_by`, `duplicates`, `is_duplicated_by`, `relates_to`, `parent_of`, `subtask_of`) |
| `investigate_ticket` | `identifier` | *(none)* | Runs `investigateTicket()` and returns ranked root-cause hypotheses, checklist, suggested fix, and copyable `agentPrompt` |

### Example MCP Client Configuration (Stdio Bridge)

```json
{
  "mcpServers": {
    "bug-tracking": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp-server.ts"],
      "cwd": "/path/to/bug-tracking",
      "env": {
        "BUG_TRACKER_URL": "http://localhost:3000",
        "BUG_TRACKER_API_KEY": "btk_your_project_api_key"
      }
    }
  }
}
```

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

## Programmatic API Keys (`lib/api-keys.ts` & `POST /api/v1/feedback`)

Projects can issue scoped API keys on `/projects/[id]` (`components/project-api-keys-panel.tsx`):

- Keys are generated as `btk_` followed by 48 random hex characters (`crypto.randomBytes(24)`).
- Only the `keyPrefix` (`btk_` + 8 hex chars) and SHA-256 `keyHash` are stored in `ProjectApiKey`; the raw key is returned once upon creation (`POST /api/projects/[id]/api-keys`).
- Keys can be soft-revoked at any time (`DELETE /api/projects/[id]/api-keys?keyId=...`), immediately blocking future `POST /api/v1/feedback` and `POST /api/mcp` calls with HTTP `401`.
- Valid `POST /api/v1/feedback` requests allocate the next `ticketKey`, create a `FeedbackItem` with `source: "api"`, stamp `lastUsedAt`, and trigger project outgoing webhooks if configured.
