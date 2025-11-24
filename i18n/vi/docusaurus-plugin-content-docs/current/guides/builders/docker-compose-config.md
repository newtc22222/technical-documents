# Docker Compose Configs

## Traefik

### 1. Cập nhật `docker-compose.yml`

```yaml
version: '3.8'

services:
  # --- Reverse proxy ---
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      # Let’s Encrypt
      - --certificatesresolvers.le.acme.httpchallenge=true
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.le.acme.email=${LETSENCRYPT_EMAIL}
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
      # (tuỳ chọn) bật dashboard nội bộ
      - --api.dashboard=true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    networks:
      - frontend
    labels:
      - "traefik.enable=true"
      # redirect http -> https
      - "traefik.http.routers.http-catchall.rule=HostRegexp(`{any:.+}`)"
      - "traefik.http.routers.http-catchall.entrypoints=web"
      - "traefik.http.routers.http-catchall.middlewares=redirect-to-https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      # (tuỳ chọn) expose dashboard qua domain phụ, nhớ đổi ADMIN_DOMAIN
      # - "traefik.http.routers.traefik.rule=Host(`${ADMIN_DOMAIN}`)"
      # - "traefik.http.routers.traefik.service=api@internal"
      # - "traefik.http.routers.traefik.entrypoints=websecure"
      # - "traefik.http.routers.traefik.tls.certresolver=le"

  mysql:
    image: mysql:8.0
    container_name: mysql-laptech
    restart: unless-stopped
    ports:
      - ${MYSQL_PORT:-3306}:3306
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-laptech_db}
      MYSQL_USER: ${MYSQL_USER:-laptech_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-password123}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: my-app
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-staging}
      SERVER_PORT: ${SERVER_PORT:-8080}
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/${MYSQL_DATABASE:-laptech_db}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER:-laptech_user}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-password123}
      APP_JWT_SECRET: ${APP_JWT_SECRET}
    # không cần publish port 8080 ra ngoài nữa (Traefik sẽ route),
    # nhưng nếu muốn debug local có thể để lại "8080:8080".
    # ports:
    #   - "8080:8080"
    restart: unless-stopped
    networks:
      - frontend
      - backend
    labels:
      - "traefik.enable=true"
      # route theo domain app
      - "traefik.http.routers.app.rule=Host(`${APP_DOMAIN}`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=le"
      # service port bên trong container
      - "traefik.http.services.app.loadbalancer.server.port=8080"

volumes:
  mysql_data:
  traefik_letsencrypt:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

---

### 2. `.env` mẫu (bổ sung domain & email)

```ini
# App domain (trỏ DNS về server này)
APP_DOMAIN=app.example.com
# Email để đăng ký Let's Encrypt
LETSENCRYPT_EMAIL=you@example.com

# MySQL
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=laptech_db
MYSQL_USER=laptech_user
MYSQL_PASSWORD=password123

# Spring
SPRING_PROFILES_ACTIVE=staging
SERVER_PORT=8080
APP_JWT_SECRET=your_jwt_secret_here

# (optional) Dashboard domain nếu muốn bật ở phần label traefik
# ADMIN_DOMAIN=traefik.example.com
```

---

### 3. Chuẩn bị trước khi chạy

Tạo file lưu chứng chỉ:

  ```bash
  docker volume create traefik_letsencrypt
  # Nếu muốn xem trực tiếp trên host:
  # mkdir -p /opt/traefik && touch /opt/traefik/acme.json && chmod 600 /opt/traefik/acme.json
  # rồi bind mount vào /letsencrypt thay vì volume (tuỳ bạn).
  ```

1. DNS: trỏ bản ghi `A` của `APP_DOMAIN` về IP máy chủ (public).
2. Mở port 80 & 443 trên firewall/security group.

---

### 4. Chạy

```bash
docker compose up -d --build
```

* Truy cập: `https://app.example.com` (đổi theo `APP_DOMAIN`).
* Traefik tự xin và gia hạn chứng chỉ.

---

### Optional: expose Traefik dashboard an toàn

* Bật các label ở service `traefik` cho router `traefik` (đã comment sẵn).
* Đặt `ADMIN_DOMAIN` trong `.env`.
* Có thể thêm Basic Auth middleware nếu cần; mình có thể gen sẵn user\:pass hash cho bạn nếu muốn.

---

## Nginx

```yaml
version: '3.8'

services:
  # --- Nginx reverse proxy (tự cấu hình từ labels của các service khác) ---
  nginx-proxy:
    image: nginxproxy/nginx-proxy:alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # để nginx-proxy đọc cấu hình động và certs
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - nginx_certs:/etc/nginx/certs:ro
      - nginx_vhost:/etc/nginx/vhost.d
      - nginx_html:/usr/share/nginx/html
    networks:
      - frontend

  # --- ACME companion (Let’s Encrypt) ---
  nginx-proxy-acme:
    image: nginxproxy/acme-companion
    container_name: nginx-proxy-acme
    restart: unless-stopped
    environment:
      DEFAULT_EMAIL: ${LETSENCRYPT_EMAIL}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - nginx_certs:/etc/nginx/certs
      - nginx_vhost:/etc/nginx/vhost.d
      - nginx_html:/usr/share/nginx/html
    networks:
      - frontend
    depends_on:
      - nginx-proxy

  # --- MySQL (backend only) ---
  mysql:
    image: mysql:8.0
    container_name: mysql-laptech
    restart: unless-stopped
    ports:
      - ${MYSQL_PORT:-3306}:3306
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-laptech_db}
      MYSQL_USER: ${MYSQL_USER:-laptech_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-password123}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  # --- Ứng dụng của bạn (được proxy qua domain) ---
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: my-app
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      # Spring profile & server
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-staging}
      SERVER_PORT: ${SERVER_PORT:-8080}
      # Datasource (Spring Boot)
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/${MYSQL_DATABASE:-laptech_db}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER:-laptech_user}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-password123}
      APP_JWT_SECRET: ${APP_JWT_SECRET}

      # --- nginx-proxy + acme-companion ---
      VIRTUAL_HOST: ${APP_DOMAIN}
      LETSENCRYPT_HOST: ${APP_DOMAIN}
      LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL}
    # KHÔNG cần map port 8080 ra ngoài; nginx-proxy sẽ route vào container này
    # ports:
    #   - "8080:8080"
    restart: unless-stopped
    networks:
      - frontend
      - backend
    # nginx-proxy mặc định trỏ vào cổng 80 của container. App Spring chạy 8080,
    # nên chỉ định rõ service port:
    labels:
      - "VIRTUAL_PORT=8080"

volumes:
  mysql_data:
  nginx_certs:
  nginx_vhost:
  nginx_html:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

### `.env` mẫu

```ini
# Domain app (trỏ DNS A/AAAA về IP server)
APP_DOMAIN=app.example.com
# Email nhận thông báo từ Let's Encrypt
LETSENCRYPT_EMAIL=you@example.com

# MySQL
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=laptech_db
MYSQL_USER=laptech_user
MYSQL_PASSWORD=password123

# Spring
SPRING_PROFILES_ACTIVE=staging
SERVER_PORT=8080
APP_JWT_SECRET=your_jwt_secret_here
```

### Cách chạy

1. Trỏ DNS: `APP_DOMAIN` → IP server (mở port 80/443).
2. Khởi chạy:

   ```bash
   docker compose up -d --build
   ```

3. Truy cập: `https://app.example.com` (đổi theo domain của bạn).

    * **acme-companion** sẽ tự xin/gia hạn cert + tự reload Nginx mỗi khi cert đổi.

### Notes nhanh

* Nếu bạn muốn chạy nhiều app sau này, chỉ cần thêm service mới và set `VIRTUAL_HOST`, `LETSENCRYPT_HOST`, `VIRTUAL_PORT` tương ứng — nginx-proxy sẽ tự map.
* Không cần viết file Nginx thủ công, stack này auto config từ labels/env.
