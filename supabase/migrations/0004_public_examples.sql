-- UGC Examples: public_examples for /examples (v17)
-- Populated from generation_history when user opts in, or manually curated
create table if not exists public.public_examples (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  tool_name text not null,
  input text not null,
  result text not null,
  creator_username text,
  creator_id uuid references auth.users(id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'from_history')),
  created_at timestamptz not null default now()
);

create index if not exists public_examples_created_at_idx on public.public_examples(created_at);
create index if not exists public_examples_tool_slug_idx on public.public_examples(tool_slug);
alter table public.public_examples enable row level security;

-- Anyone can read (public examples)
create policy "Anyone can read public_examples"
  on public.public_examples for select
  using (true);

-- Authenticated users can insert their own (for "Share to Examples" flow)
create policy "Authenticated users can insert public_examples"
  on public.public_examples for insert
  with check (auth.uid() is not null and creator_id = auth.uid());

-- Service role or admin can manage (for manual curation from generation_history)
create policy "Users can delete own public_examples"
  on public.public_examples for delete
  using (auth.uid() = creator_id);
