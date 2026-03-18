-- V67.1 Backlink Tracker - for distribution logging

create table if not exists public.backlinks (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  platform text not null check (platform in ('reddit', 'x', 'quora')),
  keyword text not null,
  created_at timestamptz not null default now()
);

create index if not exists backlinks_platform_idx on public.backlinks(platform);
create index if not exists backlinks_keyword_idx on public.backlinks(keyword);
create index if not exists backlinks_created_at_idx on public.backlinks(created_at);

alter table public.backlinks enable row level security;

-- Allow anonymous insert (from zh pages "我已发布" button)
create policy "Allow insert for backlinks"
  on public.backlinks for insert
  with check (true);

-- Allow read for authenticated users (dashboard)
create policy "Allow select for authenticated"
  on public.backlinks for select
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');
