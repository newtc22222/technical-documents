---
title: Developer
sidebar_label: Developer
sidebar_position: 4
---

## Architecture: Modular Monolith with DDD
Laptech is built as a **Maven multi-module modular monolith**. It contains 7 distinct domain services that run on separate ports but live within the same repository.
* `laptech-common` holds shared configurations, event schemas, and utilities.
* Services communicate synchronously via **OpenFeign** (`/api/internal/`) and asynchronously via **RabbitMQ** topic exchanges.

### DDD Layering Strategy
Inside each domain module (e.g., `laptech-order`), the codebase follows strict architectural layers (enforced by ArchUnit):
1. **`domain/`**: Pure Java. Contains Aggregates, Entities, Value Objects, Domain Events, and Repository Interfaces. NO Spring or JPA dependencies are allowed here.
2. **`application/`**: Use cases, Application Services, DTOs, Mappers, and Event Handlers.
3. **`infrastructure/`**: JPA implementations, Feign clients, RabbitMQ producers/consumers.
4. **`interfaces/`**: REST controllers and HTTP delivery mechanisms.

## Tech Stack
* **Java 21**, **Spring Boot 3.5.x**, **Spring Cloud 2025.0.x**
* **MySQL**, **Redis**, and **RabbitMQ**. Image versions are pinned in the API compose file and described on the [local setup](../setup/local-setup.md) page.
* Each service has its own schema. Dev runs with Hibernate `ddl-auto: update` and Flyway off. Production runs Flyway with `ddl-auto: validate`.
* **Lombok**, **MapStruct**, **ArchUnit**

## Local Setup & Execution

Copy `.env.example` to `.env` in the API repository. The [local setup](../setup/local-setup.md) page lists the variable names that must be set. Do not commit `.env`, and do not paste secret values into this page.

Start infrastructure with `dev/up.ps1` on Windows or `dev/up.sh` in WSL. Build and test with `./mvnw -B verify`. WSL Java 21 is `JAVA_HOME=$HOME/.sdkman/candidates/java/21.0.8-tem`.

To run one service:

```bash
./mvnw spring-boot:run -pl laptech-catalog -Dspring-boot.run.profiles=dev
```

*Tip: In IntelliJ, use the Services dashboard to start multiple Spring Boot applications at once.*

## Coding Guidelines
* Do not bypass the Domain layer. All business logic must reside within Aggregates and Domain Services.
* Repositories in the `domain` layer are interfaces; their Spring Data JPA implementations must live in `infrastructure`.
* Ensure new internal Feign calls are properly authenticated or secured via internal network rules.
