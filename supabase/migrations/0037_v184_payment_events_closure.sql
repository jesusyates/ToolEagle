-- V184 — Payment closure: ensure payment_events exists (some remote DBs never applied 0036).
-- Code expects: order_id, event_type, provider, payload_json, created_at (see src/lib/payment/orders-repository.ts).

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
