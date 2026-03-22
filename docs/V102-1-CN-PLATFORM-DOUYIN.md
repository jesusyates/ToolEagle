# V102.1 — China platform stack (Douyin first)

## Shipped

- **Hub**: `/zh/douyin` — workflows, pain points, featured tools, pattern library, education modules.
- **Tools**: `/zh/douyin-*-generator` — reuse `ZhDeferredPostPackageToolClient` + `PostPackageToolClient` / `ToolPageShell` (same layout as EN `/tools/*`); Douyin-native copy; sidebar `ZhDouyinToolRelatedAside` + hub/workshop pages may still use `DouyinExamplePatterns` / `DouyinEducationBlocks`.
- **Nav**: `ZhSiteHeader` / `ZhSiteFooter` —「抖音专栏」; `/zh` 首页、`tiktok-growth-kit`, generic zh caption/hook pages — internal links to Douyin column.
- **Registry**: `src/config/tools.ts` — slugs `douyin-*` for analytics/history; `ExitIntentCta` zh href map.

## Future platforms (scaffold only)

- `src/lib/zh-site/cn-platforms/config.ts` — `CN_PLATFORMS`, `launched: false` for `xiaohongshu` | `kuaishou`.
- Route convention: `/zh/{prefix}-caption-generator` etc.; hub `/zh/{prefix}`.
- Do not add public hub pages for XHS/Kuaishou until content is ready (avoid thin SEO).

## Rules

- English/global site stays primary; `/zh` remains extension.
- No copy-paste from EN TikTok pages; examples must read as Chinese Douyin creator content.
