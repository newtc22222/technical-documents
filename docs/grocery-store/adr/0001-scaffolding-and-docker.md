---
id: 0001-scaffolding-and-docker
title: "ADR 0001: Scaffolding and Docker Architecture"
sidebar_label: "0001: Scaffolding & Docker"
sidebar_position: 2
description: "0001: Scaffolding & Docker — Grocery Store POS & Tax Application."
---
# ADR 0001: Scaffolding and Docker Architecture

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** DevOps Agent, Technical Orchestrator

---

## Context
The application needs to boot from a clean Git clone on a local workstation (WSL2 Ubuntu or native Linux) with a single command (`make up && make migrate && make seed`) within under 3 minutes, without requiring pre-installed system compilers, databases, or local Node/Go toolchains.

## Decision
We utilize a multi-container **Docker Compose** architecture using lightweight, official Alpine Linux base images:
- `golang:1.23-alpine` for the backend API container.
- `node:22-alpine` for the frontend Angular web container.
- `postgres:16-alpine` for relational data storage.
- `redis:7.4.11` for cache and session storage.
- `bitnamilegacy/minio:2025.7.23` for S3 object storage.

The backend container contains both the runtime and Go toolchain so that `make test` (`docker compose exec api go test ./...`) executes natively inside the isolated container environment.

## Consequences

### Positive
- Zero local dependencies on host machine beyond Docker Engine and Make.
- Consistent runtime environments across all developer and demo machines.
- Instant healthcheck-driven startup sequencing preventing race conditions during database migration.

### Negative / Tradeoffs
- First-time Docker image pulling requires internet bandwidth.
- Slight file I/O performance penalty if developers clone into the Windows filesystem (`/mnt/c/`) instead of native WSL2 ext4 storage.
