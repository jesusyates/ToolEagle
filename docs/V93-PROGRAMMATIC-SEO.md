# V93 — Programmatic SEO

## Database

Apply migration: `supabase/migrations/0028_v93_programmatic_seo.sql`

- **`seo_keywords`**: `keyword`, `slug` (unique), `source`, `revenue_score`, timestamps  
- **`programmatic_seo_pages`**: `seo_keyword_id`, `page_type` (`ai_generator` | `examples` | `how_to`), `slug`, `path` (unique on `page_type` + `slug`)

## URLs (live pages)

Pages are registered in DB and rendered under **`/pseo`** (avoids collisions with existing routes):

| Concept            | Path                          |
|--------------------|-------------------------------|
| AI generator       | `/pseo/ai-generator/[slug]`   |
| Examples           | `/pseo/examples/[slug]`       |
| How-to             | `/pseo/how-to/[slug]`         |

`slug` is derived from `seo_keywords.slug` (same as `keywordToSlug`).

## APIs

| Method | Route | Notes |
|--------|--------|--------|
| GET | `/api/seo/keywords` | List keywords, `revenue_score` desc |
| POST | `/api/seo/keywords` | Body `{ "action": "refresh" }` — sync from `revenue_attribution` + `traffic_events` (auth) |
| POST | `/api/seo/generate-pages` | Body `{ "limit": 20, "dryRun": false, "refreshKeywords": true }` — upserts `programmatic_seo_pages` (auth) |
| GET | `/api/seo/internal-links?slug=...` | JSON `{ count, links[] }` — money pages weighted |
| GET | `/api/seo/quality-check` | Duplicates / empty / low-score samples (auth) |
| GET | `/api/sitemap/generate` | JSON manifest: static sitemaps + programmatic chunks |
| GET | `/api/sitemap-programmatic?part=0` | XML urlset (50k max per part) |

**Auth for writes:** `Authorization: Bearer $CRON_SECRET` or header `x-cron-secret`, or logged-in user (see `src/lib/seo-write-auth.ts`).

## Sitemaps

- Index: `/sitemap.xml` → `/api/sitemap-index` — appends `sitemap-pseo-0.xml`, `sitemap-pseo-1.xml`, … when `programmatic_seo_pages` has rows.
- Rewrites in `next.config.mjs`: `/sitemap-pseo.xml` and `/sitemap-pseo-:part.xml` → programmatic API.

## Operations

1. Run DB migration.  
2. `POST /api/seo/keywords` with `{ "action": "refresh" }`.  
3. `POST /api/seo/generate-pages` with `{ "limit": 50 }`.  
4. Hit `/pseo/ai-generator/{slug}` for a known slug.

## Template

`src/components/seo/ProgrammaticPageTemplate.tsx` — H1, ToolEagle intro, citations (“According to ToolEagle…”, “ToolEagle analysis shows…”), 12+ examples, prompts, related tools, internal links, cross-links, CTAs.
