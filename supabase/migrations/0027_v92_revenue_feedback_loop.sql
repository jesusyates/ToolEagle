-- V92: Revenue feedback loop — traffic events, attribution, injection weight, outbound queue, distribution failed status

-- 1) Money page injection weight (higher → more exposure in traffic-injection ordering)
alter table public.zh_page_revenue_metrics
  add column if not exists injection_weight numeric(10, 4) not null default 1;

create index if not exists zh_page_revenue_metrics_injection_weight_idx
  on public.zh_page_revenue_metrics (injection_weight desc);

-- 2) traffic_events — click / navigation attribution
create table if not exists public.traffic_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  source text not null,
  page text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists traffic_events_created_at_idx on public.traffic_events (created_at desc);
create index if not exists traffic_events_source_idx on public.traffic_events (source);
create index if not exists traffic_events_page_idx on public.traffic_events (page);

alter table public.traffic_events enable row level security;

create policy "traffic_events_insert_any"
  on public.traffic_events for insert
  with check (true);

create policy "traffic_events_select_own"
  on public.traffic_events for select
  using (auth.uid() is not null and (user_id = auth.uid() or user_id is null));

-- 3) revenue_attribution — optional granular attribution rows (dashboard / reports)
create table if not exists public.revenue_attribution (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  revenue numeric(12, 2) not null default 0,
  source text,
  tool text,
  created_at timestamptz not null default now()
);

create index if not exists revenue_attribution_created_at_idx on public.revenue_attribution (created_at desc);
create index if not exists revenue_attribution_page_idx on public.revenue_attribution (page);

alter table public.revenue_attribution enable row level security;

create policy "revenue_attribution_insert_authenticated"
  on public.revenue_attribution for insert
  with check (auth.uid() is not null);

create policy "revenue_attribution_select_authenticated"
  on public.revenue_attribution for select
  using (auth.uid() is not null);

-- 4) distribution_queue: allow failed status (drop only status-related check)
do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'distribution_queue' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%status%'
  loop
    execute format('alter table public.distribution_queue drop constraint %I', cname);
  end loop;
end $$;

alter table public.distribution_queue
  add constraint distribution_queue_status_check
  check (status in ('pending', 'posted', 'failed'));

-- 5) Simpler per-spec queue: platform + content (user-scoped)
create table if not exists public.distribution_outbound_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('reddit', 'x', 'quora')),
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'posted', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists distribution_outbound_queue_user_status_idx
  on public.distribution_outbound_queue (user_id, status);

alter table public.distribution_outbound_queue enable row level security;

create policy "distribution_outbound_own_select"
  on public.distribution_outbound_queue for select
  using (auth.uid() = user_id);

create policy "distribution_outbound_own_insert"
  on public.distribution_outbound_queue for insert
  with check (auth.uid() = user_id);

create policy "distribution_outbound_own_update"
  on public.distribution_outbound_queue for update
  using (auth.uid() = user_id);
