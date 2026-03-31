-- v200: Add market column for strict multi-market isolation
-- Goal: avoid cross-market pollution between future country dashboards.

-- 1) favorites: user saved results
alter table public.favorites
  add column if not exists market text not null default 'global';

-- 2) generation_history: user generation logs
alter table public.generation_history
  add column if not exists market text not null default 'global';

-- Backfill existing CN tool records (currently all CN-only tools are douyin-*)
update public.favorites
set market = 'cn'
where tool_slug like 'douyin-%';

update public.generation_history
set market = 'cn'
where tool_slug like 'douyin-%';

-- Helpful indexes for per-market dashboard queries
create index if not exists favorites_user_market_idx on public.favorites(user_id, market);
create index if not exists generation_history_user_market_idx on public.generation_history(user_id, market);

