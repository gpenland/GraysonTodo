# Grayson Todo

A minimal todo list app with optional image attachments. Built as a demo for
comparing a consolidated PaaS (Sevalla) against a scattered multi-vendor
stack (Vercel + Supabase) — the same codebase deploys unmodified to both,
driven entirely by environment variables.

## Stack

- Next.js (App Router, TypeScript)
- Postgres for todo storage
- S3-compatible object storage for images

## Local setup

```bash
npm install
```

1. Create a Postgres database and run the migration:

   ```bash
   psql "$DATABASE_URL" -f migrations/0001_init.sql
   # or, using the app's own pg dependency:
   npm run migrate
   ```

   Note: `gen_random_uuid()` requires the `pgcrypto` extension. The
   migration enables it (`create extension if not exists pgcrypto`), which
   requires a role with sufficient privileges — this is already enabled by
   default on Supabase and most managed Postgres providers.

   On platforms where the database has no public endpoint (e.g. Sevalla's
   managed Postgres, reachable only from inside the cluster), run
   `npm run migrate` as a one-off job process instead of `psql` from your
   local machine.

2. Copy `.env.example` to `.env.local` and fill in your values.

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000.

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `S3_REGION` | S3-compatible region (e.g. `auto` for R2) |
| `S3_ACCESS_KEY_ID` | Access key for the bucket |
| `S3_SECRET_ACCESS_KEY` | Secret key for the bucket |
| `S3_BUCKET_NAME` | Bucket name |
| `S3_ENDPOINT` | S3-compatible **API** endpoint URL, used for signing presigned upload URLs (no trailing slash) |
| `S3_PUBLIC_URL_BASE` | **Public** base URL objects are read from in the browser (no trailing slash) — see below for why this is separate from `S3_ENDPOINT` |

### Sevalla

```bash
DATABASE_URL=<Sevalla managed Postgres connection string>
S3_REGION=auto
S3_ACCESS_KEY_ID=<Sevalla R2-backed object storage access key>
S3_SECRET_ACCESS_KEY=<Sevalla R2-backed object storage secret key>
S3_BUCKET_NAME=<bucket name>
S3_ENDPOINT=<Sevalla object storage endpoint, e.g. https://<account-id>.r2.cloudflarestorage.com>
S3_PUBLIC_URL_BASE=<Sevalla bucket's public CDN domain, e.g. https://<bucket-name>.sevalla.storage>
```

The bucket must be created with public access enabled (Sevalla dashboard:
Object Storage → bucket → enable public domain) to get the
`S3_PUBLIC_URL_BASE` value. You'll also need a CORS policy on the bucket
allowing `GET`/`PUT` from your app's domain — uploads happen as a direct
browser → R2 request, and without CORS the browser's preflight is rejected
before the upload ever starts.

### Vercel + Supabase

```bash
DATABASE_URL=<Supabase Postgres connection string>
S3_REGION=<Supabase/AWS storage region>
S3_ACCESS_KEY_ID=<Supabase S3-compatible access key>
S3_SECRET_ACCESS_KEY=<Supabase S3-compatible secret key>
S3_BUCKET_NAME=<bucket name>
S3_ENDPOINT=<Supabase S3-compatible storage endpoint>
S3_PUBLIC_URL_BASE=https://<project-ref>.supabase.co/storage/v1/object/public/<bucket-name>
```

Make the bucket public in the Supabase dashboard (Storage → bucket →
Public bucket), and add your app's domain to the bucket's CORS
configuration for `GET`/`PUT` — same reasoning as Sevalla above.

## How image upload works

1. Client calls `POST /api/upload-url` with `{ filename, contentType }`.
2. Server returns a presigned `PUT` URL (signed against `S3_ENDPOINT`) plus
   the object's public URL, built as `${S3_PUBLIC_URL_BASE}/<key>`.
3. Client `PUT`s the file directly to the presigned URL, then creates the
   todo with `image_url` set to the returned public URL.

`S3_ENDPOINT` and `S3_PUBLIC_URL_BASE` are deliberately two different
variables: neither Cloudflare R2 (Sevalla) nor Supabase Storage serve public
reads from their raw S3 API endpoint — `GET`s against that endpoint require
a signed request, confirmed by testing against a live Sevalla deployment
(plain `GET`s on the S3-endpoint-based URL returned `400`). Each provider
instead exposes a separate public/CDN domain for reads, which is what
`S3_PUBLIC_URL_BASE` should point to.

## Latency instrumentation

Every API route measures real Postgres query time server-side
(`src/lib/db.ts`'s `timedQuery` helper) and returns it as `dbMs` in the
response. The frontend shows the most recent value in the page footer
(`db: NNms`).

## Testing notes

Verified end-to-end against a live Sevalla deployment: full `todos` CRUD
against real Postgres (with real, sub-5ms `dbMs` values over the internal
cluster network), and the full image upload flow (presigned `PUT` from a
browser origin → object readable via `S3_PUBLIC_URL_BASE`). Not yet
exercised against a Vercel + Supabase deployment — the env vars above
should carry over directly, but confirm the CORS and public-bucket setup
notes above when standing that side up.

## API routes

- `GET /api/todos` — list all todos, newest first
- `POST /api/todos` — create a todo (`{ text, image_url? }`)
- `PATCH /api/todos/:id` — update `completed` and/or `text`
- `DELETE /api/todos/:id` — delete a todo
- `POST /api/upload-url` — get a presigned upload URL (`{ filename, contentType }`)
