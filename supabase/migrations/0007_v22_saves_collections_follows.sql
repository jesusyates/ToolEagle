-- ToolEagle v22: Saves, Collections, Creator Follows

-- user_saves: unified save for captions, hooks, examples
create table if not exists public.user_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('caption', 'hook', 'example')),
  example_slug text,
  tool_slug text,
  tool_name text,
  content text not null,
  created_at timestamptz not null default now(),
  constraint user_saves_example_or_tool check (
    (example_slug is not null and tool_slug is null) or
    (example_slug is null and tool_slug is not null)
  )
);

create index if not exists user_saves_user_id_idx on public.user_saves(user_id);
create index if not exists user_saves_example_slug_idx on public.user_saves(example_slug) where example_slug is not null;
create unique index if not exists user_saves_user_example_unique on public.user_saves(user_id, example_slug) where example_slug is not null;
alter table public.user_saves enable row level security;

create policy "Users can manage own saves"
  on public.user_saves for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- collections: user-created collections
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint collections_user_slug_unique unique (user_id, slug)
);

create index if not exists collections_user_id_idx on public.collections(user_id);
alter table public.collections enable row level security;

create policy "Users can manage own collections"
  on public.collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- collection_items: saved items in collections
create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  save_id uuid not null references public.user_saves(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint collection_items_unique unique (collection_id, save_id)
);

create index if not exists collection_items_collection_id_idx on public.collection_items(collection_id);
alter table public.collection_items enable row level security;

create policy "Users can manage own collection items"
  on public.collection_items for all
  using (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
  );

-- user_follows: creator follow
create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_username text not null,
  created_at timestamptz not null default now(),
  constraint user_follows_unique unique (follower_id, following_username)
);

create index if not exists user_follows_follower_idx on public.user_follows(follower_id);
create index if not exists user_follows_following_idx on public.user_follows(following_username);
alter table public.user_follows enable row level security;

create policy "Users can manage own follows"
  on public.user_follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);
