# Using the Application

## 1) Prepare the Environment

### 1.1. Minimum Requirements

* **JDK 21** (Temurin/Adoptium, Zulu, Oracle — all fine)
* **Maven 3.9+** or **Gradle 8+** (demo repo uses Maven)
* **Docker & Docker Compose** (recommended for fast dev setup)
* **IntelliJ IDEA** (Community or Ultimate works with Spring Boot)
* (Optional) **cURL** or any **HTTP client** (Postman/Bruno/Insomnia)

### 1.2. Quick Installation

#### macOS

```bash
# JDK 21 + Maven + Docker
brew install --cask temurin
brew install maven
brew install --cask docker
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y wget unzip
# Temurin JDK 21
sudo apt install -y temurin-21-jdk || sudo apt install -y openjdk-21-jdk
sudo apt install -y maven
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

> Log out and log back in to apply the `docker` group.

#### Windows

* Install **Temurin 21** from Adoptium
* Install **Maven** (add `MAVEN_HOME` and `%MAVEN_HOME%\bin` to PATH)
* Install **Docker Desktop**
* Install **IntelliJ IDEA**

---

## 2) Clone the Project & Structure

```bash
git clone <repo-url> my-app
cd my-app
```

Main structure:

```txt
src/main/resources/
  application.yml
  application-dev.yml
  application-staging.yml
  application-prod.yml.example
Dockerfile
docker-compose.yml
.env.example
run.sh
```

---

## 3) Environment Variables Setup

### 3.1. Create `.env` from template

```bash
cp .env.example .env
# Then open .env and adjust values for your machine
```

Important variables:

* **SPRING_PROFILES_ACTIVE**: `dev` / `staging` / `prod`
* **DB_URL**, **DB_USERNAME**, **DB_PASSWORD**
* **REDIS_HOST**, **REDIS_PORT**, **REDIS_PASSWORD** (if used)
* Docker Compose vars: `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`

> Do **not** commit the real `.env` file.

### 3.2. Set environment variables in IntelliJ

1. Go to **Run > Edit Configurations…**

2. Select your Spring Boot run configuration

3. In the **Configuration** tab:

   * **Environment variables** → click `...` → add:

     * `SPRING_PROFILES_ACTIVE=dev` (or staging/prod)
     * `DB_URL=jdbc:mysql://localhost:3306/mydb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
     * `DB_USERNAME=app_user`
     * `DB_PASSWORD=change_me`
     * `REDIS_HOST=localhost`, `REDIS_PORT=6379`, `REDIS_PASSWORD=` (if used)
   * (Optional) Program args: `--spring.profiles.active=staging`

4. Click **OK** → Run

> Tip: Install the **EnvFile** plugin → enable it → select `.env` to auto-load your env vars.

---

## 4) Prepare MySQL & Redis

Two options:

### 4.1. Using Docker (fast — recommended)

```bash
# Start DB/Redis for local dev
docker compose up -d mysql redis

# View logs
docker compose logs -f mysql
docker compose logs -f redis
```

* MySQL runs at `localhost:3306` (db based on `.env`)
* Redis runs at `localhost:6379`

**Manually create DB/user (if needed):**

```bash
docker exec -it mysql bash
mysql -u root -p$MYSQL_ROOT_PASSWORD

-- Inside MySQL shell:
CREATE DATABASE mydb_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'devuser'@'%' IDENTIFIED BY 'devpass';
GRANT ALL PRIVILEGES ON mydb_dev.* TO 'devuser'@'%';
FLUSH PRIVILEGES;
```

### 4.2. Using installed MySQL & Redis

* Ensure services are running on **3306** and **6379**
* Create DB/user with SQL above
* Update `application-dev.yml` or environment variables accordingly

---

## 5) Spring Profiles Configuration

* Default in `application.yml`: `spring.profiles.active=dev`
* Override via:

  * **ENV**: `SPRING_PROFILES_ACTIVE=staging`
  * **Program args**: `--spring.profiles.active=staging`
  * **JVM args**: `-Dspring.profiles.active=staging`

Profiles:

* **dev** → local DB, DEBUG logs
* **staging** → ENV secrets, INFO logs
* **prod** → swagger disabled, WARN logs, secrets from ENV

---

## 6) Start the Application

### 6.1. Run locally with Maven

```bash
# Method 1: load .env then run
./run.sh

# Method 2: pure Maven
./mvnw spring-boot:run
# or
mvn spring-boot:run
```

> If using Docker DB/Redis:
> *App running on your machine* → use `localhost`
> *App running inside container* → host becomes `mysql` or `redis`

### 6.2. Build JAR & run

```bash
./mvnw -DskipTests package
java -jar target/*.jar
# or with profile:
java -Dspring.profiles.active=staging -jar target/*.jar
```

### 6.3. Run everything with Docker Compose (app + DB + Redis)

```bash
docker compose up --build
# or rebuild only the app service
docker compose up -d --build app
```

* App runs on: `http://localhost:8080`
* Compose uses `SPRING_PROFILES_ACTIVE=staging` by default (configurable in `.env`)

---

## 7) Post-startup Checks

### 7.1. Actuator

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/info
curl http://localhost:8080/actuator/metrics
```

### 7.2. Swagger / OpenAPI

* **Dev/Staging**: `http://localhost:8080/swagger`
* **Prod**: disabled (per `application-prod.yml.example`)

---

## 8) Flyway (if using migrations)

* Add SQL files in `src/main/resources/db/migration`:

  * `V1__init.sql`, `V2__add_user_table.sql`

* Flyway auto-migrates at startup (`spring.flyway.enabled=true`)

Example `V1__init.sql`:

```sql
CREATE TABLE IF NOT EXISTS sample (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9) IntelliJ Integration: Run/Debug like a Pro

1. Open project → let IntelliJ index/import Maven
2. Create/Edit Run Configuration:

   * **Main class**: e.g. `com.example.MyAppApplication`
   * **Environment variables**: add vars from section 3.2
   * **VM options** (optional): `-Xms512m -Xmx1g`
3. Debug: click the 🐞 icon → set breakpoints → F9

> With **EnvFile** plugin: enable it → select `.env`

---

## 10) Common Troubleshooting

* ❌ **`Communications link failure` (MySQL)**

  * DB not ready → check `docker compose logs -f mysql`
  * Incorrect host/port/credentials → verify env vars
  * Need `allowPublicKeyRetrieval=true` for MySQL 8 auth issues

* ❌ **`Access denied for user`**

  * User lacks privileges → run SQL GRANT commands

* ❌ **`Cannot connect to Redis`**

  * Check `REDIS_HOST`, `REDIS_PORT`
  * Inside Docker → host = `redis`
  * Local machine → host = `localhost`

* ❌ **Swagger 404**

  * Dev/Staging → `/swagger`
  * Prod → disabled

* ❌ **Flyway migration error**

  * Check ordering `V1__*.sql`, `V2__*.sql`
  * Don’t rename already-run migrations
  * Reset `flyway_schema_history` only if you know what you're doing

---

## 11) Security & Commit Rules

* ✅ Commit: `application.yml`, `application-dev.yml`, `application-staging.yml`, `application-prod.yml.example`, `.env.example`
* ❌ Do NOT commit: real `application-prod.yml`, actual `.env`, secrets
* For staging/prod → use ENV or a **secret manager** (Vault, AWS/GCP/Azure)

---

## 12) Quick Commands (cheat sheet)

```bash
# Start DB/Redis
docker compose up -d mysql redis

# Run app locally (dev)
./mvnw spring-boot:run

# Build JAR & run
./mvnw -DskipTests package
java -Dspring.profiles.active=staging -jar target/*.jar

# Run entire stack
docker compose up --build

# Health check
curl http://localhost:8080/actuator/health

# Swagger (dev/staging)
open http://localhost:8080/swagger
```
