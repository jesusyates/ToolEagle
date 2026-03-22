# V100.1 — Supporter system

## Database

- Migration: `supabase/migrations/0030_v100_1_supporter_system.sql`
- Table: `public.donation_ledger` — `id`, `user_id` (text: anon cookie UUID or `auth.users` id), `amount` (optional), `created_at`, `source_page`, `thank_you_message`
- RLS: no direct client access; **writes/reads only via Next.js API** using `createAdminClient()` → requires **`SUPABASE_SERVICE_ROLE_KEY`** in production.

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/donation/record` | Record a support event (user confirms after QR payment). Sets `te_supporter_id` cookie for anonymous users. |
| GET | `/api/donation/history` | Ledger + stats + computed level/perks; creates cookie if missing. |
| GET | `/api/supporter/ensure` | Optional: ensure anon cookie exists (no DB). |

## Pages & UI

- `/zh/support` — supporter center (status, perks, timeline, donation block).
- `DonationBox` — **QR display only** (V100.2). Registration: `SupportModal` or `/zh/support` page.
- `ZhSupporterInlineBanner` — tool pages (CN): level + last thank-you hint from localStorage.
- Footer / home links to `ZH.support`.

## Anonymous identity

- Cookie: `te_supporter_id` (httpOnly, UUID).
- Logged-in users use `auth.users.id` as `user_id` in the ledger (no merge with anon cookie in V100.1).

## Levels & perks (server: `supporter-perks.ts`)

| Level | Rule (approx.) | Perks |
|-------|----------------|--------|
| `early_supporter` | 1 donation record | +1 free gen/day |
| `supporter` | 2+ records or sum ≥ 25 | +2 free gen/day |
| `core_supporter` | 5+ records or sum ≥ 100 | +5 free gen/day, +1 free visible package, `earlyFeatureAccess` |

## Integration

- `gateGenerationUsage` / `/api/generate` / `/api/usage-status` use `getSupporterLimitContext` for **effective** free daily limit.
- `/api/generate-package` free tier: `toFreeVisiblePackages` / `buildLockedPreviews` respect `freeVisibleExtraSlots`; response may include `supporterMeta`.

## Env

- `SUPABASE_SERVICE_ROLE_KEY` — **required** for donation APIs to write/read ledger.
- Existing: `NEXT_PUBLIC_DONATE_*` for QR images.
