-- Phase 20: Creator Blog (Lightweight)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- blog_posts: platform articles + user submissions (UGC)
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  content text not null,
  description text,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'ToolEagle',
  status text not null default 'draft' check (status in ('draft', 'published')),
  category text,
  tags text[] default '{}',
  recommended_tools text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(slug)
);

create index if not exists blog_posts_slug_idx on public.blog_posts(slug);
create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_author_id_idx on public.blog_posts(author_id);
create index if not exists blog_posts_created_at_idx on public.blog_posts(created_at desc);

alter table public.blog_posts enable row level security;

-- Anyone can read published posts
create policy "Anyone can read published posts"
  on public.blog_posts for select
  using (status = 'published');

-- Users can create their own posts (default draft)
create policy "Users can insert own posts"
  on public.blog_posts for insert
  with check (auth.uid() = author_id);

-- Users can update/delete their own posts
create policy "Users can update own posts"
  on public.blog_posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Users can delete own posts"
  on public.blog_posts for delete
  using (auth.uid() = author_id);

-- Trigger to update updated_at
create or replace function public.update_blog_posts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.update_blog_posts_updated_at();
