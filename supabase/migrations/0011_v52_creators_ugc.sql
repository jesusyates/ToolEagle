-- v52: Creator Publishing Platform (UGC)
-- creators: creator profiles for UGC publishing
-- creator_posts: prompts, ideas, guides

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  avatar_url text,
  website text,
  twitter text,
  youtube text,
  created_at timestamptz not null default now()
);

create index if not exists creators_username_idx on public.creators(username);
create index if not exists creators_user_id_idx on public.creators(user_id);
alter table public.creators enable row level security;

create policy "Anyone can read creators"
  on public.creators for select using (true);

create policy "Users can insert own creator"
  on public.creators for insert
  with check (auth.uid() = user_id);

create policy "Users can update own creator"
  on public.creators for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- creator_posts: prompts, ideas, guides
create table if not exists public.creator_posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  type text not null check (type in ('prompt', 'idea', 'guide')),
  title text not null,
  content text not null,
  topic text,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  tags text[] default '{}',
  tools text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_posts_type_slug_unique unique (type, slug)
);

create index if not exists creator_posts_creator_id_idx on public.creator_posts(creator_id);
create index if not exists creator_posts_type_idx on public.creator_posts(type);
create index if not exists creator_posts_status_idx on public.creator_posts(status) where status = 'published';
create index if not exists creator_posts_topic_idx on public.creator_posts(topic) where topic is not null;
create index if not exists creator_posts_created_at_idx on public.creator_posts(created_at desc);
alter table public.creator_posts enable row level security;

create policy "Anyone can read published creator_posts"
  on public.creator_posts for select
  using (status = 'published');

create policy "Creators can manage own posts"
  on public.creator_posts for all
  using (
    exists (
      select 1 from public.creators c
      where c.id = creator_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.creators c
      where c.id = creator_id and c.user_id = auth.uid()
    )
  );
