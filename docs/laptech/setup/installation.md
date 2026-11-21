---
id: installation
title: Prerequisites & Installation
sidebar_label: Installation
sidebar_position: 1
description: System requirements and quick-start instructions for the Laptech Store repositories.
---

# Prerequisites & Installation

:::tip Full Local Stack Guide
For the exact Docker Compose ports, required `.env` variables, `dev/` helper scripts, seeding, and troubleshooting, see **[Local setup](./local-setup.md)**.
:::

## System Requirements

| Component | Requirement | Notes |
| --- | --- | --- |
| **Backend (`laptech-api`)** | **JDK 21** (Temurin `21.0.8-tem`) | Built with the bundled Maven Wrapper (`./mvnw`, Maven 3.9.11). |
| **Frontends (`laptech-client-web-ui`, `laptech-admin-web-ui`)** | **Node.js 24** + npm | Both apps use npm lockfiles and modern Vite 8 / Next.js 16 toolchains. |
| **Infrastructure** | **Docker** with Compose plugin | Runs MySQL 9.4, Redis 7.4, RabbitMQ 4.1, Mailpit, Adminer, and MinIO. |
| **Windows developers** | **WSL 2 (Ubuntu)** + PowerShell | Use WSL for Java/Maven/Docker builds and `dev/*.ps1` (or `dev/*.sh`) for the compose stack. |

## Clone the Repositories

```bash
git clone <repo-url>/laptech-api.git
git clone <repo-url>/laptech-client-web-ui.git
git clone <repo-url>/laptech-admin-web-ui.git
```

## Quick Start

### 1. Start Backend Infrastructure & Services

```bash
cd laptech-api
cp .env.example .env
# Fill all required secrets in .env (see Local setup)

# Validate .env and start MySQL, Redis, RabbitMQ, Mailpit, Adminer, MinIO
dev/up.sh --check
dev/up.sh

# Build and verify all 9 modules (includes ArchUnit & Testcontainers tests)
./mvnw -B verify

# Run the API Gateway and domain services (dev profile)
./mvnw spring-boot:run -pl laptech-gateway -Dspring-boot.run.profiles=dev
./mvnw spring-boot:run -pl laptech-identity -Dspring-boot.run.profiles=dev
./mvnw spring-boot:run -pl laptech-catalog -Dspring-boot.run.profiles=dev
```

Once running, verify:
- Aggregated Swagger UI: `http://localhost:8080/swagger-ui.html`
- Gateway health: `http://localhost:8080/actuator/health`

### 2. Start the Storefront (`laptech-client-web-ui`)

```bash
cd laptech-client-web-ui
cp .env.example .env.local
npm install
npm run dev
# Opens at http://localhost:3000
```

Key storefront env vars:
- `NEXT_PUBLIC_API_URL=http://localhost:8080`
- `NEXT_PUBLIC_CURRENCY=VND` (defaults to `USD`; set `VND` for Vietnamese dong formatting and 10M–40M VND Laptop Finder budget tiers)
- `NEXT_PUBLIC_IMAGE_HOST` / `NEXT_PUBLIC_IMAGE_PORT` (for remote R2/MinIO product images)

### 3. Start the Admin Workbench (`laptech-admin-web-ui`)

```bash
cd laptech-admin-web-ui
cp .env.example .env.local
npm install
npm run dev
# Opens at http://localhost:5173
```

Key admin env vars:
- `VITE_API_BASE=http://localhost:8080/api` (note the `/api` suffix)
- `VITE_SHOW_DEMO_FEATURES=true` (optional local-only demo login helper; verified absent from production builds via `npm run check:dist`)

## Security & Commit Rules

- Never commit `.env`, `.env.local`, or real `application-prod.yml` files.
- Outside `dev`/`test`, `RequiredSecretsEnvironmentPostProcessor` fails startup fast if required DB, RabbitMQ, Redis, or JWT secrets are missing.
