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
| `S3_ENDPOINT` | S3-compatible endpoint URL (no trailing slash) |

### Sevalla

```bash
DATABASE_URL=<Sevalla managed Postgres connection string>
S3_REGION=auto
S3_ACCESS_KEY_ID=<Sevalla R2-backed object storage access key>
S3_SECRET_ACCESS_KEY=<Sevalla R2-backed object storage secret key>
S3_BUCKET_NAME=<bucket name>
S3_ENDPOINT=<Sevalla object storage endpoint>
```

### Vercel + Supabase

```bash
DATABASE_URL=<Supabase Postgres connection string>
S3_REGION=<Supabase/AWS storage region>
S3_ACCESS_KEY_ID=<Supabase S3-compatible access key>
S3_SECRET_ACCESS_KEY=<Supabase S3-compatible secret key>
S3_BUCKET_NAME=<bucket name>
S3_ENDPOINT=<Supabase S3-compatible storage endpoint>
```

## How image upload works

1. Client calls `POST /api/upload-url` with `{ filename, contentType }`.
2. Server returns a presigned `PUT` URL plus the object's final public URL
   (`{S3_ENDPOINT}/{S3_BUCKET_NAME}/{key}`, path-style).
3. Client `PUT`s the file directly to the presigned URL, then creates the
   todo with `image_url` set to the returned object URL.

This assumes the bucket allows public read access and the endpoint supports
path-style addressing (true for R2 and most S3-compatible providers). If
your provider requires a separate public/CDN domain for reads, you'll need
to adjust `publicObjectUrl` in `src/lib/s3.ts`.

## Latency instrumentation

Every API route measures real Postgres query time server-side
(`src/lib/db.ts`'s `timedQuery` helper) and returns it as `dbMs` in the
response. The frontend shows the most recent value in the page footer
(`db: NNms`).

## Testing notes

This build was verified locally via typecheck, production build, and dev
server checks (see below), but **not** exercised against live Postgres or
S3-compatible storage — no credentials were available in the environment
this was built in. Before relying on it, run against real infra and verify:

- `GET/POST /api/todos` and `PATCH/DELETE /api/todos/:id` against a real
  database.
- The full upload flow (`POST /api/upload-url` → `PUT` to the presigned URL
  → todo creation) against a real bucket, and that the resulting
  `image_url` is publicly readable.
- That `dbMs` values look sane end-to-end.

## API routes

- `GET /api/todos` — list all todos, newest first
- `POST /api/todos` — create a todo (`{ text, image_url? }`)
- `PATCH /api/todos/:id` — update `completed` and/or `text`
- `DELETE /api/todos/:id` — delete a todo
- `POST /api/upload-url` — get a presigned upload URL (`{ filename, contentType }`)
