-- Minimal admin ops log (single-article auto-generate, etc.). Service role inserts from API routes.

create table if not exists public.admin_run_logs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null,
  fail_reason text,
  title text,
  slug text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_run_logs_run_type_created
  on public.admin_run_logs (run_type, created_at desc);

alter table public.admin_run_logs enable row level security;
