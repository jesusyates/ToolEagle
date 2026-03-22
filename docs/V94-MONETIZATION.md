# V94 — Monetization (Global + China)

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PAYMENT_LINK` | Lemon Squeezy (or other) checkout URL for **ToolEagle Pro** (~$9/mo). All upgrade CTAs open this when set; otherwise they link to `/pricing`. |
| `NEXT_PUBLIC_DONATE_WECHAT_QR` | Optional. URL or `/path.png` in `public/` for WeChat donation QR. |
| `NEXT_PUBLIC_DONATE_ALIPAY_QR` | Optional. Same for Alipay. |

## Usage limit

- **Free tier:** `FREE_DAILY_LIMIT` in `src/lib/usage.ts` (V94: **5** generations per day).
- **Logged-in:** enforced in API routes via `usage_stats` + plan.
- **Anonymous:** cookie `te_daily_ai` (`YYYY-MM-DD|count`), incremented after successful generation on `/api/generate` and `/api/improve`.
- **Over limit:** HTTP 429 + client `LimitReachedModal` with upgrade CTA (`UpgradeLink` → payment or `/pricing`).

## Upgrade CTA coverage (count = **8** surfaces)

1. **Navbar** — `SiteHeader` (`nav.upgrade` / `UpgradeLink`)
2. **Hero** — `HomeHeroGenerate` (teaser + `UpgradeLink`)
3. **Tool pages** — `ToolPageShell` → `UpgradeToolMidCta` (between input and result; all tools using the shell)
4. **Programmatic SEO** — `ProgrammaticPageTemplate`: `SeoMidUpgradeCta` + bottom `UpgradeLink`
5. **Floating button** — `FloatingUpgradeCTA` in root `layout.tsx` (hidden on `/login`, `/auth`, `/admin`, `/embed`, `/dashboard`)
6. **Pricing** — primary Pro button (`UpgradeLink`)
7. **Limit modal** — `LimitReachedModal` (`UpgradeLink`)
8. **PSEO money links** — existing `PseoTrackedMoneyLinks` variants remain; mid-page adds `SeoMidUpgradeCta` (counts as part of programmatic surface above)

_Note: Item 4 includes both mid and bottom CTAs on the same template._

## Components

- `src/config/payment.ts` — `getPaymentLink`, `hasPaymentLink`, `getUpgradeHref`
- `src/components/monetization/UpgradeLink.tsx` — client; external checkout or `next/link` to `/pricing`
- `src/components/monetization/UpgradeToolMidCta.tsx`
- `src/components/monetization/SeoMidUpgradeCta.tsx`
- `src/components/monetization/FloatingUpgradeCTA.tsx`
- `src/components/DonationBox.tsx` — footer; WeChat + Alipay QRs

## Copy themes

- Get results faster  
- Save hours with AI  
- Grow faster  
