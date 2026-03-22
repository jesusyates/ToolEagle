-- V100.1 — Supporter system: donation ledger (API-only via service role; RLS blocks direct client access)

create table if not exists public.donation_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  amount numeric(12, 2),
  created_at timestamptz not null default now(),
  source_page text,
  thank_you_message text
);

comment on table public.donation_ledger is 'V100.1 donations; user_id = te_supporter_id (anon) or profiles id as text';

create index if not exists donation_ledger_user_id_idx on public.donation_ledger (user_id);
create index if not exists donation_ledger_created_idx on public.donation_ledger (created_at desc);

alter table public.donation_ledger enable row level security;

-- No direct Supabase client access; Next.js API uses service role.
drop policy if exists donation_ledger_no_access on public.donation_ledger;
create policy donation_ledger_no_access on public.donation_ledger
  for all
  using (false)
  with check (false);
