---
id: 0002-monorepo-binaries
title: "ADR 0002: Monorepo Organization & Executable Binaries"
sidebar_label: "0002: Monorepo Binaries"
sidebar_position: 3
description: "0002: Monorepo Binaries — Grocery Store POS & Tax Application."
---
# ADR 0002: Monorepo Organization & Executable Binaries

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** Backend Core Agent, Technical Orchestrator

---

## Context
The project specification specifies distinct operational commands:
- `make up` boots the server.
- `make migrate` runs schema migrations.
- `make seed` loads sample test fixtures.

We needed an architectural pattern that allows independent execution of these tasks without requiring three separate Docker containers or complex shell scripting indirection.

## Decision
We organize the Go backend as a monorepo with three separate entrypoint binaries located in `backend/cmd/`:
1. `backend/cmd/api/main.go` → compiled to `/app/api`
2. `backend/cmd/migrate/main.go` → compiled to `/app/migrate`
3. `backend/cmd/seed/main.go` → compiled to `/app/seed`

The Dockerfile builds all three binaries into the `/app` directory during the container image build stage.

## Consequences

### Positive
- `docker compose exec api ./migrate up` and `docker compose exec api ./seed` run instantaneously without restarting containers or compiling Go code at runtime.
- Code reuse: `migrate` and `seed` share the exact same `internal/models`, `internal/config`, and `internal/database` packages as the `api` binary.
- Clear separation of operational concerns.

### Negative / Tradeoffs
- Slight increase in final Docker image size due to three static Go binaries (negligible in Alpine Go containers, ~60 MB total).
