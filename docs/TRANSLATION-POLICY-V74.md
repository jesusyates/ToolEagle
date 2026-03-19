# Translation Policy V74.3 – Implementation Report

## 1. Pages with `translate="no"` (Translation Disabled)

Applied on `<html>` when pathname matches:

| Category | Paths |
|----------|-------|
| **Tool / Generator** | `/tools/*`, `/tiktok-caption-generator`, `/youtube-title-generator`, `/hook-generator`, `/ai-prompt-improver`, `/prompt-playground` |
| **Dashboard / Auth / Admin** | `/dashboard/*`, `/login`, `/auth/*`, `/admin/*` |

**Implementation:** `src/app/layout.tsx` sets `translate={disableTranslation ? "no" : undefined}` on the root `<html>` element using `x-pathname` from middleware.

---

## 2. Pages Using Full-Page Navigation (`<a>`)

| Component | Links |
|-----------|-------|
| **SiteHeader** | All nav items (home, tools, discover, ai-prompts, learn-ai, answers, creators, community, favorites, me, dashboard, creator, pricing, blog, about) via `TranslateAwareLink` |
| **SiteFooter** | All footer links (launch, tools, ai-prompts, learn-ai, answers, platform tools, resources) via `TranslateAwareLink` |
| **Language switcher** | EN \| 中文 links use plain `<a href>` |

**Note:** Page-internal links (e.g. community sub-pages, blog posts, learn-ai articles) still use `next/link` for SPA navigation. Per V74.3, main nav uses full-page navigation; in-page links can remain as Link for UX.

---

## 3. Removed Translation Hacks

| Removed | Location |
|---------|----------|
| `span suppressHydrationWarning` around nav labels | `SiteHeader.tsx` |
| `span suppressHydrationWarning` around slogan | `SiteHeader.tsx` |
| `span suppressHydrationWarning` around learn-ai link | `SiteFooter.tsx` |
| `span suppressHydrationWarning` around copyright | `SiteFooter.tsx` |
| `span suppressHydrationWarning` around h1 | `community/page.tsx`, `learn-ai/page.tsx`, `answers/page.tsx`, `tools/ToolsPageClient.tsx` |
| `suppressHydrationWarning` on `TranslateAwareLink` | `TranslateAwareLink.tsx` |

**Kept:**
- `suppressHydrationWarning` on `<html>` and `<body>` (common for Next.js/theme hydration)
- `translate-resilience` script (minimal fallback for SEO pages when translation is allowed)

---

## 4. Remaining Hydration Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| **SEO pages with browser translation** | React hydration mismatch when Google Translate modifies DOM before React hydrates | `translate="no"` on Tool/Dashboard/Auth/Admin; SEO pages allow translation with minimal resilience script |
| **Client components with `useTranslations`** | Server/client text mismatch if translation runs | `TranslateAwareLink` uses full-page nav to avoid SPA transitions |
| **Date/time rendering** | `new Date().getFullYear()` in footer | Low risk; removed `suppressHydrationWarning` from copyright block |

---

## 5. Internal i18n

- **Primary languages:** English (default), Chinese (`/zh/*`)
- **Language switcher:** EN \| 中文 in `SiteHeader`
- **Future expansion:** `SUPPORTED_FUTURE_LANGUAGES = [es, pt, id]` (no implementation yet)

---

## 6. File Summary

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Added `translate="no"` on html for Tool/Dashboard/Auth/Admin paths |
| `src/app/_components/SiteHeader.tsx` | Removed span wrappers; added EN \| 中文 switcher |
| `src/app/_components/SiteFooter.tsx` | Removed span wrappers |
| `src/app/community/page.tsx` | Removed span wrapper from h1 |
| `src/app/learn-ai/page.tsx` | Removed span wrappers from h1, subtitle |
| `src/app/answers/page.tsx` | Removed span wrapper from h1 |
| `src/app/tools/ToolsPageClient.tsx` | Removed span wrapper from h1 |
| `src/components/TranslateAwareLink.tsx` | Removed suppressHydrationWarning |
