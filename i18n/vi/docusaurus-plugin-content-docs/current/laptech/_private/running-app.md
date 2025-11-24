# Sử dụng ứng dụng

## 1) Chuẩn bị môi trường

### 1.1. Yêu cầu tối thiểu

* **JDK 21** (Temurin/Adoptium, Zulu, Oracle đều ok)
* **Maven 3.9+** hoặc **Gradle 8+** (repo demo đang dùng Maven)
* **Docker & Docker Compose** (khuyến nghị cho dev nhanh)
* **IntelliJ IDEA** (Community/Ultimate đều chạy Spring Boot ok)
* (Tùy chọn) **cURL** hoặc **HTTP client** (Postman/Bruno/Insomnia)

### 1.2. Cài đặt nhanh

#### macOS

```bash
# JDK 21 + Maven + Docker
brew install --cask temurin
brew install maven
brew install --cask docker
```

#### Ubuntu/Debian

```bash
sudo apt updateBrandDetails
sudo apt install -y wget unzip
# Temurin JDK 21
sudo apt install -y temurin-21-jdk || sudo apt install -y openjdk-21-jdk
sudo apt install -y maven
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

> Logout/login lại để áp dụng nhóm `docker`.

#### Windows

* Cài **Temurin 21** từ Adoptium
* Cài **Maven** (thêm `MAVEN_HOME` và `%MAVEN_HOME%\bin` vào PATH)
* Cài **Docker Desktop**
* Cài **IntelliJ IDEA**

---

## 2) Clone và cấu trúc dự án

```bash
git clone <repo-url> my-app
cd my-app
```

Cấu trúc chính:

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

## 3) Thiết lập biến môi trường

### 3.1. Tạo `.env` từ mẫu

```bash
cp .env.example .env
# Sau đó mở .env và chỉnh lại các giá trị cho máy bạn
```

Các biến quan trọng:

* **SPRING\_PROFILES\_ACTIVE**: `dev` / `staging` / `prod`
* **DB\_URL**, **DB\_USERNAME**, **DB\_PASSWORD**
* **REDIS\_HOST**, **REDIS\_PORT**, **REDIS\_PASSWORD** (nếu có)
* Các biến cho `docker-compose`: `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`

> **Không commit** file `.env` thật.

### 3.2. Set biến môi trường trong IntelliJ

1. Vào **Run > Edit Configurations…**
2. Chọn cấu hình Spring Boot của project
3. Ở tab **Configuration**:

    * **Environment variables** → nhấn `…` → thêm:

        * `SPRING_PROFILES_ACTIVE=dev` (hoặc `staging`, `prod`)
        * `DB_URL=jdbc:mysql://localhost:3306/mydb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
        * `DB_USERNAME=app_user`
        * `DB_PASSWORD=change_me`
        * `REDIS_HOST=localhost`, `REDIS_PORT=6379`, `REDIS_PASSWORD=` (nếu có)
    * (Tùy chọn) **Program arguments**: `--spring.profiles.active=staging`
4. **OK** → Run

> Mẹo: cài plugin **EnvFile** (JetBrains Marketplace) → tick **Enable EnvFile** → chọn `.env` để IntelliJ auto nạp biến.

---

## 4) Chuẩn bị MySQL & Redis

Bạn có 2 cách:

### 4.1. Dùng Docker (nhanh – khuyến nghị)

```bash
# Bật riêng DB/Redis cho local dev
docker compose up -d mysql redis

# Xem logs
docker compose logs -f mysql
docker compose logs -f redis
```

* MySQL chạy ở `localhost:3306`, DB mặc định theo `.env` (`MYSQL_DATABASE`).
* Redis chạy ở `localhost:6379`.

**Tạo DB/user thủ công (nếu cần):**

```bash
docker exec -it mysql bash
mysql -u root -p$MYSQL_ROOT_PASSWORD

-- Trong shell MySQL:
CREATE DATABASE mydb_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'devuser'@'%' IDENTIFIED BY 'devpass';
GRANT ALL PRIVILEGES ON mydb_dev.* TO 'devuser'@'%';
FLUSH PRIVILEGES;
```

### 4.2. Dùng MySQL & Redis cài sẵn trên máy

* Đảm bảo service đang chạy, cổng **3306** (MySQL), **6379** (Redis).
* Tạo DB/user tương tự lệnh SQL bên trên (chạy bằng client của bạn).
* Cập nhật `application-dev.yml` hoặc biến môi trường cho đúng host/port/creds.

---

## 5) Cấu hình Spring Profiles

* Mặc định trong `application.yml` → `spring.profiles.active=dev`
* Ghi đè bằng:

  * **ENV**: `SPRING_PROFILES_ACTIVE=staging`
  * **Program args**: `--spring.profiles.active=staging`
  * **JVM args**: `-Dspring.profiles.active=staging`

Hồ sơ (profile) dùng khi chạy:

* **dev**: connect local, log DEBUG (dễ debug)
* **staging**: đọc secrets từ ENV, log INFO
* **prod**: tắt swagger/api-docs, log WARN, đọc secrets từ ENV

---

## 6) Khởi chạy ứng dụng

### 6.1. Chạy bằng Maven (local)

```bash
# Cách 1: nạp .env rồi chạy
./run.sh

# Cách 2: thuần Maven
./mvnw spring-boot:run
# hoặc
mvn spring-boot:run
```

> Nếu dùng container DB/Redis, sửa `application-dev.yml` để `url` trỏ `mysql` thay vì `localhost` khi chạy **trong container**. Còn chạy **trên máy** thì vẫn dùng `localhost`.

### 6.2. Build JAR & chạy

```bash
./mvnw -DskipTests package
java -jar target/*.jar
# hoặc chỉ định profile:
java -Dspring.profiles.active=staging -jar target/*.jar
```

### 6.3. Chạy toàn bộ bằng Docker Compose (app + DB + Redis)

```bash
# build app image + chạy cả 3 services
docker compose up --build
# hoặc rebuild lại app khi đổi code
docker compose up -d --build app
```

* App lắng nghe: `http://localhost:8080`
* Trong `docker-compose.yml`, app dùng `SPRING_PROFILES_ACTIVE=staging` (có thể đổi trong `.env`)

---

## 7) Kiểm tra sau khi chạy

### 7.1. Actuator

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/info
curl http://localhost:8080/actuator/metrics
```

### 7.2. Swagger / OpenAPI

* **Dev/Staging**: mở `http://localhost:8080/swagger`
* **Prod**: swagger bị tắt (theo `application-prod.yml.example`)

---

## 8) Flyway (nếu dùng migration)

* Thêm file SQL ở `src/main/resources/db/migration`, ví dụ:

  * `V1__init.sql`, `V2__add_user_table.sql`
* Khi app start, Flyway sẽ auto migrate (theo `spring.flyway.enabled=true`).

Ví dụ `V1__init.sql`:

```sql
CREATE TABLE IF NOT EXISTS sample (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9) Tích hợp IntelliJ: run/debug như pro

1. **Mở project** → chờ IntelliJ index & import Maven
2. **Add Configuration**:

    * **Main class**: app của bạn (ví dụ `com.example.MyAppApplication`)
    * **Environment variables**: thêm các biến như phần 3.2
    * **VM options** (tùy chọn): `-Xms512m -Xmx1g` (tùy tài nguyên)
3. **Debug**: bấm bọ 🐞 → đặt breakpoint → F9

> Nếu dùng **EnvFile**: tick **Enable EnvFile** → chọn `.env`.

---

## 10) Troubleshooting (hay gặp)

* ❌ `Communications link failure` (MySQL)

  * DB chưa sẵn sàng → chờ thêm, kiểm tra `docker compose logs -f mysql`
  * Sai host/port/user/pass → đối chiếu `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
  * `allowPublicKeyRetrieval=true` cần cho MySQL 8 nếu dùng caching-sha2

* ❌ `Access denied for user`

  * User chưa có quyền trên DB → chạy `GRANT ALL PRIVILEGES ...` như phần 4.1

* ❌ `Cannot connect to Redis`

  * Kiểm tra `REDIS_HOST`, `REDIS_PORT`
  * Nếu dùng container: app chạy **trong Docker** thì host là `redis`; chạy **ngoài Docker** thì là `localhost`

* ❌ Swagger 404

  * Dev/Staging: đường dẫn `/swagger`
  * Prod: swagger bị tắt theo config mẫu

* ❌ Flyway lỗi migrate

  * Kiểm tra thứ tự file `V1__*.sql`, `V2__*.sql`
  * Không đổi tên file đã chạy rồi (hoặc reset schema `flyway_schema_history` cẩn thận)

---

## 11) Quy tắc bảo mật & commit

* ✅ Commit: `application.yml`, `application-dev.yml`, `application-staging.yml`, `application-prod.yml.example`, `.env.example`
* ❌ Không commit: `application-prod.yml` thật, `.env` thật, secrets
* Dùng **ENV** hoặc **secret manager** (Vault, AWS/GCP/Azure Secret Manager) cho prod/staging

---

## 12) Lệnh nhanh (cheat sheet)

```bash
# Bật DB/Redis
docker compose up -d mysql redis

# Chạy app local (dev)
./mvnw spring-boot:run

# Build JAR & chạy
./mvnw -DskipTests package
java -Dspring.profiles.active=staging -jar target/*.jar

# Chạy cả app + DB + Redis qua compose
docker compose up --build

# Kiểm tra sức khỏe
curl http://localhost:8080/actuator/health
# Swagger (dev/staging)
open http://localhost:8080/swagger
```
