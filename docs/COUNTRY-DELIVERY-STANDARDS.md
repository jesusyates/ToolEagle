# Country-site delivery standards (V99)

Reusable playbook for **localized secondary sites** (China first). The **global / English site remains primary**; country extensions share code and strengthen shared layers—**no forks**.

---

## 1. Performance goals

| Area | Target |
|------|--------|
| First paint | Hero, title, and primary CTAs render without waiting on heavy client modules (tool shell, QR images, large below-fold widgets). |
| JS | Defer non-critical client bundles (`next/dynamic`, `ssr: false` where appropriate) on high-traffic localized routes. |
| Hydration | Avoid loading donation QR / optional media on the critical path; use deferred client islands. |
| Content order | Pricing/value grids before domestic payment blocks when both exist on one page. |

---

## 2. Cache key rules (market + locale + path)

Use **`buildMarketLocaleCacheKey`** from `src/lib/cache/market-cache-key.ts`:

- Pattern: `{market}:{locale}:{path}` (path starts with `/`).
- Examples: `global:en:/pricing`, `cn:zh:/pricing`, `cn:zh:/tiktok-growth-kit`.

**Implemented example:** sidebar keyword lists for CN tools use **`getLatestKeywordPagesCnSidebarCached`** (`src/lib/zh/cn-keyword-sidebar-cache.ts`) with `unstable_cache` keyed per canonical `/zh/...` route so entries **do not leak** across markets.

When adding new cached data for a country:

1. Pick `market` (`cn`, `global`, or future ISO-style slug).
2. Pick `locale` (`zh`, `en`, …).
3. Use the **canonical user-facing path** as `path`.

---

## 3. AI provider & fallback rules

- **Global:** OpenAI primary.
- **CN (when enabled):** Configured CN provider (e.g. DeepSeek) **then** OpenAI; **local heuristic** only after model failure or empty JSON parse.
- **Timeouts:** `fetchWithTimeout` in `src/lib/ai/providers/fetch-timeout.ts`; override with **`AI_CHAT_TIMEOUT_MS`** (ms, minimum 5000).

**generationMeta / outcomes** (`src/lib/ai/router.ts`):

| `outcome` | Meaning |
|-----------|---------|
| `model_primary` | First provider in chain returned usable normalized text. |
| `model_after_provider_fallback` | A later provider succeeded (e.g. OpenAI after DeepSeek). |
| `heuristic_after_empty_parse` | Model responded but structured parse yielded no packages → template fallback. |
| `heuristic_after_router_failure` | All providers failed → template fallback. |

**`error_class`** (when router exhausts): `timeout` \| `http_4xx` \| `http_5xx` \| `unavailable` \| `network` \| `unknown` — see `src/lib/ai/ai-error-classify.ts`.

---

## 4. Telemetry fields

### AI (`[ai_telemetry]`)

Extended in `src/lib/ai/telemetry.ts`:

- Existing: `task_type`, `market`, `locale`, `provider`, `model`, `user_plan`, `latency_ms`, `fallback_used`, `success`, `error_code`.
- **V99:** `route` (sanitized client pathname), `outcome`, `error_class`, `user_fulfilled`, `model_latency_ms` (time to first model completion when applicable).

**Semantics:**

- **`success`:** `true` only when the model returned **parseable** package JSON (not heuristic-only).
- **`user_fulfilled`:** `true` when the API returns 200 with packages (including heuristic).
- **`latency_ms`:** End-to-end request time for the handler path; **`model_latency_ms`** when the model ran but parse/heuristic may follow.

### CN page perf (`[cn_page_perf]`)

Client beacon: `src/components/zh/ZhCnPerfBeacon.tsx` (mounted from `src/app/zh/layout.tsx`).

- `route`, `market: cn`, `locale: zh`
- `dom_content_loaded_ms`, `load_event_ms`, `ttfb_ms` (Navigation Timing 2 where available)

---

## 5. Delivery priority (above the fold)

1. **Must ship early:** Site header, page title, lead copy, primary tool CTA or pricing tiers.
2. **Visible but non-blocking:** Domestic donation / QR — placeholder + **`ZhDonationDeferred`** (`ssr: false` for `DonationBox`).
3. **Defer:** Full tool client (`ZhDeferredPostPackageToolClient`), optional value blocks (`ZhDeferredValueProofBlock`), examples/history stacks after initial shell.

---

## 6. Third-party dependency audit (CN-critical routes)

| Dependency | Where | Risk in CN | Mitigation |
|------------|-------|------------|------------|
| **Plausible** (`next-plausible`) | Root `layout.tsx` | Extra DNS/connect; may be slower from mainland | Kept for global parity; loads with app shell. Consider env-gating later if needed. |
| **Sentry** | Next integration | Same | Standard; no per-page duplication. |
| **Google APIs / gtag** | If any on tool pages | High latency / blocked | Not added on `/zh` core routes in this pass. |
| **next/image** (donation QR) | `DonationBox` | Decode/layout cost | Deferred via `ZhDonationDeferred` so first paint is not blocked on QR decode. |

**Principle:** Do not add new third-party scripts on CN landing/tool pages without documenting latency and fallback.

---

## 7. Related code paths

- Cache keys: `src/lib/cache/market-cache-key.ts`
- CN keyword cache: `src/lib/zh/cn-keyword-sidebar-cache.ts`
- CN defer wrappers: `src/components/zh/ZhDonationDeferred.tsx`, `ZhDeferredPostPackageToolClient.tsx`, `ZhDeferredValueProofBlock.tsx`
- API: `src/app/api/generate-package/route.ts`
- Client request: `src/lib/ai/generatePostPackage.ts` (`clientRoute`)

---

## 8. Out of scope (V99)

No multi-country rollout, CDN vendor migration, full BI platform, or broad PSEO expansion—see version spec.
