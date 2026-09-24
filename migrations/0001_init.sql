-- gen_random_uuid() requires pgcrypto. Enabled by default on Supabase and
-- most managed Postgres providers; safe to run even if already enabled.
create extension if not exists pgcrypto;

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  completed boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);
