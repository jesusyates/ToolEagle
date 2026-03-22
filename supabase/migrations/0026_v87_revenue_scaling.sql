-- V87: Revenue Scaling - High priority distribution, expansion tracking

-- Add high_priority to distribution_queue for top money pages
alter table public.distribution_queue
  add column if not exists high_priority boolean not null default false;

create index if not exists distribution_queue_high_priority_idx
  on public.distribution_queue(high_priority) where high_priority = true;

-- revenue_expansion_candidates: track pages generated from winners
create table if not exists public.revenue_expansion_candidates (
  id uuid primary key default gen_random_uuid(),
  source_keyword text not null,
  expanded_keyword text not null,
  slug text not null unique,
  platform text,
  goal text,
  status text not null default 'pending' check (status in ('pending', 'generated', 'published')),
  created_at timestamptz not null default now()
);

create index if not exists revenue_expansion_source_idx on public.revenue_expansion_candidates(source_keyword);
create index if not exists revenue_expansion_status_idx on public.revenue_expansion_candidates(status);
alter table public.revenue_expansion_candidates enable row level security;

create policy "Service role can manage revenue_expansion_candidates"
  on public.revenue_expansion_candidates for all
  using (auth.role() = 'service_role');

create policy "Authenticated can read revenue_expansion_candidates"
  on public.revenue_expansion_candidates for select
  using (auth.uid() is not null);
