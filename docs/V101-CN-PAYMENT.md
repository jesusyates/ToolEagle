# V101 — CN aggregator Pro checkout

## Overview

- **Orders** table stores every purchase attempt (`pending` → `paid` / `failed`).
- **CN** (`market: cn`): `getPaymentProvider` → `aggregator`; UI calls `POST /api/payment/create-order`, shows QR / H5 URL, polls `GET /api/payment/status`. **Create-order requires sign-in** (`401 login_required`); orders store **`user_id` only** (no anonymous credit/Pro purchases).
- **Global**: unchanged — `UpgradeLink` + `NEXT_PUBLIC_PAYMENT_LINK` (Lemon / Stripe) when `te_preferred_market !== cn`.
- **Pro / credits entitlement**: signed-in users get `profiles.plan = pro` + `plan_expire_at` and/or `user_credits` from paid `orders`. (`anonymous_pro_entitlements` / cookie-only purchase paths are not used for CN create-order.)

## Env

See `.env.example` (V101 block). Required for live CN checkout:

- `AGGREGATOR_BASE_URL`, `AGGREGATOR_API_KEY`
- `AGGREGATOR_NOTIFY_URL` — public `https://.../api/payment/callback`
- `AGGREGATOR_WEBHOOK_SECRET` — HMAC-SHA256 hex of **raw** callback body, header `x-aggregator-signature`
- `SUPABASE_SERVICE_ROLE_KEY` — order rows + entitlements
- Optional: `AGGREGATOR_CREATE_PATH` (default `/pay/create`), `CN_PRO_MONTHLY_CNY`, `PRO_SUBSCRIPTION_DAYS`

Dev: `AGGREGATOR_ALLOW_UNSIGNED_CALLBACK=1` accepts webhooks without signature (do not use in production).

## Aggregator contract (adapter)

**Create (outbound)** — `POST {BASE}{CREATE_PATH}` JSON body includes:

`merchant_order_id`, `out_trade_no`, `amount` / `amount_cny`, `currency`, `notify_url`, `subject`

Response: JSON with QR or pay URL in one of `qr_url`, `code_url`, `pay_url`, `h5_url`, or nested under `data.*` (see `extractPaymentSurface` in `src/lib/payment/providers/aggregator.ts`).

**Callback (inbound)** — `POST /api/payment/callback` with verified signature. Body (JSON or `x-www-form-urlencoded`) should include merchant order id as `merchant_order_id` / `out_trade_no` / `order_id` and paid status (`trade_status`, `status`, etc. — see `parseAggregatorCallbackBody`).

## Migrations

- `0033_v101_orders_membership.sql` — orders + `anonymous_pro_entitlements` + `profiles.plan_expire_at`
- `0034_v101_1_orders_order_type.sql` — `orders.order_type` (`pro` | `donation`); verified donations share callback with Pro

## V101.1 — Donation orders

- `POST /api/payment/create-donation-order` — preset CNY tiers (5 / 10 / 20), `order_type=donation`
- `GET /api/donation/history` — paid `orders` with `order_type=donation` only (no manual ledger)
- `POST /api/donation/record` — **410** deprecated
- Supporter perks / levels from **verified** donation totals (`aggregateDonationOrdersForSupporterKey`)

## Analytics (client)

`payment_order_created`, `payment_qr_shown`, `payment_success`, `payment_failed` with `market`, `provider`, `plan`, `amount` where applicable (`src/lib/analytics.ts`).
