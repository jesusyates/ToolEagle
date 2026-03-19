-- V73 Distribution Domination: distribution_posts for post tracking

create table if not exists public.distribution_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('reddit', 'x', 'quora')),
  keyword text not null,
  post_created_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists distribution_posts_user_id_idx on public.distribution_posts(user_id);
create index if not exists distribution_posts_platform_idx on public.distribution_posts(platform);
create index if not exists distribution_posts_keyword_idx on public.distribution_posts(keyword);
create index if not exists distribution_posts_post_created_at_idx on public.distribution_posts(post_created_at desc);
alter table public.distribution_posts enable row level security;

-- RLS: users can only see/insert their own posts
create policy "Users can insert own distribution_posts"
  on public.distribution_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can select own distribution_posts"
  on public.distribution_posts for select
  using (auth.uid() = user_id);
