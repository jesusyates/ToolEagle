# V91 — Traffic Injection System

## Goal

Push internal traffic into proven money pages (from `zh_page_revenue_metrics`, with static fallback) and surface distribution copy tagged **Injection Priority**.

## Injection placements

| Location | Component / behavior |
|----------|----------------------|
| Homepage (below hero showcase) | `TrendingMakeMoneySection` — 🔥 Trending now / **Trending: Make Money with AI** |
| All `/zh/search/*` | `PeopleReadingMoneyBlock` — **🔥 大家正在读这些（高价值）** |
| All `/en/how-to/*` (+ es/pt/id routes using template) | `PeopleReadingMoneyBlock` — **🔥 People are reading this now** |
| Tool results (`ToolResultListCard` + `toolSlug`) | `ToolResultMoneyCta` — **👉 Next step to make money** → top money page |
| `/share/[id]` | `ShareWantMoreMoneyBlock` — **👉 Want more like this?** |
| `/dashboard/distribution` | `InjectionPriorityPackBlock` — top 5 pages × 10 Reddit / X / Quora |

## Data flow

```
zh_page_revenue_metrics (admin) ─┐
                                 ├─► getTrafficInjectionContext()
getLatestKeywordPages + EN how-to fallback ─┘
         │
         ├─► Server components (homepage, zh/en templates, share)
         ├─► GET /api/traffic-injection/summary (tool CTA)
         └─► GET /api/traffic-injection/pack → buildInjectionDistributionPack()
```

## Key files

- `src/lib/traffic-injection-data.ts` — resolve top pages + keywords  
- `src/lib/injection-distribution-pack.ts` — 10×3 variants per page, tag **Injection Priority**  
- `src/components/traffic/*` — UI blocks  
- `src/app/api/traffic-injection/summary/route.ts`  
- `src/app/api/traffic-injection/pack/route.ts`  

## Example UI blocks (copy patterns)

- **Trending strip:** amber/orange gradient, 🔥 label, 6 cards max.  
- **People reading:** orange border, 5 links excluding current slug.  
- **Tool CTA:** violet gradient, single primary link.  
- **Share loop:** emerald card, 5 money links.  
- **Distribution pack:** rose panel, accordion per page, tab Reddit / X / Quora, `ZhCopyButton` per variant.

## Notes

- Without Supabase service role / empty metrics table, **fallback** uses local ZH keywords + EN how-to slugs.  
- Custom `pageClient.tsx` tools already pass `toolSlug` into `ToolResultListCard`, so the money CTA appears there too.
