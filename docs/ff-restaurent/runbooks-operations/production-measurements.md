---
id: production-measurements
title: Production Measurements
sidebar_label: Production Measurements
sidebar_position: 7
description: Operator checklist for the v2.4 performance follow-up, covering row counts, max_connections, timeouts, pending notifications, cold-start P95, and egress.
---

# Production measurements

:::note

Source: `wiki/Production-Measurements.md` on the [`docs/roadmap-and-wiki`](https://github.com/newtc22222/ff-restaurent/tree/docs/roadmap-and-wiki) branch (snapshot `702f576`). It was moved off `develop` by [#172](https://github.com/newtc22222/ff-restaurent/pull/172) and was written with the [v2.4.5](../releases/release-v2.4.5.md) performance and safety follow-up (#165).

:::

Operator checklist for the v2.4 performance follow-up. Nothing on this page
was run from the change that added it. Do not invent the numbers. Record the
command output next to each item. Do not print secret values, and do not
commit output that contains them.

Project `ff-restaurent`, region `asia-east1`. Production Cloud Run services
are `ff-restaurent-api` and `ff-restaurent-web`. Staging services are
`ff-restaurent-api-staging` and `ff-restaurent-web-staging`. The Cloud SQL
instance name in `.github/workflows/gcp-deploy.yml` is
`ff-restaurent:asia-east1:ff-restaurent-db` for every deploy target. Confirm
you are on the production database before you trust a count.

## Row counts

Production database secret: the Secret Manager secret that holds `DATABASE_URL`. Print only the database name,
user, and host. The password stays in the pipe.

```bash
gcloud secrets versions access latest \
  --secret=DATABASE_URL_SECRET \
  --project=ff-restaurent \
  | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const u=new URL(s.trim());console.log('database='+decodeURIComponent(u.pathname.replace(/^\//,'')));console.log('user='+(u.username||''));console.log('host='+(u.hostname||'(none)'));console.log('socket='+(u.searchParams.get('host')||''));})"
```

Connect with that database name and user, then count the three tables the
audit asked about. `RestaurantEntry` is the restaurant table.

```bash
gcloud sql connect ff-restaurent-db \
  --project=ff-restaurent \
  --user=USER \
  --database=DATABASE
```

```sql
SELECT
  (SELECT count(*) FROM "Bill") AS bills,
  (SELECT count(*) FROM "RestaurantEntry") AS restaurants,
  (SELECT count(*) FROM "User") AS users;
```

## max_connections

Same session as the counts.

```sql
SHOW max_connections;
SELECT count(*) AS backends FROM pg_stat_activity;
```

```bash
gcloud sql instances describe ff-restaurent-db \
  --project=ff-restaurent \
  --format='yaml(settings.tier,settings.databaseFlags,settings.insightsConfig)'
```

Assumption used by the API until this number is filled in. Each API instance
appends `connection_limit=3` and `pool_timeout=10` when `DATABASE_URL` does
not already set them (`apps/api/src/lib/prisma-pool.ts`). The API deploy uses
`--max 3`, so the ceiling is 3 instances times 3 connections, plus the
release job while it runs. The Cloud SQL connection alert in
`scripts/harden-production-gcp.sh` fires when `num_backends` stays above 20
for 300 seconds. If `max_connections` is under about 20, lower
`connection_limit` before raising the instance count, and lower that alert
before `--apply`. `--min 1` stays off until the cold-start item below is
filled in.

## Backend-service timeout

`ff-restaurent-api-backend` exists only after
`scripts/harden-production-gcp.sh --apply`. If describe says the resource is
missing, record that and use the Cloud Run request timeout instead.

```bash
gcloud compute backend-services describe ff-restaurent-api-backend \
  --global \
  --project=ff-restaurent \
  --format='value(timeoutSec)'
```

```bash
gcloud run services describe ff-restaurent-api \
  --project=ff-restaurent \
  --region=asia-east1 \
  --format='value(spec.template.spec.timeoutSeconds)'
```

## Pending notifications

Same database session. This is push work still `PENDING` after 10 minutes.

```sql
SELECT count(*) AS pending_older_than_10_minutes
FROM "Notification"
WHERE "pushStatus" = 'PENDING'
  AND "createdAt" < now() - interval '10 minutes';
```

## Cold-start P95

`run.googleapis.com/container/startup_latencies` is a distribution. This
asks Cloud Monitoring for the 95th percentile on the production API service.
`--min 1` is not enabled. This measurement is the one that would justify it.

```bash
gcloud monitoring time-series list \
  --project=ff-restaurent \
  --filter='metric.type="run.googleapis.com/container/startup_latencies" AND resource.type="cloud_run_revision" AND resource.labels.service_name="ff-restaurent-api" AND resource.labels.location="asia-east1"' \
  --interval-start-time="$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --interval-end-time="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --aggregation-alignment-period=86400s \
  --aggregation-per-series-aligner=ALIGN_PERCENTILE_95 \
  --aggregation-cross-series-reducer=REDUCE_MAX \
  --aggregation-group-by-fields=resource.labels.service_name
```

If the aligner is rejected, open Metrics Explorer on the same metric and
service and read the 95th percentile. Record that number. Do not guess it.

## Custom domain versus run.app

The web image build sets `VITE_API_URL` from the API service `status.url`
(`.github/workflows/gcp-deploy.yml`). That value is the Cloud Run hostname,
`*.run.app`, at the moment the web image is built. A later custom domain does
not change an image that was already built.

```bash
gcloud run services describe ff-restaurent-api \
  --project=ff-restaurent \
  --region=asia-east1 \
  --format='value(status.url)'

gcloud run services describe ff-restaurent-web \
  --project=ff-restaurent \
  --region=asia-east1 \
  --format='value(status.url)'

gcloud run domain-mappings list \
  --project=ff-restaurent \
  --region=asia-east1
```

Then see which origin the deployed bundle actually calls. Both services are
deployed with `--allow-unauthenticated`.

```bash
WEB_URL="$(gcloud run services describe ff-restaurent-web \
  --project=ff-restaurent --region=asia-east1 --format='value(status.url)')"
ASSET="$(curl -fsS "$WEB_URL/" | grep -oE '/assets/[^"]+\.js' | head -n 1)"
curl -fsS "$WEB_URL$ASSET" | grep -oE 'https://[^"'\'' ]+' | sort -u
```

Record whether those URLs are the `run.app` host or a custom domain.

## Bucket sizes

Object sizes in `ff-public-images` are the check written in
[Public Image Object Sizes](./public-image-object-sizes.md). Run that page.
This one does not repeat the SQL and does not have the totals.

## Shared NAT IP

`gcp-deploy.yml` does not attach a VPC connector. Confirm the live service
and whether any address in the project is a NAT address.

```bash
gcloud run services describe ff-restaurent-api \
  --project=ff-restaurent \
  --region=asia-east1 \
  --format='yaml(spec.template.metadata.annotations,spec.template.spec.vpcAccess)'

gcloud compute networks vpc-access connectors list \
  --project=ff-restaurent \
  --region=asia-east1

gcloud compute addresses list \
  --project=ff-restaurent \
  --filter='purpose:NAT OR purpose:NAT_AUTO'

gcloud compute routers list --project=ff-restaurent
```

If `vpcAccess` is empty and the address list has no NAT address, this project
does not own a shared NAT IP. Cloud Run is then using Google-managed egress.
If a connector is present, list its Cloud NAT addresses and which other
services use that connector before calling the egress shared.
