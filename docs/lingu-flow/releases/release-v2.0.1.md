---
id: release-v2.0.1
title: "LinguFlow 2.0.1"
sidebar_label: "v2.0.1"
sidebar_position: 3
description: "Release notes for LinguFlow v2.0.1: server-side section clocks, practice re-sit gates and the bank drill cap."
---

# LinguFlow 2.0.1

**Release version:** `v2.0.1`  
**Status:** Superseded by [v2.1.0](./release-v2.1.0.md)  
**GitHub Release:** [https://github.com/newtc22222/lingu-flow/releases/tag/v2.0.1](https://github.com/newtc22222/lingu-flow/releases/tag/v2.0.1)  
**Previous:** [v2.0.0](./release-v2.0.0.md) · [v1.4.0](./release-v1.4.0.md)

A patch release (#142) that hardens the assessment runtime, following findings from the v2.0.0 release review. No migrations, no new environment variables.

Version strings are `2.0.1` across package manifests, `GET /api/health`, OpenAPI documentation, and the arcade footer.

---

## Fixes

| Area | What changed |
|------|--------------|
| **Section clocks** | Exam answers are refused (409) before a section begins, and after its time limit plus the 30-second grace period. Until now only the client's countdown closed a section (#132, #139). |
| **Section lapse** | When a section lapses on the server, the booth closes just that section. It never submits the whole paper (#140). |
| **Drill re-sits** | A re-sit now returns 404 if the source exam has since been made private, and 403 if its exam type is disabled. Questions archived or hidden since then drop out (#133, #139). |
| **Misses drills** | A "drill my misses" practice from a shared exam can be re-sat again (#140). |
| **Bank drills** | `POST /api/practice/from-bank` caps `count` at 200 (#135, #139). |
| **Docs** | The README is now an onboarding quick guide: its features and migration table match the code, and it no longer carries release notes (#138, #143). |

---

## Deploy

No migrations. Deploy as usual and confirm `GET /api/health` reports `version: 2.0.1`.

---

## Verification

| Gate | Result |
| --- | --- |
| `pytest` (SQLite, skip postgres) | 662 passed, 3 skipped |
| `npm test` | 588 passed |
| `vue-tsc -b` | clean |
| CI on the release head (`3889a5e`) | SQLite suite, Postgres integrity suite, Vitest, Vercel all green |

---

## Known issues

- Immediate feedback reveals the key but still accepts a changed answer (#134).
- Practice hints (#11) are in progress.
