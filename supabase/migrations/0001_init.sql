-- ToolEagle: Initial schema
-- Tables: profiles, favorites, generation_history, usage_stats, projects, project_items

-- profiles: extends auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_id_idx on public.profiles(id);
alter table public.profiles enable row level security;

create policy "Users can manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- favorites: user saved content
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

-- generation_history: AI generation logs
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

-- usage_stats: daily generation count per user
create table if not exists public.usage_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  generations_count int not null default 0,
  constraint usage_stats_user_date_unique unique (user_id, date)
);

create index if not exists usage_stats_user_date_idx on public.usage_stats(user_id, date);
alter table public.usage_stats enable row level security;

create policy "Users can manage own usage"
  on public.usage_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- projects: user projects
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

-- project_items: content within projects
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
