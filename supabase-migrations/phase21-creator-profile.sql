-- Phase 21: Creator Profile (username, bio)
-- Run in Supabase SQL Editor

alter table public.profiles
  add column if not exists username text unique,
  add column if not exists bio text,
  add column if not exists display_name text;

create index if not exists profiles_username_idx on public.profiles(username);

-- Allow public read of username, display_name, bio for creator profiles
create policy "Anyone can read creator profiles by username"
  on public.profiles for select
  using (username is not null);

-- Allow reading tool usage for users with public creator profiles (for /creator/[username])
create policy "Anyone can read history for public creators"
  on public.generation_history for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = generation_history.user_id and p.username is not null
    )
  );
