# Docker Compose Configs

## Traefik

### 1. Update `docker-compose.yml`

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
      # (optional) enable internal dashboard
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
      # (optional) expose dashboard via a subdomain, remember to set ADMIN_DOMAIN
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
    # you don't need to publish port 8080 externally (Traefik will route),
    # but if you want to debug locally you can leave "8080:8080".
    # ports:
    #   - "8080:8080"
    restart: unless-stopped
    networks:
      - frontend
      - backend
    labels:
      - "traefik.enable=true"
      # route by app domain
      - "traefik.http.routers.app.rule=Host(`${APP_DOMAIN}`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=le"
      # internal container service port
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

### 2. Sample `.env` (add domain & email)

```ini
# App domain (point DNS to this server)
APP_DOMAIN=app.example.com
# Email for Let's Encrypt registration
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

# (optional) Dashboard domain if you want to enable the traefik router labels above
# ADMIN_DOMAIN=traefik.example.com
```

---

### 3. Prep before running

Create volume for storing certificates:

```bash
docker volume create traefik_letsencrypt
# If you prefer to access certs directly on the host:
# mkdir -p /opt/traefik && touch /opt/traefik/acme.json && chmod 600 /opt/traefik/acme.json
# then bind-mount that path to /letsencrypt instead of using a named volume (your choice).
```

1. DNS: point the `A` record of `APP_DOMAIN` to the server public IP.
2. Open ports 80 & 443 on firewall / security group.

---

### 4. Run

```bash
docker compose up -d --build
```

* Access: `https://app.example.com` (replace with your `APP_DOMAIN`).
* Traefik will request and auto-renew certificates.

---

### Optional: expose Traefik dashboard securely

* Uncomment the dashboard labels in the `traefik` service for the `traefik` router (they are commented in the file).
* Set `ADMIN_DOMAIN` in `.env`.
* You can add a Basic Auth middleware if needed; I can generate a user:pass hash for you if you want.

---

## Nginx

```yaml
version: '3.8'

services:
  # --- Nginx reverse proxy (auto-config from other services' labels) ---
  nginx-proxy:
    image: nginxproxy/nginx-proxy:alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # let nginx-proxy read dynamic config and certs
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

  # --- Your application (proxied via domain) ---
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
    # NO need to map port 8080 externally; nginx-proxy will route into this container
    # ports:
    #   - "8080:8080"
    restart: unless-stopped
    networks:
      - frontend
      - backend
    # nginx-proxy defaults to routing to container port 80. Spring app runs on 8080,
    # so specify service port explicitly:
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

### Sample `.env`

```ini
# App domain (point A/AAAA record to server IP)
APP_DOMAIN=app.example.com
# Email for Let's Encrypt notifications
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

### How to run

1. DNS: point `APP_DOMAIN` to the server IP (open ports 80/443).

2. Start:

   ```bash
   docker compose up -d --build
   ```

3. Access: `https://app.example.com` (replace with your domain).

* The `acme-companion` will automatically request/renew certs and reload Nginx when certs change.

### Quick notes

* If you want to run multiple apps later, just add a new service and set `VIRTUAL_HOST`, `LETSENCRYPT_HOST`, `VIRTUAL_PORT` accordingly — nginx-proxy will map them automatically.
* No need to write Nginx configs manually; this stack auto-generates config from labels/env.
