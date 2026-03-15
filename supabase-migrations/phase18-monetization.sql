-- Phase 18: Monetization Infrastructure
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Profiles: plan per user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_id_idx on public.profiles(id);
alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Usage stats: daily generation count
create table if not exists public.usage_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  generations_count int not null default 0,
  unique(user_id, date)
);

create index if not exists usage_stats_user_date_idx on public.usage_stats(user_id, date);
alter table public.usage_stats enable row level security;

create policy "Users can read own usage" on public.usage_stats for select using (auth.uid() = user_id);
create policy "Users can insert own usage" on public.usage_stats for insert with check (auth.uid() = user_id);
create policy "Users can update own usage" on public.usage_stats for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
