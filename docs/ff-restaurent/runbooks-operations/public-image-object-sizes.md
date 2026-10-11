---
id: public-image-object-sizes
title: Public Image Object Sizes
sidebar_label: Public Image Object Sizes
sidebar_position: 8
description: Operator check for object counts and sizes in the public images Supabase bucket, before and after WebP conversion on upload.
---

# Public image object sizes

:::note

Source: `wiki/Public-Image-Object-Sizes.md` on the [`docs/roadmap-and-wiki`](https://github.com/newtc22222/ff-restaurent/tree/docs/roadmap-and-wiki) branch (snapshot `702f576`). It was moved off `develop` by [#172](https://github.com/newtc22222/ff-restaurent/pull/172) and was written with the [v2.4.5](../releases/release-v2.4.5.md) performance and safety follow-up (#165).

:::

This page is the operator check for the `ff-public-images` Supabase bucket.
It was written with #162 and was **not executed**. Do not invent the counts.
New public uploads are stored as WebP with neither edge above 1600 px. Objects
already in the bucket are left as they are, so a snapshot taken before that
release is the useful before number.

Use the Supabase project that backs production (or staging, if that is the
bucket you mean). The service-role key is API-only. Do not print it, and do
not commit the query output if it contains object names you would not share.

## SQL

Run this in the Supabase SQL editor. The `postgres` role can read
`storage.objects`. `metadata.size` is the stored byte length.

```sql
SELECT
  count(*) AS objects,
  count(*) FILTER (WHERE metadata->>'size' IS NULL) AS missing_size,
  coalesce(sum((metadata->>'size')::bigint), 0) AS total_bytes,
  coalesce(max((metadata->>'size')::bigint), 0) AS largest_bytes,
  coalesce(round(avg((metadata->>'size')::bigint)), 0) AS average_bytes
FROM storage.objects
WHERE bucket_id = 'ff-public-images';
```

```sql
SELECT
  coalesce(metadata->>'mimetype', '(none)') AS mime,
  count(*) AS objects,
  coalesce(sum((metadata->>'size')::bigint), 0) AS total_bytes,
  coalesce(max((metadata->>'size')::bigint), 0) AS largest_bytes
FROM storage.objects
WHERE bucket_id = 'ff-public-images'
GROUP BY 1
ORDER BY total_bytes DESC;
```

```sql
SELECT
  name,
  (metadata->>'size')::bigint AS size_bytes,
  metadata->>'mimetype' AS mime,
  created_at
FROM storage.objects
WHERE bucket_id = 'ff-public-images'
ORDER BY size_bytes DESC NULLS LAST
LIMIT 50;
```

Record `objects`, `total_bytes`, `largest_bytes`, and the mime breakdown.
Those are the current sizes. This repository does not have them.

## Storage API

Use this when the SQL role cannot read `storage.objects`. Set
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the shell first. Page with
`offset` until the response is `[]`. Each object includes `metadata.size`.

```bash
curl -sS "$SUPABASE_URL/storage/v1/object/list/ff-public-images" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prefix":"","limit":1000,"offset":0,"sortBy":{"column":"name","order":"asc"}}'
```

Sum `metadata.size` across every page. Do not echo the service-role key.
