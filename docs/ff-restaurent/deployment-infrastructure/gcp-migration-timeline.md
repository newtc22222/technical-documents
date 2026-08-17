---
id: gcp-migration-timeline
title: GCP Migration Timeline & Learning Record
sidebar_label: GCP Migration Timeline
sidebar_position: 5
description: Detailed timeline, infrastructure provisioning script, and troubleshooting record of the Phase 2.5 GCP migration.
---

# GCP Migration Timeline & Learning Record

This document provides a detailed timeline and explanation of the steps taken to migrate FF RESTaurent from Render to Google Cloud Platform (GCP) during the Phase 2.5 milestone (FF-60). It serves as a learning resource and historical record of the infrastructure provisioning and troubleshooting process.

## 1. Infrastructure Provisioning Script (`harden-production-gcp.sh`)

To ensure a reproducible and automated deployment, we utilized and expanded upon a bash script (`scripts/harden-production-gcp.sh`) leveraging the `gcloud` CLI. The script provisions all required GCP resources in the correct order.

### Global Load Balancing & Routing

1. **Global Static IP Allocation:** We reserved a global static IP address (`34.111.254.90`) to provide a stable, single entry point for all incoming traffic.
2. **Serverless Network Endpoint Groups (NEGs):** NEGs were created to act as a bridge between the Global Load Balancer and the Cloud Run services (API and Web). This allows the Load Balancer to route traffic directly to serverless containers.
3. **Backend Services:** We created backend services for both the API and Web NEGs, which manage the distribution of traffic.
4. **URL Map (Path-Based Routing):** A URL map was configured to inspect incoming requests and route them appropriately:
   - Requests matching `/api/*` (and health checks) are routed to the **API Backend**.
   - All other requests (default) are routed to the **Web Backend**.
5. **Managed SSL Certificates:** We provisioned Google-managed SSL certificates for both `app.ff-restaurent.com` and `api.ff-restaurent.com`. GCP automatically provisions and renews these certificates once the DNS records are pointed to the Load Balancer IP.
6. **Target HTTPS Proxy & Forwarding Rule:** A target HTTPS proxy was created to bind the SSL certificates to the URL map. Finally, a Global Forwarding Rule was established to listen on Port 443 (HTTPS) at the reserved Static IP and forward traffic to the proxy.

### Security & Configuration

- **Secret Manager:** To configure Cross-Origin Resource Sharing (CORS), we created and injected a new version of the `ff-cors-origins` secret into Google Cloud Secret Manager. The API Cloud Run service was granted IAM permissions to read this secret on startup.

## 2. Container Build & Deployment

### API Deployment

The API container was deployed to Cloud Run using the `render` target from the Dockerfile. The API seamlessly deployed because it relies on standard Node.js execution and Prisma schema migrations which run on container startup.

### Web Deployment & Troubleshooting

The frontend Web deployment presented several interesting challenges that we had to resolve:

1. **Windows/WSL Interoperability with `gcloud`:**
   - *Issue:* Executing Google Cloud commands from WSL (Windows Subsystem for Linux) that invoke the Windows `gcloud.cmd` binary caused issues with capturing standard output (e.g., extracting IP addresses) and passing piped data (`/dev/stdin`).
   - *Solution:* We created a `gcloud_wrapper.sh` script to explicitly invoke PowerShell (`powershell.exe -NoProfile -Command`) to run the `gcloud` CLI. We also modified `harden-production-gcp.sh` to write the dynamically generated Cloud Build configuration (`cloudbuild-tmp.yaml`) to the disk rather than piping it via `stdin`.

2. **Cloud Build TypeScript Caching Bug (`TS2307`):**
   - *Issue:* Cloud Build failed to compile the frontend (`apps/web`) with a `Cannot find module '@ff-restaurent/shared'` error, despite the code working locally. 
   - *Root Cause:* When we ran local typechecks (`tsc -b`), TypeScript generated `.tsbuildinfo` cache files. Because these cache files were not explicitly ignored, `gcloud builds submit` uploaded them to the Cloud Build environment. When Cloud Build attempted to build the `@ff-restaurent/shared` workspace, it saw the cache file, assumed the dependency was already compiled, and skipped generating the `.d.ts` output files, causing the subsequent Web build to fail.
   - *Solution:* We added `*.tsbuildinfo` to both `.gitignore` and `.dockerignore`. This ensures that local build caches never pollute the Cloud Build context, enforcing a clean, reproducible container build.

3. **Cloud Run Container Port Mismatch:**
   - *Issue:* After a successful Cloud Build, the Cloud Run deployment failed with a health check timeout error: `The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable`.
   - *Root Cause:* The Web container uses `nginx` to serve the static Vite build, and `nginx` listens on port `80` by default. However, Cloud Run expects containers to listen on port `8080` by default.
   - *Solution:* We updated the deployment command (`gcloud run deploy`) to explicitly include `--port 80`, informing Cloud Run exactly where to route internal traffic.

## 3. Monitoring & Observability

After the services were successfully deployed, we provisioned Google Cloud Monitoring resources:

- **Uptime Checks:** Automated checks to ping the Web and API endpoints periodically from multiple global regions to verify availability.
- **Alert Policies:** Policies configured to alert the system administrator if the uptime checks fail or if the services become unreachable.

## 4. Post-Cutover

- The user successfully updated the DNS Registrar A Records for `api.ff-restaurent.com` and `app.ff-restaurent.com` to point to the Load Balancer IP (`34.111.254.90`).
- The system entered a 48-hour monitoring window to observe stability before retiring the legacy Render infrastructure.

## 5. Google Cloud Services Used

Here is a comprehensive list of all GCP services currently active in the FF RESTaurent architecture:

1. **Cloud Run**: Hosts the serverless Docker containers for both the API (`ff-restaurent-api`) and the Web App (`ff-restaurent-web`). It handles auto-scaling, scaling to zero, and HTTPS provisioning for the internal `.run.app` URLs.
2. **Cloud SQL (PostgreSQL 16)**: The managed relational database instance hosting the authoritative production dataset.
3. **Cloud Load Balancing**: The global external Application Load Balancer that intercepts incoming traffic at the single static IP.
4. **Certificate Manager**: Automatically provisions, renews, and attaches Let's Encrypt managed SSL certificates for `app.ff-restaurent.com` and `api.ff-restaurent.com`.
5. **Secret Manager**: Securely stores environment variables like `DATABASE_URL`, `JWT_SECRET`, and Supabase keys, injecting them into Cloud Run containers at runtime so they aren't stored in source code.
6. **Cloud Build**: The CI/CD execution environment that pulls your code, builds the Docker images in the cloud, and pushes them to Artifact Registry.
7. **Artifact Registry**: A secure, private Docker image repository where your built containers are stored before Cloud Run pulls them.
8. **Cloud Monitoring & Cloud Logging**: Ingests all `stdout`/`stderr` logs from your applications and executes Uptime Checks to ensure your endpoints are healthy.

## 6. How to Deploy in the Future

Now that the infrastructure is established, you do **NOT** need to run the `harden-production-gcp.sh` script again. Future deployments only require building and pushing the updated container images.

You can deploy updates via the Google Cloud CLI (or set up a GitHub Actions pipeline to run these commands automatically):

### Deploying the API

1. Ensure your current working directory is the project root.
2. Run the Cloud Build submit command for the API Dockerfile:
   ```bash
   gcloud builds submit --tag asia-east1-docker.pkg.dev/ff-restaurent/api/production --file apps/api/Dockerfile .
   ```
3. Tell Cloud Run to deploy the new image:
   ```bash
   gcloud run deploy ff-restaurent-api --image asia-east1-docker.pkg.dev/ff-restaurent/api/production --region asia-east1
   ```

### Deploying the Web App

1. Ensure your current working directory is the project root.
2. Run the Cloud Build submit command for the Web Dockerfile:
   ```bash
   gcloud builds submit --tag asia-east1-docker.pkg.dev/ff-restaurent/web/production --file apps/web/Dockerfile .
   ```
3. Tell Cloud Run to deploy the new image:
   ```bash
   gcloud run deploy ff-restaurent-web --image asia-east1-docker.pkg.dev/ff-restaurent/web/production --region asia-east1 --port 80
   ```
