---
id: deployment-guide
title: Deployment & DevOps Guide
sidebar_label: Deployment Guide
sidebar_position: 1
description: Deployment blueprints for Vercel (Frontend), Railway (FastAPI + PostgreSQL), Cloudflare R2, and Docker Compose.
---

# 🚢 Deployment & DevOps Guide

This guide details the complete deployment setup for LinguFlow across cloud providers:
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Railway PostgreSQL
- **Media Storage**: Cloudflare R2
- **Local Dev / Staging**: Docker Compose

For the **`staging` git branch**, Railway staging environment, and the later move of production onto **`lingu-flow.com`**, see **[Domain Cutover](./domain-cutover.md)**.

---

## 🏗️ Architecture Overview

```mermaid
flowchart LR
    subgraph Vercel["Vercel (Frontend Hosting)"]
        V[Vue 3 SPA Build]
    end

    subgraph Railway["Railway Cloud Infrastructure"]
        API[FastAPI Python Backend]
        PG[(PostgreSQL 16 Database)]
    end

    subgraph Cloudflare["Cloudflare Infrastructure"]
        R2[(Cloudflare R2 Bucket)]
    end

    V -->|API Requests| API
    API -->|Async Connection| PG
    API -->|S3 Presigned URLs| R2
```

---

## 1. Local Development (`Docker Compose`)

Run the full stack locally with PostgreSQL:

```bash
# Start PostgreSQL database container
docker-compose up -d postgres

# Run backend locally
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Run frontend locally
cd ../frontend
npm install
npm run dev
```

---

## 2. Backend Deployment (`Railway`)

1. Connect your GitHub repository `newtc22222/lingu-flow` to **Railway**.
2. Select root directory `backend/`.
3. Add a **PostgreSQL** database service on Railway.
4. Configure environment variables in Railway dashboard:

```env
ENVIRONMENT=production
PORT=8000
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@postgres.railway.internal:5432/railway
JWT_SECRET=super_secret_production_random_key_min_32_chars
CORS_ORIGINS=["https://linguflow.vercel.app"]
CORS_ORIGIN_REGEX=https://linguflow-.*\.vercel\.app

# Cloudflare R2
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=linguflow-media
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
```

5. Railway builds the app using `backend/Dockerfile` or nixpacks, runs `alembic upgrade head` and starts `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

---

## 3. Frontend Deployment (`Vercel`)

1. Connect repository to **Vercel**.
2. Set Root Directory to `frontend/`.
3. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add `vercel.json` rewrite configuration for Vue Router SPA fallback and API proxying:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://backend-production.up.railway.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. Media Storage Setup (`Cloudflare R2`)

Full pipeline, diagnosis, and the CORS JSON: **[Card Image Uploads (R2 + CORS)](../features/card-image-uploads.md)**.

1. Log in to Cloudflare Dashboard → **R2 Object Storage**.
2. Create bucket named `linguflow-media` (and a separate `linguflow-media-staging` if you isolate staging objects).
3. Under **Settings → CORS policy**, allow the SPA origins to `PUT` / `GET` / `HEAD` with `content-type`. FastAPI `CORS_ORIGINS` does **not** apply to the browser’s direct PUT to R2. Without this, the card editor shows “Không thể tải ảnh lên” and Chrome logs `CORS not configured for this bucket`.
4. Create an API Token with **Object Read & Write** permissions scoped to that bucket.
5. Copy Account ID, Access Key ID, Secret Access Key, bucket name, and endpoint into Railway / `backend/.env`. Restart the API after changing `R2_*` — `get_settings()` is cached and `--reload` does not re-read `.env`.
