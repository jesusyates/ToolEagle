-- V107 — CN credits: balance + validity + usage logs (按量计费)

-- 1) user_credits — one row per auth user OR anonymous supporter id
create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  anonymous_user_id text,
  total_credits int not null default 0,
  remaining_credits int not null default 0,
  expire_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint user_credits_identity_chk check (
    (user_id is not null and anonymous_user_id is null)
    or (user_id is null and anonymous_user_id is not null)
  )
);

create unique index if not exists user_credits_user_unique
  on public.user_credits (user_id) where user_id is not null;
create unique index if not exists user_credits_anon_unique
  on public.user_credits (anonymous_user_id) where anonymous_user_id is not null;

comment on table public.user_credits is 'CN market: prepaid generation credits with expiry.';

alter table public.user_credits enable row level security;

-- 2) credit_usage_logs
create table if not exists public.credit_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  anonymous_user_id text,
  tool_slug text not null default '',
  credits_used int not null,
  remaining_after int not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_usage_logs_user_created_idx
  on public.credit_usage_logs (user_id, created_at desc)
  where user_id is not null;
create index if not exists credit_usage_logs_anon_created_idx
  on public.credit_usage_logs (anonymous_user_id, created_at desc)
  where anonymous_user_id is not null;

alter table public.credit_usage_logs enable row level security;

-- 3) orders — snapshot fields for credit pack purchases
alter table public.orders
  add column if not exists credits_total int,
  add column if not exists credits_remaining int,
  add column if not exists credits_expire_at timestamptz;

comment on column public.orders.credits_total is 'Credits granted by this order (snapshot at payment).';
comment on column public.orders.credits_remaining is 'Same as credits_total at purchase time (audit).';
comment on column public.orders.credits_expire_at is 'Expiry applied to user_credits pool from this order.';

-- 4) Extend order_type for credit packs
alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders
  add constraint orders_order_type_check
  check (order_type in ('pro', 'donation', 'credits'));

-- 5) Legacy Pro → 1000 credits (one-time; safe to re-run: only inserts missing rows)
insert into public.user_credits (user_id, anonymous_user_id, total_credits, remaining_credits, expire_at, updated_at)
select p.id, null, 1000, 1000, now() + interval '365 days', now()
from public.profiles p
where p.plan = 'pro'
  and (p.plan_expire_at is null or p.plan_expire_at > now())
  and not exists (select 1 from public.user_credits uc where uc.user_id = p.id);

insert into public.user_credits (user_id, anonymous_user_id, total_credits, remaining_credits, expire_at, updated_at)
select null, a.anonymous_user_id, 1000, 1000, a.expires_at, now()
from public.anonymous_pro_entitlements a
where a.expires_at > now()
  and not exists (select 1 from public.user_credits uc where uc.anonymous_user_id = a.anonymous_user_id);
