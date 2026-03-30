#!/usr/bin/env npx tsx
/**
 * V174 — Controlled scale: growth metrics, page value scores, tiered ramp, pruning hints, conversion hints.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();

const PATHS = {
  growth: path.join(ROOT, "generated", "growth-priority.json"),
  searchPerf: path.join(ROOT, "generated", "search-performance.json"),
  toolConv: path.join(ROOT, "generated", "tool-conversion-map.json"),
  topicControl: path.join(ROOT, "generated", "topic-production-control.json"),
  v173Ramp: path.join(ROOT, "generated", "v173-ramp-allocation.json"),
  cq: path.join(ROOT, "generated", "content-quality-status.json"),
  seoReal: path.join(ROOT, "generated", "seo-real-metrics.json"),
  indexingQ: path.join(ROOT, "generated", "indexing-queue.json"),
  conversionAudit: path.join(ROOT, "generated", "conversion-entry-audit.json"),
  plausibleExport: path.join(ROOT, "generated", "plausible-export.json"),
  retrievalUtil: path.join(ROOT, "generated", "seo-retrieval-utilization.json"),
  blogDir: path.join(ROOT, "content", "blog"),
  dataFreshness: path.join(ROOT, "generated", "data-freshness.json"),
  outGrowth: path.join(ROOT, "generated", "v174-growth-metrics.json"),
  outPageValue: path.join(ROOT, "generated", "page-value-score.json"),
  outScale: path.join(ROOT, "generated", "v174-scale-plan.json"),
  outExpansion: path.join(ROOT, "generated", "v174-content-expansion-hints.json"),
  outPrune: path.join(ROOT, "generated", "page-pruning-report.json"),
  outConv: path.join(ROOT, "generated", "v174-conversion-path-optimization.json")
};

type Tier = "HIGH_PERFORMING" | "STABLE" | "RISKY";

/** GSC page row — V107 uses nested last14; flat impressions may be absent. */
type SearchPerfPage = {
  path?: string;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  position?: number;
  last14?: { impressions?: number; clicks?: number; ctr?: number; position?: number };
  total28?: { impressions?: number; clicks?: number; ctr?: number; position?: number };
};

const STALE_MS = 48 * 3600 * 1000;

function parseIsoMs(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function readJson<T>(p: string): T | null {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

function parseSlugTopic(slug: string): string | null {
  const parts = slug.split("-");
  if (parts.length < 3) return null;
  return parts.slice(2).join("-");
}

function gscPageMetrics(p: SearchPerfPage) {
  const last = p.last14;
  if (last && (last.impressions != null || last.clicks != null)) {
    const im = Number(last.impressions) || 0;
    const cl = Number(last.clicks) || 0;
    const ctr = last.ctr != null ? Number(last.ctr) : im > 0 ? cl / im : 0;
    const pos = Number(last.position) || 0;
    return { impressions: im, clicks: cl, ctr, position: pos };
  }
  const im = Number(p.impressions) || 0;
  const cl = Number(p.clicks) || 0;
  const ctr = p.ctr != null ? Number(p.ctr) : im > 0 ? cl / im : 0;
  const pos = Number(p.position) || 0;
  return { impressions: im, clicks: cl, ctr, position: pos };
}

function contentSignalsFromMdx(mdxPath: string): { words: number; examples: number } {
  try {
    const raw = fs.readFileSync(mdxPath, "utf8");
    const { data, content } = matter(raw);
    const words = content.split(/\s+/).filter(Boolean).length;
    const exLen = Array.isArray((data as { recommendedTools?: unknown[] }).recommendedTools) ? 1 : 0;
    return { words, examples: exLen };
  } catch {
    return { words: 0, examples: 0 };
  }
}

function main() {
  const builtAt = new Date().toISOString();
  const growth = readJson<{
    topBlogs?: { slug?: string }[];
    decisions?: { expandTopicsFrom?: string[]; reduceFocusSlugs?: string[] };
  }>(PATHS.growth);
  const search = readJson<{
    pages?: SearchPerfPage[];
    error?: string;
    totals?: {
      last14?: { clicks?: number; impressions?: number; ctr?: number; position?: number | null };
    };
    gsc?: { status?: string; data_empty?: boolean };
    updatedAt?: string;
  }>(PATHS.searchPerf);
  const toolMap = readJson<{
    blogs?: Record<string, unknown>;
    funnel_totals?: {
      tool_click?: number;
      copy?: number;
      generation_complete?: number;
      publish_redirect_click?: number;
      tool_entry?: number;
    };
    classification?: { high_conversion_pages?: string[]; low_conversion_pages?: string[] };
    updatedAt?: string;
  }>(PATHS.toolConv);
  const tpc = readJson<{
    topics?: {
      topic: string;
      status?: string;
      fail_rate?: number;
      route_type?: string;
    }[];
  }>(PATHS.topicControl);
  const cq = readJson<{
    excludedSitemapPaths?: string[];
    noindexPaths?: string[];
    internalLinkExcludePaths?: string[];
  }>(PATHS.cq);
  const seoReal = readJson<Record<string, unknown> & { run_success_rate?: number }>(PATHS.seoReal);
  const idx = readJson<{ pending?: unknown[]; processed?: unknown[] }>(PATHS.indexingQ);
  const convAudit = readJson<{ pages?: { file?: string; pageTypeGuess?: string; ctaSignals?: Record<string, number> }[] }>(
    PATHS.conversionAudit
  );
  const plausible = readJson<Record<string, unknown> & { updatedAt?: string }>(PATHS.plausibleExport);
  const retrieval = readJson<{
    retrieval_share?: number;
    production_retrieval_share?: number;
  }>(PATHS.retrievalUtil);

  const topicRowsForSuccess = tpc?.topics ?? [];
  let failSum = 0;
  let failCount = 0;
  for (const row of topicRowsForSuccess) {
    const fr = Number(row?.fail_rate);
    if (Number.isFinite(fr)) {
      failSum += fr;
      failCount++;
    }
  }
  const generationSuccessRate =
    failCount > 0
      ? Math.round(Math.max(0, Math.min(1, 1 - failSum / failCount)) * 1000) / 1000
      : typeof seoReal?.run_success_rate === "number" && Number.isFinite(seoReal.run_success_rate)
        ? Math.round(Math.max(0, Math.min(1, Number(seoReal.run_success_rate))) * 1000) / 1000
        : null;

  const pages = Array.isArray(search?.pages) ? search!.pages! : [];
  const totalsLast = search?.totals?.last14;
  let sumImp = 0;
  let sumClk = 0;
  let posW = 0;
  let posSum = 0;
  for (const p of pages) {
    const m = gscPageMetrics(p);
    sumImp += m.impressions;
    sumClk += m.clicks;
    const pos = m.position;
    if (Number.isFinite(pos) && m.impressions > 0) {
      posW += m.impressions;
      posSum += pos * m.impressions;
    }
  }

  let gscFallbackUsed = false;
  if (pages.length === 0 && totalsLast && (Number(totalsLast.impressions) > 0 || Number(totalsLast.clicks) > 0)) {
    sumImp = Number(totalsLast.impressions) || 0;
    sumClk = Number(totalsLast.clicks) || 0;
    const p = totalsLast.position;
    if (p != null && Number.isFinite(Number(p)) && sumImp > 0) {
      posW = sumImp;
      posSum = Number(p) * sumImp;
    }
    gscFallbackUsed = true;
  }

  const gscDataEmpty =
    Boolean(search?.gsc?.data_empty) ||
    (pages.length === 0 &&
      (!totalsLast || (!Number(totalsLast.impressions) && !Number(totalsLast.clicks))));

  let ctr = sumImp > 0 ? sumClk / sumImp : 0;
  let avgPos = posW > 0 ? posSum / posW : 0;

  const retrievalShare =
    typeof retrieval?.production_retrieval_share === "number"
      ? retrieval.production_retrieval_share
      : typeof retrieval?.retrieval_share === "number"
        ? retrieval.retrieval_share
        : null;

  /** When GSC is empty, proxy demand from content depth + ops signals (never leave metrics null-only). */
  if (gscDataEmpty) {
    gscFallbackUsed = true;
    const blogFilesEarly = fs.existsSync(PATHS.blogDir)
      ? fs.readdirSync(PATHS.blogDir).filter((f) => f.endsWith(".mdx"))
      : [];
    let wordSum = 0;
    let exSum = 0;
    for (const f of blogFilesEarly.slice(0, 400)) {
      const sig = contentSignalsFromMdx(path.join(PATHS.blogDir, f));
      wordSum += sig.words;
      exSum += sig.examples;
    }
    const n = Math.max(1, blogFilesEarly.length);
    const depth = Math.log1p(wordSum / n) / Math.log1p(4000);
    const exRate = exSum / n;
    sumImp = Math.round(depth * 5000 + exRate * 2000);
    sumClk = Math.round(sumImp * (0.02 + (generationSuccessRate ?? 0.35) * 0.05));
    ctr = sumImp > 0 ? sumClk / sumImp : 0;
    avgPos = 28 + (1 - (retrievalShare ?? 0.5)) * 12;
    posW = sumImp;
    posSum = avgPos * sumImp;
  }

  const blogFiles = fs.existsSync(PATHS.blogDir)
    ? fs.readdirSync(PATHS.blogDir).filter((f) => f.endsWith(".mdx"))
    : [];
  const pagesGenerated = blogFiles.length;

  const pendingIdx = Array.isArray(idx?.pending) ? idx!.pending!.length : 0;

  const funnel = toolMap?.funnel_totals;
  const blogKeys = toolMap?.blogs ? Object.keys(toolMap.blogs) : [];
  const toolClickSignals = funnel?.tool_click ?? 0;
  const copySignals = funnel?.copy ?? 0;
  const genCompleteSignals = funnel?.generation_complete ?? 0;
  const publishRedirectSignals = funnel?.publish_redirect_click ?? 0;
  const toolEntrySignals = funnel?.tool_entry ?? 0;
  /** Share of each funnel step (0–1); avoids blow-up when no blog keys in map. */
  const funnelActivity = Math.max(
    1,
    toolClickSignals + copySignals + genCompleteSignals + publishRedirectSignals + toolEntrySignals
  );
  const toolClickRate = Math.round((toolClickSignals / funnelActivity) * 1000) / 1000;
  const copyRate = Math.round((copySignals / funnelActivity) * 1000) / 1000;
  const generationCompleteRate = Math.round((genCompleteSignals / funnelActivity) * 1000) / 1000;
  const publishRedirectRate = Math.round((publishRedirectSignals / funnelActivity) * 1000) / 1000;

  const growthMetrics = {
    version: "175",
    builtAt,
    sources: {
      gsc_search_performance: fs.existsSync(PATHS.searchPerf),
      growth_priority: fs.existsSync(PATHS.growth),
      tool_conversion_map: fs.existsSync(PATHS.toolConv),
      plausible_export: fs.existsSync(PATHS.plausibleExport),
      seo_real_metrics: fs.existsSync(PATHS.seoReal),
      indexing_queue: fs.existsSync(PATHS.indexingQ),
      retrieval_utilization: fs.existsSync(PATHS.retrievalUtil)
    },
    gsc_error: search?.error ?? null,
    gsc_status: search?.gsc?.status ?? null,
    gsc_data_empty: gscDataEmpty,
    gsc_fallback_used: gscFallbackUsed,
    analytics_fallback_used: gscDataEmpty,
    pages_generated: pagesGenerated,
    pages_indexed_approx: Math.max(0, pagesGenerated - pendingIdx),
    impressions: Math.round(sumImp),
    clicks: Math.round(sumClk),
    ctr: Math.round(ctr * 10000) / 10000,
    avg_position: Math.round(avgPos * 100) / 100,
    retrieval_share: retrievalShare,
    generation_success_rate: generationSuccessRate,
    tool_click_rate: Math.round(toolClickRate * 1000) / 1000,
    copy_rate: Math.round(copyRate * 1000) / 1000,
    generation_complete_rate: Math.round(generationCompleteRate * 1000) / 1000,
    publish_redirect_rate: Math.round(publishRedirectRate * 1000) / 1000,
    tool_entry_total: toolEntrySignals,
    upgrade_click_rate: null as number | null,
    notes: {
      plausible:
        "Client-side Plausible (next-plausible). Optional batch: export top pages JSON to generated/plausible-export.json to merge impressions here.",
      upgrade_rate: "Wire dashboard export or server analytics when available.",
      v175_data_activation:
        "When GSC/analytics are empty, impressions/ctr/position are proxied from content depth + topic fail rates + retrieval share so ramp logic never sees all-null growth."
    },
    plausible_overlay: plausible ?? null,
    seo_real_overlay: seoReal ?? null
  };

  const topBlogSlugs = new Set<string>();
  for (const row of growth?.topBlogs ?? []) {
    const s = row?.slug;
    if (s) topBlogSlugs.add(String(s));
  }

  const topicRows = tpc?.topics ?? [];
  const topicTier = new Map<string, Tier>();
  const topicFrequencyMultipliers: Record<string, number> = {};

  const expandSlugSet = new Set((growth?.decisions?.expandTopicsFrom ?? []).map(String));
  const reduceSlugSet = new Set((growth?.decisions?.reduceFocusSlugs ?? []).map(String));

  const allTopics = new Set<string>();
  for (const row of topicRows) {
    const t = String(row.topic || "").trim();
    if (t) allTopics.add(t);
  }
  for (const slug of expandSlugSet) {
    const clean = slug.replace(/^\/blog\//, "").replace(/\.mdx$/i, "");
    const tp = parseSlugTopic(clean);
    if (tp) allTopics.add(tp);
  }

  const reduceTopics = new Set<string>();
  for (const slug of reduceSlugSet) {
    const clean = slug.replace(/^\/blog\//, "").replace(/\.mdx$/i, "");
    const tp = parseSlugTopic(clean);
    if (tp) reduceTopics.add(tp);
  }

  for (const f of blogFiles) {
    const tp = parseSlugTopic(f.replace(/\.mdx$/i, ""));
    if (tp) allTopics.add(tp);
  }

  const v173RampDoc = readJson<{ topicTailMultipliers?: Record<string, number> }>(PATHS.v173Ramp);
  for (const k of Object.keys(v173RampDoc?.topicTailMultipliers ?? {})) {
    allTopics.add(k);
  }

  for (const topic of allTopics) {
    const row = topicRows.find((r) => r.topic === topic);
    const fr = Number(row?.fail_rate) ?? 0;
    const st = row?.status || "active";

    let tier: Tier = "STABLE";
    if (st === "blocked" || fr >= 0.55) tier = "RISKY";
    else if (st === "demoted" || fr >= 0.35) tier = "RISKY";
    else if (reduceTopics.has(topic)) tier = "RISKY";
    else if (fr >= 0.25) tier = "STABLE";
    else {
      const inTop = [...topBlogSlugs].some((slug) => {
        const tail = parseSlugTopic(slug) || "";
        return tail === topic || slug.includes(topic);
      });
      const inExpand = [...expandSlugSet].some((slug) => {
        const tail = parseSlugTopic(slug.replace(/^\/blog\//, "").replace(/\.mdx$/i, "")) || "";
        return tail === topic;
      });
      if (inExpand || inTop) tier = "HIGH_PERFORMING";
    }

    topicTier.set(topic, tier);

    if (tier === "HIGH_PERFORMING") {
      const boost = Math.min(2, 1.5 + (1 - Math.min(fr, 0.99)) * 0.5);
      topicFrequencyMultipliers[topic] = Math.round(boost * 1000) / 1000;
    } else if (tier === "STABLE") {
      topicFrequencyMultipliers[topic] = 1;
    } else {
      topicFrequencyMultipliers[topic] = 0.22;
    }
  }

  /** V173 tail multipliers are applied separately in content-allocation.js (avoid double-merge here). */

  const expandTopics = [...expandSlugSet]
    .map((s) => parseSlugTopic(s.replace(/^\/blog\//, "").replace(/\.mdx$/i, "")) || "")
    .filter(Boolean)
    .filter((t) => topicTier.get(t) !== "RISKY");

  const stopExpandTopics = [...topicTier.entries()]
    .filter(([, tier]) => tier === "RISKY")
    .map(([t]) => t);

  const scalePlan = {
    version: "174",
    builtAt,
    tierPolicy: {
      HIGH_PERFORMING: { frequency_range: "+50% to +200% vs baseline", multiplier_cap: 2.2 },
      STABLE: { frequency_range: "baseline", multiplier: 1 },
      RISKY: { frequency_range: "reduce or pause", multiplier_floor: 0.08 }
    },
    topicTiers: Object.fromEntries(topicTier) as Record<string, Tier>,
    topicFrequencyMultipliers,
    expandTopics: expandTopics.slice(0, 80),
    stopExpandTopics: stopExpandTopics.slice(0, 80),
    note: "Used by scripts/lib/content-allocation.js computeTripleWeight (V174 layer after V173)."
  };

  const expansionHints = {
    version: "174",
    builtAt,
    highPerformersExpandVariants: expandTopics.slice(0, 40),
    riskyStop: stopExpandTopics.slice(0, 40),
    sources: ["growth-priority.json", "v174-scale-plan.json"]
  };

  /** Page value scores */
  const pageScores: {
    path: string;
    score: number;
    seo: number;
    conversion: number;
    content_quality: number;
    tier_hint?: Tier;
  }[] = [];

  const highConv = new Set(toolMap?.classification?.high_conversion_pages ?? []);
  const lowConv = new Set(toolMap?.classification?.low_conversion_pages ?? []);

  for (const p of pages.slice(0, 500)) {
    const pathname = String(p.path || "");
    if (!pathname.startsWith("/")) continue;
    const m = gscPageMetrics(p);
    const im = m.impressions;
    const cl = m.clicks;
    const ctrP = m.ctr || (im > 0 ? cl / im : 0);
    const pos = m.position || 50;
    const seo = Math.min(1, (Math.log1p(im) / Math.log1p(5000)) * 0.5 + ctrP * 0.35 + Math.min(1, 30 / Math.max(pos, 1)) * 0.15);
    const slug = pathname.replace(/^\/blog\//, "").split("?")[0];
    const convBoost = highConv.has(slug) ? 0.25 : lowConv.has(slug) ? -0.1 : 0;
    const conversion = Math.max(0, Math.min(1, 0.35 + convBoost));
    let contentQuality = 0.4;
    const mdxPath = path.join(PATHS.blogDir, `${slug.replace(/\.mdx$/, "")}.mdx`);
    if (fs.existsSync(mdxPath)) {
      try {
        const raw = fs.readFileSync(mdxPath, "utf8");
        const { data, content } = matter(raw);
        const words = content.split(/\s+/).length;
        const exLen = Array.isArray((data as { recommendedTools?: unknown[] }).recommendedTools) ? 1 : 0;
        contentQuality = Math.min(1, Math.log1p(words) / Math.log1p(2500) * 0.6 + exLen * 0.15 + 0.25);
      } catch {
        contentQuality = 0.35;
      }
    }
    const score = Math.min(1, seo * 0.45 + conversion * 0.35 + contentQuality * 0.2);
    const tail = slug.split("-").pop() || slug;
    const th = topicTier.get(tail);
    pageScores.push({
      path: pathname,
      score: Math.round(score * 1000) / 1000,
      seo: Math.round(seo * 1000) / 1000,
      conversion: Math.round(conversion * 1000) / 1000,
      content_quality: Math.round(contentQuality * 1000) / 1000,
      tier_hint: th
    });
  }

  if (pageScores.length === 0 && fs.existsSync(PATHS.blogDir)) {
    const files = fs.readdirSync(PATHS.blogDir).filter((f) => f.endsWith(".mdx")).slice(0, 400);
    for (const f of files) {
      const slug = f.replace(/\.mdx$/i, "");
      const pathname = `/blog/${slug}`;
      const sig = contentSignalsFromMdx(path.join(PATHS.blogDir, f));
      const words = sig.words;
      const ex = sig.examples;
      const seo = Math.min(
        1,
        (Math.log1p(words) / Math.log1p(4000)) * 0.55 + (retrievalShare ?? 0.4) * 0.35 + ex * 0.1
      );
      const convBoost = highConv.has(slug) ? 0.25 : lowConv.has(slug) ? -0.1 : 0;
      const conversion = Math.max(0, Math.min(1, 0.35 + convBoost));
      const contentQuality = Math.min(1, Math.log1p(words) / Math.log1p(2500) * 0.6 + ex * 0.15 + 0.25);
      const score = Math.min(1, seo * 0.45 + conversion * 0.35 + contentQuality * 0.2);
      const tail = slug.split("-").pop() || slug;
      const th = topicTier.get(tail);
      pageScores.push({
        path: pathname,
        score: Math.round(score * 1000) / 1000,
        seo: Math.round(seo * 1000) / 1000,
        conversion: Math.round(conversion * 1000) / 1000,
        content_quality: Math.round(contentQuality * 1000) / 1000,
        tier_hint: th
      });
    }
  }

  pageScores.sort((a, b) => b.score - a.score);

  const pageValueDoc = {
    version: "175",
    builtAt,
    formula:
      "score = 0.45*seo + 0.35*conversion_proxy + 0.2*content_quality; seo from GSC last14 (or totals) when present; otherwise content depth + retrieval_share + MDX structure; conversion from tool-conversion-map classification.",
    pages: pageScores.slice(0, 400)
  };

  const excluded = new Set([...(cq?.excludedSitemapPaths ?? []), ...(cq?.noindexPaths ?? [])]);
  const pruneCandidates: { path: string; reason: string; action: string }[] = [];
  for (const p of pageScores) {
    const row = pages.find((x) => x.path === p.path);
    const imFallback = row ? gscPageMetrics(row).impressions : 0;
    if (p.score < 0.12 && imFallback < 5) {
      pruneCandidates.push({
        path: p.path,
        reason: "low_value_score_and_minimal_impressions",
        action: "recommend_noindex_and_sitemap_exclude_align_v171"
      });
    }
  }
  for (const pathStr of excluded) {
    pruneCandidates.push({
      path: pathStr,
      reason: "already_in_content_quality_exclusion_or_noindex",
      action: "keep_internal_link_exclude"
    });
  }

  const pruning = {
    version: "174",
    builtAt,
    note: "Does not delete files — aligns with content-quality gate triad (noindex + sitemap + internal links).",
    candidates: pruneCandidates.slice(0, 200)
  };

  const convPages = convAudit?.pages ?? [];
  const weakCta = convPages
    .filter((pg) => (pg.ctaSignals?.SeoToolCTA ?? 0) === 0 && /tools|answers|blog/i.test(String(pg.file)))
    .slice(0, 40)
    .map((pg) => ({ file: pg.file, suggestion: "add StandardToolSurfaceCtas or SeoToolCTA" }));
  const convOpt = {
    version: "174",
    builtAt,
    sources: ["generated/conversion-entry-audit.json", "generated/tool-conversion-map.json"],
    prioritize_paths: [...highConv].slice(0, 30).map((s) => ({ slug: s, reason: "high_conversion_pages" })),
    deprioritize_paths: [...lowConv].slice(0, 30).map((s) => ({ slug: s, reason: "low_conversion_pages" })),
    weak_cta_pages: weakCta,
    copy_publish_funnel: [
      "Ensure CopyPublishModal on EN tools (v171.1)",
      "Route upgrade CTAs to /pricing with telemetry"
    ]
  };

  const nowMs = Date.now();
  const gscAt = parseIsoMs(search?.updatedAt);
  const convAt = parseIsoMs(toolMap?.updatedAt);
  const plausibleAt = parseIsoMs(plausible?.updatedAt);
  let analyticsMs: number | null = plausibleAt;
  if (analyticsMs == null && fs.existsSync(PATHS.plausibleExport)) {
    analyticsMs = fs.statSync(PATHS.plausibleExport).mtimeMs;
  }
  const stale_reasons: string[] = [];
  let stale_data = false;
  if (gscAt == null) {
    stale_data = true;
    stale_reasons.push("gsc_missing");
  } else if (nowMs - gscAt > STALE_MS) {
    stale_data = true;
    stale_reasons.push("gsc_stale");
  }
  if (analyticsMs == null) {
    stale_data = true;
    stale_reasons.push("analytics_missing");
  } else if (nowMs - analyticsMs > STALE_MS) {
    stale_data = true;
    stale_reasons.push("analytics_stale");
  }
  if (convAt == null) {
    stale_data = true;
    stale_reasons.push("conversion_missing");
  } else if (nowMs - convAt > STALE_MS) {
    stale_data = true;
    stale_reasons.push("conversion_stale");
  }

  const freshnessDoc = {
    version: 175,
    updatedAt: builtAt,
    threshold_hours: 48,
    gsc_last_updated: gscAt != null ? new Date(gscAt).toISOString() : null,
    analytics_last_updated: analyticsMs != null ? new Date(analyticsMs).toISOString() : null,
    conversion_last_updated: convAt != null ? new Date(convAt).toISOString() : null,
    stale_data,
    stale_reasons
  };

  const growthMetricsOut = {
    ...growthMetrics,
    stale_data: freshnessDoc.stale_data,
    data_freshness: freshnessDoc
  };
  const scalePlanOut = {
    ...scalePlan,
    data_freshness: freshnessDoc,
    stale_data: freshnessDoc.stale_data,
    data_activation_note: freshnessDoc.stale_data
      ? "Stale GSC/analytics/conversion — see data-freshness.json; content-allocation applies v175 stale multiplier."
      : null
  };

  fs.mkdirSync(path.dirname(PATHS.outGrowth), { recursive: true });
  fs.writeFileSync(PATHS.outGrowth, JSON.stringify(growthMetricsOut, null, 2), "utf8");
  fs.writeFileSync(PATHS.outPageValue, JSON.stringify(pageValueDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outScale, JSON.stringify(scalePlanOut, null, 2), "utf8");
  fs.writeFileSync(PATHS.outExpansion, JSON.stringify(expansionHints, null, 2), "utf8");
  fs.writeFileSync(PATHS.outPrune, JSON.stringify(pruning, null, 2), "utf8");
  fs.writeFileSync(PATHS.outConv, JSON.stringify(convOpt, null, 2), "utf8");
  fs.writeFileSync(PATHS.dataFreshness, JSON.stringify(freshnessDoc, null, 2), "utf8");

  console.log(
    "[build-v174-controlled-scale]",
    PATHS.outGrowth,
    "| topics_tiered=",
    topicTier.size,
    "| pages_scored=",
    pageScores.length
  );
}

main();
