# V100.2 — Donation UX refinement (CN)

## Principles

- No QR blocks on homepage, footer, pricing hero, or tool result footers by default.
- Support surfaces only **after value** (successful generations at milestones **1, 4, 8** lifetime count), via `SupportPrompt` → `SupportModal`.
- **Pro / limit modal** stays separate — no donation CTAs inside `LimitReachedModal`.
- Central hub: **`/zh/support`** — QR + registration + history (requires V100.1 APIs + DB).

## Components

| File | Role |
|------|------|
| `src/components/monetization/SupportPrompt.tsx` | Inline text + “了解如何支持” / “稍后再说”; fires `support_prompt_*` analytics. |
| `src/components/monetization/SupportModal.tsx` | QR (`DonationBox`) + channel registration + link to `/zh/support`; `support_drawer_open`, `donation_record_create`. |
| `src/components/DonationBox.tsx` | **QR display only** (used inside modal + support page). |

## Trigger logic

- `src/lib/supporter/support-prompt-rules.ts` — `SUPPORT_PROMPT_MILESTONES = [1,4,8]`, `LS_SEEN_MILESTONES` in localStorage.
- `PostPackageResults` shows prompt when milestone matches **and** user has no ledger records (`GET /api/donation/history`).
- `supportSourcePath` from `PostPackageToolClient` `pathname` for analytics + `source_page`.

## Supporter identity

- Server: **`te_supporter_id`** httpOnly cookie (V100.1).
- Client analytics: **`te_support_client_analytics_id`** in localStorage (`client-analytics-id.ts`).

## APIs (V100.1 + V100.2)

- `POST /api/donation/record` — optional `channel`: `wechat` \| `alipay` \| `other`.
- `GET /api/donation/history` — public-shaped entries: `id`, `amount`, `channel`, `source_page`, `message`, `created_at` (migration `0031_v100_2_donation_channel.sql`).

## Analytics (`trackEvent` / Plausible props)

- `support_prompt_view` — `route`, `market`, `locale`, `source_page`, `supporter_id`, `milestone`
- `support_prompt_click` — same + `milestone`
- `support_drawer_open` — `route`, `market`, `locale`, `source_page`, `supporter_id`
- `support_page_view` — on `/zh/support` mount
- `donation_record_create` — + `channel` when applicable

## Routes / components touched (checklist)

- `PostPackageResults.tsx`, `PostPackageToolClient.tsx`
- `ZhSiteFooter.tsx`, `app/zh/page.tsx`, `app/zh/pricing/page.tsx`
- `app/zh/support/ZhSupportPageClient.tsx`
- `lib/analytics.ts`, `app/api/donation/*`, `lib/supporter/supporter-ledger.ts`
- Removed: `ZhSupporterInlineBanner.tsx`
