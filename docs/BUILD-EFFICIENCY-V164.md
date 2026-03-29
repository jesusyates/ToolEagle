# V164 — Build efficiency follow-up (static params)

## Worst remaining route families

1. **Blog `/blog/[slug]`** — Still enumerates MDX + programmatic candidates before blog-specific caps; cost is mostly **page render count**, not per-slug disk scans.
2. **Zh hub helpers (`zh-hub-data`)** — `getHubChildTopics` / listings still call `getZhContent()` per row (separate from `generateStaticParams`). Acceptable at **request time**; watch if used in build-only paths later.
3. **Large `getAllTopicSlugs()` families** — Many routes map topics then `limitBuildStaticParams`; CPU is O(topics) string work, not O(topics) × disk.

## What changed in V164

- **Zh guide routes** (`/zh/how-to`, `content-strategy`, `viral-examples`, `ai-prompts-for`): centralized in `src/lib/zh-guide-static-params.ts`.
  - **One** `data/zh-seo.json` read per route family via `loadZhContentCache()` + `getZhContentFromCache`.
  - On **Vercel / `NEXT_LIMIT_STATIC_PARAMS`**: **bounded scan** of the candidate list (no full-table filter before cap).

## Expected savings

- **Zh guide `generateStaticParams`**: from **O(N) file reads** (N = guide rows) to **1 read** + **O(scanBudget)** in-memory lookups when capped; typically **large** reduction in I/O and wall time on CI/Vercel.

## Timeout outlook

Prior **path-count** caps already cut SSG volume. With V164, **per-path setup** for Zh guides is cheaper. Together, **Vercel builds should sit far below a 45m budget** unless a new uncapped route family is added or blog caps are raised sharply.

## Env reference

- `VERCEL=1` or `NEXT_LIMIT_STATIC_PARAMS=1` — enable static param caps.
- `NEXT_STATIC_PAGE_CAP` — default 80 (see `src/lib/build-static-params-limit.ts`).
