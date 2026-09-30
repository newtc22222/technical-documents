---
title: DevOps
sidebar_label: DevOps
sidebar_position: 5
---

## Infrastructure & Environments
Laptech API is a distributed application requiring robust infrastructure to manage multiple Spring Boot processes, databases, and a message broker.

## Local Infrastructure (Docker Compose)
Image versions, host ports, credentials, and the start sequence are on the [local setup](../setup/local-setup.md) page. Use `dev/up.ps1` on Windows or `dev/up.sh` in WSL. Those scripts wait until mysql, redis, rabbitmq, mailpit, minio, and adminer are healthy, then run the one-shot RabbitMQ definition import. A bare `docker compose up -d --wait` returns exit code 1 after that importer exits 0.

Host port 3306 may already be taken by a container named `mysql-laptech`. Set `MYSQL_PORT` and `DB_PORT` to a free port. Never stop, remove, or reuse `mysql-laptech`.

## CI/CD & Deployment
* **Monorepo Strategy**: The application is built as a Maven multi-module project. In a CI pipeline, you can build all modules together (`mvn clean package`) or build specific modules independently if they have isolated changes.
* **Database Migrations**: Production uses **Flyway** with `ddl-auto: validate`. Dev keeps Flyway off and uses Hibernate `ddl-auto: update`. DevOps must ensure Flyway migrations run successfully before releasing a new version of a service.
* **Dockerization**: A `Dockerfile` template is available. Each service is intended to be packaged into its own container image.

## Port Assignments
These are the Spring service ports in each module's `application.yml` on `laptech-api` main:
* **8080**: API Gateway
* **8081**: Identity Service
* **8092**: Catalog Service
* **8083**: Inventory Service
* **8084**: Order Service
* **8085**: Payment Service
* **8086**: Promotion Service
* **8087**: Content Service

Compose host ports (MySQL, Redis, RabbitMQ, Mailpit, Adminer, MinIO) are in the [local setup](../setup/local-setup.md) page, not in this list. Adminer listens on `ADMINER_PORT` (8090), which is separate from the Catalog service port 8092.

## Secrets Management
Keep `.env` git-ignored. Production takes secrets from the environment. The names are listed on the [local setup](../setup/local-setup.md) page. Do not write the values into docs or the wiki.
