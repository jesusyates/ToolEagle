-- V71 Traffic Explosion: tool_usage_events for tool_generate, tool_copy tracking

create table if not exists public.tool_usage_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('tool_generate', 'tool_copy')),
  tool_slug text not null,
  tool_category text,
  created_at timestamptz not null default now()
);

create index if not exists tool_usage_events_event_type_idx on public.tool_usage_events(event_type);
create index if not exists tool_usage_events_tool_slug_idx on public.tool_usage_events(tool_slug);
create index if not exists tool_usage_events_created_at_idx on public.tool_usage_events(created_at desc);
alter table public.tool_usage_events enable row level security;
