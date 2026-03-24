-- V115 — shared billing rebuild + unified protection support

alter table public.orders
  add column if not exists package_id text,
  add column if not exists credits_total int,
  add column if not exists expire_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders
  add constraint orders_order_type_check
  check (order_type in ('credits', 'donation'));

create table if not exists public.anonymous_credit_wallets (
  anonymous_user_id text primary key,
  total_credits int not null default 0,
  remaining_credits int not null default 0,
  expire_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists anonymous_credit_wallets_expire_idx
  on public.anonymous_credit_wallets (expire_at);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  event_type text not null,
  provider text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_order_created_idx
  on public.payment_events (order_id, created_at desc);

alter table public.credit_usage_logs
  add column if not exists market text,
  add column if not exists tool text,
  add column if not exists request_type text;

update public.credit_usage_logs
set market = coalesce(market, 'global'),
    tool = coalesce(tool, tool_slug, 'post_package'),
    request_type = coalesce(request_type, 'generate_package')
where market is null or tool is null or request_type is null;

alter table public.credit_usage_logs
  alter column market set default 'global',
  alter column request_type set default 'generate_package';

alter table public.credit_usage_logs
  alter column market set not null,
  alter column tool set not null,
  alter column request_type set not null;

