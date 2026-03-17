-- V64 Monetization Engine: leads + zh_analytics

-- leads: email capture from zh pages (no auth required)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  keyword text,
  created_at timestamptz not null default now()
);

create index if not exists leads_email_idx on public.leads(email);
create index if not exists leads_created_at_idx on public.leads(created_at);
alter table public.leads enable row level security;

-- Allow anonymous insert for lead capture (from zh CTA)
create policy "Allow insert for leads"
  on public.leads for insert
  with check (true);

-- zh_analytics: track tool_click, email_submit, page_view
create table if not exists public.zh_analytics (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('tool_click', 'email_submit', 'page_view')),
  event_data jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists zh_analytics_event_type_idx on public.zh_analytics(event_type);
create index if not exists zh_analytics_created_at_idx on public.zh_analytics(created_at);
alter table public.zh_analytics enable row level security;

-- Allow anonymous insert for analytics
create policy "Allow insert for zh_analytics"
  on public.zh_analytics for insert
  with check (true);
