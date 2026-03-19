-- V76.5: Add country column to tool_usage_events for future dashboards

alter table public.tool_usage_events
  add column if not exists country text;

create index if not exists tool_usage_events_country_idx on public.tool_usage_events(country);
