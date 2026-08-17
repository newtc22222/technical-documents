---
id: kickoff-prompt-a7-docs-skills
title: "Kickoff Prompt — A7 Docs & Agent Skills (A7 / #50)"
sidebar_label: Kickoff — A7 Docs & Skills
sidebar_position: 14
description: Paste-ready kickoff prompt for the Horizon A7 docs, agent skills, and deployment topology cleanup.
---

# Kickoff Prompt — Horizon A docs & agent skills (A7 / #50)

> **How to use:** Copy everything below the horizontal rule into a **fresh** agent session as the first message.

---

Implement **Horizon A package A7** for LinguFlow: make agent docs and skills match repository reality so future sessions do not skip tests, invent a Mongo API, or target a dead Express deploy path.

**Issue:** [#50](https://github.com/newtc22222/lingu-flow/issues/50)  
**Artifact findings:** F-10, F-11  
**Plan:** [05 — Reliability, Deployment & Operations](./05-reliability-and-ops.md) · [09 — Implementation Backlog](./09-implementation-backlog.md)

**Prerequisite:** Horizon A security stack (#44–#46) is done or in review. Do **not** re-implement JWT/exam visibility/SSE in this issue.

---

## Mission

Agents (and humans) reading the repo first should learn:

1. **Primary production** is Vercel (frontend) + Railway (API + Postgres) + Cloudflare R2 — not Express-on-Vercel.
2. **Local full stack** is `docker compose` (secondary / dev).
3. Backend has a **real pytest suite**; frontend gates are `vue-tsc` + ESLint + stylelint + Prettier.
4. Phase 1.5/1.6 largely aligned FE/BE contracts.
5. Exam authz / answer-key rules documented in `CLAUDE.md` stay accurate.

---

## Scope

### In scope (docs / skills / env examples only)

| File / area | Work |
|-------------|------|
| `CLAUDE.md` | Remove or mark resolved obsolete Express / `api/index.ts` / broken Vercel path warnings; declare **primary vs local** deploy; keep security/authz notes if already present; accurate test commands and rough test counts |
| `.claude/skills/project-conventions/SKILL.md` | Delete “no test suite / no lint” claim; describe pytest + frontend lint gates; soften mid-migration “frontend is Mongo API spec” language |
| Root `.env.example` | Point to `backend/.env.example` |
| `DEPLOYMENT.md` | Only touch if it contradicts primary topology; prefer align CLAUDE to DEPLOYMENT if DEPLOYMENT is already correct |

### Out of scope

- Application code changes (backend/frontend logic)
- F-04 transactions, F-06 seed entrypoint, F-08 Postgres harness
- Horizon B performance work
- Creating new product features

---

## Definition of done

- [ ] A new agent reading only `CLAUDE.md` + project-conventions would **not** skip pytest/lint because docs said they are missing
- [ ] Primary (Vercel+Railway+R2) vs local (compose) is unambiguous
- [ ] No remaining “implement Express on Vercel via `api/index.ts`” as current guidance
- [ ] Root env example is not Mongo-era
- [ ] `gh issue close 50` is justified
