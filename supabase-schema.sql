-- Run this in Supabase SQL Editor to create tables for Phase 17
-- https://supabase.com/dashboard/project/_/sql

-- Favorites: user_id from auth.users
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  tool_name text not null,
  text text not null,
  saved_at timestamptz not null default now()
);

create index if not exists favorites_user_id_idx on public.favorites(user_id);

alter table public.favorites enable row level security;

create policy "Users can manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Generation history
create table if not exists public.generation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  tool_name text not null,
  input text not null,
  items jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists generation_history_user_id_idx on public.generation_history(user_id);

alter table public.generation_history enable row level security;

create policy "Users can manage own history"
  on public.generation_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
