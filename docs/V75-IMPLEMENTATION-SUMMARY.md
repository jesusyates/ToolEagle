# V75 Implementation Summary – Global i18n + Tool Layer Unification (Phase 1)

## 1. Removed Duplicated Language Components

| Removed | Path |
|---------|------|
| ZhHookGeneratorClient | `src/app/zh/tools/hook-generator/ZhHookGeneratorClient.tsx` |
| ZhTitleGeneratorClient | `src/app/zh/tools/title-generator/ZhTitleGeneratorClient.tsx` |
| ZhIdeaGeneratorClient | `src/app/zh/tools/idea-generator/ZhIdeaGeneratorClient.tsx` |

---

## 2. Updated Shared Tool Components

| Component | Changes |
|-----------|---------|
| **HookGeneratorClient** | `useLocale()`, pass `locale` to `generateAIText`, optional `ctaLinks` prop, all UI from `useTranslations("toolPages.hookGenerator")` |
| **TitleGeneratorClient** | Same pattern: locale, ctaLinks, translations |
| **GenericToolClient** | `useLocale()`, pass `locale` to `generateAIText` |
| **TikTokCaptionGeneratorClient** | `useLocale()`, pass `locale` to `generateAIText` |
| **HashtagGeneratorClient** | `useLocale()`, pass `locale` to `generateAIText` |
| **CtaLinksSection** (new) | Shared client component for zh CTA links, uses `toolPages.learnMore` |

---

## 3. API Locale Support

**`/api/generate`**

- Input: `{ prompt: string, locale?: string }`
- Default: `locale = "en"`
- Locale instructions:
  - `zh` → "Output in Simplified Chinese. "
  - `es` → "Output in Spanish. "
  - `pt` → "Output in Portuguese. "
  - `id` → "Output in Indonesian. "
- Backward compatible: callers can omit `locale`

**`generateAIText(prompt, options?: { locale?: string })`**

- Forwards `locale` to the API
- Default `locale = "en"` when not provided

---

## 4. next-intl Integration

**`src/i18n/request.ts`**

- Uses `headers().get("x-pathname")` to detect locale
- `pathname.startsWith("/zh")` → `locale = "zh"`, load `messages/zh.json`
- Otherwise → `locale = "en"`, load `messages/en.json`

**`messages/`**

- Added `toolPages` section in `en.json` and `zh.json`:
  - `eyebrow`, `generating`, `maxLengthError`
  - `hookGenerator.*`, `titleGenerator.*`, `tiktokIdeaGenerator.*`
  - `learnMore`, `learnMoreDesc`, `ctaLinkSuffix`

---

## 5. zh Routes Reusing Shared Logic

| Route | Implementation |
|-------|----------------|
| `/zh/tools/hook-generator` | `HookGeneratorClient` + `ctaLinks` from `getLatestKeywordPages()` |
| `/zh/tools/title-generator` | `TitleGeneratorClient` + `ctaLinks` |
| `/zh/tools/idea-generator` | `GenericToolClient` with `slug="tiktok-idea-generator"` + `CtaLinksSection` as `relatedAside` |

All zh tool pages keep their SEO metadata (title, description, OpenGraph).

---

## 6. Language Configuration

**`src/config/languages.ts`**

```ts
SUPPORTED_LANGUAGES = ["en", "zh"]
FUTURE_LANGUAGES = ["es", "pt", "id"]
defaultLocale = "en"
```

---

## 7. Translation Policy

- Added `/zh/tools` to `translate="no"` paths in `layout.tsx`
- Tool pages (including zh) disable browser translation

---

## 8. Remaining Blockers for Phase 2

| Item | Notes |
|------|-------|
| **SEO content unification** | `GuidePageTemplate` vs `ZhGuidePageTemplate` still separate; ContentTemplate refactor deferred |
| **GenericToolClient UI** | Labels still from `generators` config (English); full i18n would need `toolPages.*` keys per tool |
| **Build** | Existing type error in `src/app/login/page.tsx:181` (unrelated to V75) |

---

## 9. Files Changed

| File | Action |
|------|--------|
| `src/app/api/generate/route.ts` | Added locale handling |
| `src/lib/ai/generateText.ts` | Added `locale` option |
| `src/i18n/request.ts` | Locale from pathname, load messages |
| `src/config/languages.ts` | New |
| `src/app/layout.tsx` | Added `/zh/tools` to `translate="no"` |
| `messages/en.json` | Added `toolPages` |
| `messages/zh.json` | Added `toolPages` |
| `src/app/tools/hook-generator/pageClient.tsx` | Locale, ctaLinks, translations |
| `src/app/tools/title-generator/pageClient.tsx` | Locale, ctaLinks, translations |
| `src/app/tools/tiktok-caption-generator/pageClient.tsx` | Locale |
| `src/app/tools/hashtag-generator/pageClient.tsx` | Locale |
| `src/components/tools/GenericToolClient.tsx` | Locale |
| `src/components/tools/CtaLinksSection.tsx` | New |
| `src/app/zh/tools/hook-generator/page.tsx` | Use `HookGeneratorClient` |
| `src/app/zh/tools/title-generator/page.tsx` | Use `TitleGeneratorClient` |
| `src/app/zh/tools/idea-generator/page.tsx` | Use `GenericToolClient` |
| `ZhHookGeneratorClient.tsx` | Deleted |
| `ZhTitleGeneratorClient.tsx` | Deleted |
| `ZhIdeaGeneratorClient.tsx` | Deleted |
