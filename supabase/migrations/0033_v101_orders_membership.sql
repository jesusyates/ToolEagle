-- V101 — CN aggregator (and global) checkout orders + Pro entitlement for anonymous browsers

alter table public.profiles
  add column if not exists plan_expire_at timestamptz;

comment on column public.profiles.plan_expire_at is 'When set and in the past, Pro is treated as expired. NULL with plan=pro = legacy unlimited Pro.';

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  anonymous_user_id text,
  market text not null check (market in ('cn', 'global')),
  amount numeric(12, 2) not null,
  currency text not null check (currency in ('CNY', 'USD')),
  plan text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider text not null,
  provider_order_ref text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint orders_identity_chk check (
    user_id is not null
    or anonymous_user_id is not null
  )
);

create index if not exists orders_order_id_idx on public.orders (order_id);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_user_id_idx on public.orders (user_id) where user_id is not null;
create index if not exists orders_anon_idx on public.orders (anonymous_user_id) where anonymous_user_id is not null;

create table if not exists public.anonymous_pro_entitlements (
  anonymous_user_id text primary key,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  last_order_id uuid references public.orders (id) on delete set null
);

create index if not exists anonymous_pro_entitlements_expires_idx
  on public.anonymous_pro_entitlements (expires_at);

alter table public.orders enable row level security;
alter table public.anonymous_pro_entitlements enable row level security;
