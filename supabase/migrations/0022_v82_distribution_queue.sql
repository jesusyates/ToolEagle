-- V82: Distribution queue for auto-generated share content

create table if not exists public.distribution_queue (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  page_type text not null check (page_type in ('zh-search', 'en-how-to')),
  title text not null,
  one_liner text,
  page_url text not null,
  reddit_title text,
  reddit_body text,
  x_thread text,
  quora_answer text,
  status text not null default 'pending' check (status in ('pending', 'posted')),
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists distribution_queue_status_idx on public.distribution_queue(status);
create index if not exists distribution_queue_created_at_idx on public.distribution_queue(created_at desc);
create index if not exists distribution_queue_slug_idx on public.distribution_queue(slug);
create unique index if not exists distribution_queue_slug_page_type_idx on public.distribution_queue(slug, page_type);

alter table public.distribution_queue enable row level security;

-- Allow all for service role (scripts use direct DB connection)
create policy "Service role can manage distribution_queue"
  on public.distribution_queue for all
  using (auth.role() = 'service_role');

-- Authenticated users can read and update (mark as posted)
create policy "Authenticated can read distribution_queue"
  on public.distribution_queue for select
  using (auth.uid() is not null);

create policy "Authenticated can update distribution_queue"
  on public.distribution_queue for update
  using (auth.uid() is not null);
