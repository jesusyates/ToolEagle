-- Auth abuse audit (service-role inserts from API routes only).

create table if not exists public.auth_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  email text,
  ip text,
  user_agent text,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_audit_log_action_created
  on public.auth_audit_log (action, created_at desc);

create index if not exists idx_auth_audit_log_email_created
  on public.auth_audit_log (email, created_at desc);

alter table public.auth_audit_log enable row level security;
