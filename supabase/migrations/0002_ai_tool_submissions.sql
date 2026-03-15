-- AI tool submissions for /submit-ai-tool (backlink outreach)
create table if not exists public.ai_tool_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text not null,
  description text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_tool_submissions_created_at_idx on public.ai_tool_submissions(created_at);
alter table public.ai_tool_submissions enable row level security;

-- Allow anonymous inserts (public form)
create policy "Anyone can insert ai_tool_submissions"
  on public.ai_tool_submissions for insert
  with check (true);

-- Only authenticated users (admins) can read
create policy "Authenticated users can read ai_tool_submissions"
  on public.ai_tool_submissions for select
  using (auth.uid() is not null);
