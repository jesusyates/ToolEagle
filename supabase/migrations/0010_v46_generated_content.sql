-- v46: AI Content Factory - generated_content table
create table if not exists public.generated_content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('caption', 'hook', 'idea', 'prompt')),
  topic text not null,
  content text not null,
  source text not null default 'ai' check (source in ('ai', 'creator')),
  platform text,
  created_at timestamptz not null default now()
);

create index if not exists generated_content_type_idx on public.generated_content(type);
create index if not exists generated_content_topic_idx on public.generated_content(topic);
create index if not exists generated_content_created_at_idx on public.generated_content(created_at);

alter table public.generated_content enable row level security;

create policy "Anyone can read generated_content"
  on public.generated_content for select
  using (true);

-- Insert via service role only (cron/API uses createAdminClient which bypasses RLS)
