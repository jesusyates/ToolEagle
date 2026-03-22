-- V81: UGC Entry - Submit your result for future SEO pages

create table if not exists public.ugc_submissions (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  tool_name text not null,
  content text not null,
  example_result text,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists ugc_submissions_tool_slug_idx on public.ugc_submissions(tool_slug);
create index if not exists ugc_submissions_status_idx on public.ugc_submissions(status);
create index if not exists ugc_submissions_created_at_idx on public.ugc_submissions(created_at desc);

alter table public.ugc_submissions enable row level security;

create policy "Allow insert for ugc_submissions"
  on public.ugc_submissions for insert
  with check (true);

create policy "Service role can manage ugc_submissions"
  on public.ugc_submissions for all
  using (auth.role() = 'service_role');
