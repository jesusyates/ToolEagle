-- Phase 19: Creator Workflow Engine
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Projects: user projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
alter table public.projects enable row level security;

create policy "Users can manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Project items: content within projects
create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null,
  type text not null default 'text',
  created_at timestamptz not null default now()
);

create index if not exists project_items_project_id_idx on public.project_items(project_id);
alter table public.project_items enable row level security;

create policy "Users can manage own project items"
  on public.project_items for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
