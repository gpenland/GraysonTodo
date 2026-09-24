Build a minimal todo list app with optional image attachments per item. This is a
demo app for a blog article comparing a consolidated PaaS (Sevalla) against a
scattered multi-vendor stack (Vercel + Supabase). The SAME codebase must deploy
unmodified to both, driven entirely by environment variables. This is deliberately
the smallest possible build — do not add anything beyond what's listed below.

STACK
- Next.js (App Router, TypeScript)
- Postgres for todo storage
- S3-compatible object storage for images (via @aws-sdk/client-s3 +
  @aws-sdk/s3-request-presigner)

REQUIREMENTS

1. Schema (provide as a SQL migration file):
   todos (
     id uuid primary key default gen_random_uuid(),
     text text not null,
     completed boolean not null default false,
     image_url text,
     created_at timestamptz not null default now()
   )

2. API routes (plain Next.js route handlers, no WebSocket):
   - GET    /api/todos        — list all todos, newest first
   - POST   /api/todos        — create a todo ({ text, image_url? })
   - PATCH  /api/todos/:id    — update completed and/or text
   - DELETE /api/todos/:id    — delete a todo
   Connect via DATABASE_URL only — must work unmodified against both Supabase
   Postgres and Sevalla's managed Postgres.

3. Image upload: one route, POST /api/upload-url, accepts a filename + content-type
   and returns a presigned PUT URL. The client uploads the image directly to that
   URL, then includes the resulting object URL when creating the todo. Configure
   entirely via S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME,
   S3_ENDPOINT — must work unmodified against Sevalla's R2-backed object storage
   and Supabase or AWS Storage's S3-compatible endpoint.

4. Frontend: single page. A list of todos (checkbox to toggle complete, text,
   optional thumbnail, delete button), a text input + "add" button, and an image
   attach control on the add form. Plain fetch calls to the API routes above — no
   polling, no live updates. A todo list does not need to update in real time.

5. Latency instrumentation: time every Postgres query server-side (wrap the query call,
   measure elapsed ms) and return it in the API response (e.g. a `dbMs` field).
   Render it as a small, unobtrusive number next to each todo or in a page footer
   (e.g. "db: 42ms"). This must reflect a real measured value.

6. Ship a .env.example documenting every variable.

DELIVERABLE
Working code, a short README with local setup steps, both deployment env-var sets
(Sevalla / Vercel+Supabase), and the SQL migration file.

PHASE 1: Build
PHASE 2: Test
PHASE 3: Push to Github
