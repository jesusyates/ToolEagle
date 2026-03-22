-- V101.1 — Distinguish Pro subscription vs verified donation orders (same callback)

alter table public.orders
  add column if not exists order_type text not null default 'pro'
  check (order_type in ('pro', 'donation'));

comment on column public.orders.order_type is 'pro = subscription; donation = voluntary support verified by payment callback.';

create index if not exists orders_donation_anon_paid_idx
  on public.orders (anonymous_user_id, paid_at desc)
  where order_type = 'donation' and status = 'paid';

create index if not exists orders_donation_user_paid_idx
  on public.orders (user_id, paid_at desc)
  where order_type = 'donation' and status = 'paid';
