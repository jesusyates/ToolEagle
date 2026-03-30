-- V196 — Content Memory Layer (same as supabase-migrations/phase23-content-memory.sql)
-- Applied via: npm run v196:migrate  OR  npm run db:migrate  (requires SUPABASE_DB_URL)

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  anonymous_id text not null,
  tool_type text not null,
  platform text not null,
  input_text text not null,
  generated_output jsonb not null,
  chain_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists content_items_anonymous_id_idx on public.content_items(anonymous_id);
create index if not exists content_items_chain_session_id_idx on public.content_items(chain_session_id);
create index if not exists content_items_tool_type_idx on public.content_items(tool_type);

create table if not exists public.content_events (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists content_events_content_id_idx on public.content_events(content_id);
