-- Creator invites for /creator-invite
create table if not exists public.creator_invites (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  handle text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists creator_invites_created_at_idx on public.creator_invites(created_at);
alter table public.creator_invites enable row level security;

create policy "Anyone can insert creator_invites"
  on public.creator_invites for insert
  with check (true);

create policy "Authenticated users can read creator_invites"
  on public.creator_invites for select
  using (auth.uid() is not null);
