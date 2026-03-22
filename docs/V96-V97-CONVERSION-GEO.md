# V96 — Conversion System + V97 — Geo / Localization Entry

## V96 Summary

### Upgrade triggers (first 3 uses)

- **After each generation:** amber “Free preview” bar + post-generation strip + **DonationBox** under results.
- **2nd lifetime package generation (browser):** violet “Second run” banner (`localStorage` key `te_v96_lifetime_pkg_gens`).
- **Near limit:** rose banner when `/api/usage-status` reports `remaining <= 1` (and &gt; 0).
- Existing **UpgradeToolMidCta** + **FloatingUpgradeCTA** still fire; together user sees **≥2** strong prompts within first 3 runs.

### Pro preview

- API always builds **5** packages; **Free** response returns **3 visible** (truncated script/caption, **no** `why_it_works` / `posting_tips` / `best_for`) + **`lockedPreview`** teasers for variants 4–5.
- **Pro:** all **5** full packages with all sections.
- UI: blurred **Pro-only variants** block + unlock CTAs (`PostPackageResults`).

### Conversion tracking

- `POST /api/analytics/conversion` — events: `upgrade_click`, `pricing_open`, `payment_click` (logged server-side; extend to DB/Plausible as needed).
- Client: `src/lib/analytics/conversionClient.ts`.
- **`UpgradeLink`** auto-tracks `payment_click` vs `upgrade_click`.
- **Pricing page:** `PricingConversionTracker` → `pricing_open` on mount.
- **Limit modal:** `pricing_open` from “Compare plans” link.

### Pricing & modal

- Pricing: use cases + “what you get” example copy.
- Limit modal: mini sales page (bullets + social proof block + dual CTA).

### Donation

- **Compact DonationBox** in tool **result** area after successful generation; props `variant="zh" | "en"`.

---

## V97 Summary

### Middleware (`src/middleware.ts`)

1. **`GET /`**, no `te_preferred_locale` / `te_preferred_market`: if **geo CN** OR (**no geo** and `Accept-Language` → zh), **307 → `/zh`** and set `te_preferred_locale=zh`, `te_preferred_market=cn`.
2. Same request to `/` for others: after `updateSession`, set **`en` + `global`** if still no cookies.
3. **`/zh/*`** without locale cookie: set **zh + cn** on response (deep links).

### Cookies (`src/config/market.ts`)

- `te_preferred_locale` — `en` | `zh` (extend enum when adding JP/ES/…).
- `te_preferred_market` — `global` | `cn` | `jp` | `es` | `de` (reserved).

### Switcher

- `MarketLocaleSwitcher` in **SiteHeader** — sets cookies + **full navigation** (`window.location`).
- **中文** uses `/zh` + path suffix; **EN** strips `/zh` prefix.

### China entry

- **`/zh`** — `ZhWrittenForCreatorsHome`（品牌首屏 + 原则 + 入口）: CTAs, **DonationBox** 以页内/定价路径为主。
- **`/zh/pricing`** — redirects to `/pricing` (pricing UI still EN; document until localized).

### SEO

- **`/`** and **`/zh`**: `metadata.alternates.canonical` + `languages` (`en`, `zh-CN`).
- Avoid treating `/zh` as duplicate of `/`: distinct URLs + canonical each.

### Future markets

- Add `PreferredMarket` + `localePathForMarket()` routes.
- In middleware, replace CN-only branch with `resolveMarketFromGeo()` table (CN→/zh, JP→/jp, …).
- Reuse same cookies; add `te_preferred_market=jp` etc.

---

## Files (quick reference)

| Area | Path |
|------|------|
| Conversion API | `src/app/api/analytics/conversion/route.ts` |
| Usage hint | `src/app/api/usage-status/route.ts` |
| Package split | `src/lib/ai/packageTierSplit.ts` |
| Market cookies | `src/config/market.ts` |
| Switcher | `src/components/locale/MarketLocaleSwitcher.tsx` |
| Zh home | `src/app/zh/page.tsx`, `src/app/zh/_components/ZhWrittenForCreatorsHome.tsx` |
