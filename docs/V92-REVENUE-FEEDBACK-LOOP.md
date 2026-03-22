# V92 — Revenue Feedback Loop

## Database (`supabase/migrations/0027_v92_revenue_feedback_loop.sql`)

| Object | Purpose |
|--------|---------|
| `zh_page_revenue_metrics.injection_weight` | Default `1`. Higher → stronger sort score in traffic injection (`weight × revenue`). |
| `traffic_events` | `source`, `page`, `meta`, optional `user_id`. Anonymous inserts allowed for public tracking. |
| `revenue_attribution` | Manual / pipeline attribution rows (`page`, `revenue`, `source`, `tool`). Authenticated insert. |
| `distribution_queue.status` | Extended with `failed` (existing V82 queue unchanged otherwise). |
| `distribution_outbound_queue` | Per-spec queue: `user_id`, `platform` (reddit/x/quora), `content`, `status`. |

**Apply:** `npx supabase db push` or your migration runner.

## APIs

| Route | Method | Auth | Notes |
|-------|--------|------|-------|
| `/api/revenue/daily-report` | GET | Yes | `top_pages`, `top_tools`, `traffic_sources` (24h analytics + rollups). |
| `/api/revenue/attribution` | POST | Yes | Body: `{ page, revenue?, source?, tool? }`. |
| `/api/analytics/traffic-event` | POST | No | Body: `{ source, page, meta? }`. Sources: `homepage`, `tool`, `content`, `external`, `growth_mission`, `injection`. |
| `/api/growth-mission/execute` | POST | Yes | `log_start`, `click_boost`, `complete_post` (writes `distribution_posts` + optional `traffic_events`). |
| `/api/distribution/queue` | GET | Yes | Existing pending items + `outbound` drafts. |
| `/api/distribution/queue` | POST | Yes | `{ platform, content }` → `distribution_outbound_queue`. |
| `/api/traffic-injection/pack` | GET | No | Query: `locale=zh|en`, `variant=a|b`, `skipCache=1`. |
| `/api/traffic-injection/summary` | GET | No | Query: `locale`, `variant`. |

## Cache (traffic injection)

- **Redis:** Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (package: `@upstash/redis`).
- **Fallback:** In-memory TTL ~120s, max ~50 keys (per Node process).
- **Code:** `src/lib/traffic-injection-cache.ts`, used from `getTrafficInjectionContext()`.

## UI

- `/dashboard/revenue` — `DailyRevenueReport` (client) loads daily-report API.
- `/dashboard` — `GrowthMissionBlock`: each mission row is clickable; uses `/api/growth-mission/execute`.
- Tool results — `ToolResultMoneyCta` fires `traffic-event` with `source: injection` and uses `summary?locale=en`.

## Multi-language & A/B injection

- `getTrafficInjectionContext({ locale: 'zh' | 'en', variant: 'a' | 'b' })`.
- **Variant B:** reorders tail of list with stable hash (exposure experiment).
- Homepage / ZH blocks use `zh`; share + tool CTA use `en` where noted.

## Tracking flow (recommended)

1. CTA impressions: `POST /api/analytics/traffic-event` with `source: injection` / `tool` / `homepage`.
2. Growth actions: `POST /api/growth-mission/execute` (`log_start`, `complete_post`).
3. Revenue side: keep using `POST /api/zh/analytics` for tool clicks (updates metrics RPCs); add `revenue_attribution` when you attribute $ externally.
