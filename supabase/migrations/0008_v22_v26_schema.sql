-- ToolEagle v22-v26 Schema

-- v22: Add answer to user_saves
alter table public.user_saves add column if not exists answer_slug text;
alter table public.user_saves drop constraint if exists user_saves_example_or_tool;
alter table public.user_saves drop constraint if exists user_saves_item_type_check;
alter table public.user_saves add constraint user_saves_item_type_check
  check (item_type in ('caption', 'hook', 'example', 'answer'));
alter table public.user_saves add constraint user_saves_content_source check (
  (example_slug is not null and tool_slug is null and coalesce(answer_slug,'') = '') or
  (example_slug is null and tool_slug is not null and coalesce(answer_slug,'') = '') or
  (example_slug is null and tool_slug is null and answer_slug is not null and answer_slug != '')
);

-- v24: creator_stats (denormalized for performance)
create table if not exists public.creator_stats (
  username text primary key,
  followers_count int not null default 0,
  examples_count int not null default 0,
  likes_count int not null default 0,
  updated_at timestamptz not null default now()
);

-- v25: example_likes
create table if not exists public.example_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  example_slug text not null,
  created_at timestamptz not null default now(),
  constraint example_likes_unique unique (user_id, example_slug)
);
create index if not exists example_likes_example_idx on public.example_likes(example_slug);
alter table public.example_likes enable row level security;
create policy "Users can manage own likes" on public.example_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- public_examples: add source column for v23 auto-generation
alter table public.public_examples add column if not exists source text default 'submitted';
create index if not exists public_examples_source_idx on public.public_examples(source) where source is not null;
