#!/usr/bin/env npx tsx
/**
 * V176 — Growth execution layer: winners, low-CTR fixes, conversion amplification,
 * internal-link weights, light A/B variants, revenue signals.
 *
 * Only optimizes paths with measurable signals (GSC, funnel, or tool-output rollup).
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { toolsForEnglishSite } from "../src/config/tools";

const ROOT = process.cwd();

const PATHS = {
  pageValue: path.join(ROOT, "generated", "page-value-score.json"),
  growthMetrics: path.join(ROOT, "generated", "v174-growth-metrics.json"),
  searchPerf: path.join(ROOT, "generated", "search-performance.json"),
  toolConv: path.join(ROOT, "generated", "tool-conversion-map.json"),
  convPath: path.join(ROOT, "generated", "v174-conversion-path-optimization.json"),
  dataFreshness: path.join(ROOT, "generated", "data-freshness.json"),
  toolEvents: path.join(ROOT, "generated", "tool-click-events.jsonl"),
  blogDir: path.join(ROOT, "content", "blog"),
  outWinners: path.join(ROOT, "generated", "v176-top-winners.json"),
  outLowCtr: path.join(ROOT, "generated", "v176-low-ctr-fix.json"),
  outConvAmp: path.join(ROOT, "generated", "v176-conversion-path-amplify.json"),
  outLinkWeights: path.join(ROOT, "generated", "v176-internal-link-weights.json"),
  outAb: path.join(ROOT, "generated", "v176-ab-test.json"),
  outRevenue: path.join(ROOT, "generated", "v176-revenue-signals.json")
};

function readJson<T>(p: string): T | null {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

type GscPage = {
  path?: string;
  last14?: { impressions?: number; clicks?: number; ctr?: number; position?: number };
  impressions?: number;
  clicks?: number;
  ctr?: number;
  position?: number;
};

function gscMetrics(p: GscPage) {
  const l = p.last14;
  if (l) {
    const im = Number(l.impressions) || 0;
    const cl = Number(l.clicks) || 0;
    const ctr = l.ctr != null ? Number(l.ctr) : im > 0 ? cl / im : 0;
    return { impressions: im, clicks: cl, ctr, position: Number(l.position) || 0 };
  }
  const im = Number(p.impressions) || 0;
  const cl = Number(p.clicks) || 0;
  const ctr = p.ctr != null ? Number(p.ctr) : im > 0 ? cl / im : 0;
  return { impressions: im, clicks: cl, ctr, position: Number(p.position) || 0 };
}

function parseBlogSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/blog/")) return null;
  const rest = pathname.replace(/\/$/, "").slice("/blog/".length);
  if (!rest || rest.includes("/")) return null;
  return rest;
}

function parseSlugMeta(slug: string): { platform: string; contentType: string; topic: string } | null {
  const parts = slug.split("-");
  if (parts.length < 3) return null;
  return { platform: parts[0], contentType: parts[1], topic: parts.slice(2).join("-") };
}

function titleCaseWords(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pickToolsForPlatform(platform: string, n: number): { slug: string; href: string; label: string }[] {
  const en = toolsForEnglishSite.filter((t) => !t.slug.startsWith("douyin-"));
  const plat = platform.toLowerCase();
  const match = en.filter((t) => t.slug.includes(plat) || (plat === "tiktok" && t.slug.includes("tiktok")));
  const pool = match.length ? match : en;
  return pool.slice(0, n).map((t) => ({
    slug: t.slug,
    href: `/tools/${t.slug}`,
    label: t.name
  }));
}

function readBlogFrontmatter(slug: string): { title: string; description: string; h1: string } | null {
  const fp = path.join(PATHS.blogDir, `${slug}.mdx`);
  if (!fs.existsSync(fp)) return null;
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const { data, content } = matter(raw);
    const title = String((data as { title?: string }).title || "");
    const description = String((data as { description?: string }).description || "");
    const h1m = content.match(/^#\s+(.+)$/m);
    const h1 = h1m ? h1m[1].trim() : "";
    return { title, description, h1: h1 || title };
  } catch {
    return null;
  }
}

function readJsonlEvents(p: string): Record<string, unknown>[] {
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Record<string, unknown>[];
}

function main() {
  const builtAt = new Date().toISOString();
  const pageValue = readJson<{
    pages?: { path: string; score: number; seo?: number; conversion?: number }[];
  }>(PATHS.pageValue);
  const growth = readJson<Record<string, unknown>>(PATHS.growthMetrics);
  const search = readJson<{
    pages?: GscPage[];
    gsc?: { data_empty?: boolean };
    totals?: { last14?: { impressions?: number; clicks?: number } };
  }>(PATHS.searchPerf);
  const toolMap = readJson<{
    funnel_totals?: Record<string, number>;
    tool_output_quality_rollup?: {
      by_tool_copies?: Record<string, number>;
      by_tool_generations?: Record<string, number>;
    };
    classification?: { high_conversion_pages?: string[] };
  }>(PATHS.toolConv);
  const convOpt = readJson<Record<string, unknown>>(PATHS.convPath);
  const freshness = readJson<{ stale_data?: boolean }>(PATHS.dataFreshness);

  const gscByPath = new Map<string, ReturnType<typeof gscMetrics>>();
  for (const p of search?.pages || []) {
    const pathname = String(p.path || "");
    if (pathname) gscByPath.set(pathname, gscMetrics(p));
  }

  const hasGscRows = (search?.pages?.length || 0) > 0 && search?.gsc?.data_empty !== true;
  const totalsLast = search?.totals?.last14;
  const hasAggregateSignal =
    totalsLast != null &&
    (Number(totalsLast.impressions) > 0 || Number(totalsLast.clicks) > 0);

  const scored = (pageValue?.pages || []).map((row) => {
    const m = gscByPath.get(row.path) || { impressions: 0, clicks: 0, ctr: 0, position: 0 };
    const slug = parseBlogSlugFromPath(row.path);
    return {
      ...row,
      slug,
      impressions: m.impressions,
      clicks: m.clicks,
      ctr: m.ctr,
      has_signal: m.impressions > 0 || m.clicks > 0
    };
  });

  const withSignal = scored.filter((r) => r.has_signal);
  const pool = withSignal.length >= 3 ? withSignal : scored;
  const sortedPool = [...pool].sort((a, b) => b.score - a.score);
  const k = Math.max(1, Math.ceil(sortedPool.length * 0.1));
  const winnersRaw = sortedPool.slice(0, k);

  const allSlugs = new Set(scored.map((r) => r.slug).filter(Boolean) as string[]);
  const relatedByTopic = (slug: string, exclude: string): string[] => {
    const meta = parseSlugMeta(slug);
    if (!meta) return [];
    const out: string[] = [];
    for (const s of allSlugs) {
      if (s === exclude) continue;
      if (s.includes(meta.topic) || meta.topic.includes(s.split("-").slice(2).join("-"))) {
        out.push(s);
      }
      if (out.length >= 6) break;
    }
    return out;
  };

  const winners = winnersRaw.map((w) => {
    const slug = w.slug || parseBlogSlugFromPath(w.path) || "";
    const meta = parseSlugMeta(slug);
    const tools = meta ? pickToolsForPlatform(meta.platform, 4) : pickToolsForPlatform("tiktok", 4);
    const related = relatedByTopic(slug, slug).slice(0, 5);
    const answers = [
      { href: "/answers", label: "Browse creator answers" },
      { href: "/tools", label: "Tool directory (high-intent)" }
    ];
    return {
      path: w.path,
      slug,
      score: w.score,
      impressions: w.impressions,
      clicks: w.clicks,
      ctr: Math.round(w.ctr * 10000) / 10000,
      actions: {
        internal_links: {
          tools: tools.map((t) => ({ ...t, reason: "winner_amplification_same_platform" })),
          answers,
          related_blogs: related.map((s) => ({
            href: `/blog/${s}`,
            slug: s,
            reason: "same_topic_cluster"
          }))
        },
        cta_priority: ["upgrade_pricing", "primary_tool_try", "related_tool_grid"],
        related_pages_expand: related.slice(0, 4)
      }
    };
  });

  /** Low CTR: impressions floor + CTR below cohort median or absolute 2%. */
  const gscBlogRows = (search?.pages || [])
    .filter((p) => String(p.path || "").startsWith("/blog/"))
    .map((p) => ({ path: p.path!, ...gscMetrics(p) }))
    .filter((r) => r.impressions >= 15);

  const ctrVals = gscBlogRows.map((r) => r.ctr).filter((c) => c >= 0);
  ctrVals.sort((a, b) => a - b);
  const medianCtr = ctrVals.length ? ctrVals[Math.floor(ctrVals.length / 2)] : 0.02;
  const lowCtrRows = gscBlogRows.filter(
    (r) => r.impressions >= 20 && (r.ctr < 0.02 || (medianCtr > 0 && r.ctr < medianCtr * 0.6))
  );

  const lowCtrFixes = lowCtrRows.slice(0, 40).map((row) => {
    const slug = parseBlogSlugFromPath(row.path) || "";
    const fm = slug ? readBlogFrontmatter(slug) : null;
    const topicTitle = slug ? titleCaseWords(parseSlugMeta(slug)?.topic || slug) : "Creator";
    const baseTitle = fm?.title || topicTitle;
    const baseDesc = fm?.description || "";
    const h1Now = fm?.h1 || baseTitle;
    return {
      path: row.path,
      slug,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 10000) / 10000,
      clicks: row.clicks,
      current: {
        title: baseTitle,
        meta_description: baseDesc.slice(0, 160),
        h1: h1Now
      },
      rewrite_suggestions: {
        title_a: `${baseTitle} (Updated ${new Date().getFullYear()})`,
        title_b: `${topicTitle}: Practical Tips & Templates`,
        meta_description: `${baseDesc.slice(0, 90)} Clear steps, examples, and free tools — optimized for search.`.slice(
          0,
          155
        ),
        h1: `${topicTitle}: What Works Now`
      },
      note: "Apply only frontmatter title/description + first H1 — do not rewrite full body (V176)."
    };
  });

  /** Cold generation: gen events but low copy ratio on tool. */
  const rollup = toolMap?.tool_output_quality_rollup;
  const byGen = rollup?.by_tool_generations || {};
  const byCopy = rollup?.by_tool_copies || {};
  const coldTools = Object.keys(byGen)
    .map((slug) => {
      const g = Number(byGen[slug]) || 0;
      const c = Number(byCopy[slug]) || 0;
      return { slug, generations: g, copies: c, copy_rate: g > 0 ? c / g : 0 };
    })
    .filter((t) => t.generations >= 2 && t.copy_rate < 0.25);

  const funnel = toolMap?.funnel_totals || {};
  const copyToPublishStrength =
    (Number(funnel.copy) || 0) > 0 && (Number(funnel.generation_complete) || 0) > 0
      ? Math.min(1, (Number(funnel.copy) || 0) / Math.max(1, Number(funnel.generation_complete) || 1))
      : null;

  const topCopyTools = Object.entries(byCopy)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([slug, n]) => ({ tool_slug: slug, copy_events: n }));

  const conversionAmplify = {
    version: "176",
    builtAt,
    inputs_ok: Boolean(toolMap && convOpt),
    funnel_totals: funnel,
    copy_to_generation_ratio: copyToPublishStrength,
    high_copy_tools: topCopyTools,
    cold_generation_tools: coldTools,
    actions: [
      "Add blog + answers cross-links pointing to high-copy tools above",
      "Strengthen CopyPublishModal CTA copy on tools in cold_generation_tools",
      "Route upgrade CTAs to /pricing with consistent telemetry (see v174-conversion-path-optimization)",
      ...((convOpt?.copy_publish_funnel as string[]) || [])
    ],
    prioritize_tools_for_cta: coldTools.slice(0, 8).map((t) => t.slug)
  };

  const boost_slugs = winners.map((w) => w.slug).filter(Boolean);
  const lowScoreCut = [...scored].sort((a, b) => a.score - b.score)[Math.floor(scored.length * 0.2)]?.score ?? 0;
  const reduce_slugs = scored
    .filter((r) => r.score <= lowScoreCut && (r.impressions || 0) < 10)
    .map((r) => r.slug)
    .filter(Boolean) as string[];

  const linkWeights = {
    version: "176",
    builtAt,
    boost_slugs,
    reduce_slugs: [...new Set(reduce_slugs)].slice(0, 80),
    link_score_boost_bonus: 0.22,
    link_score_reduce_penalty: 0.12,
    note: "Consumed by scripts/lib/en-internal-linking.js — biases related-page picks toward winners."
  };

  /** A/B: title + CTA variants for winners (max 12) + low-CTR (max 12). */
  const abVariants: {
    page: string;
    slug: string;
    axis: "title" | "cta";
    variant_a: string;
    variant_b: string;
    measurement: string;
  }[] = [];

  for (const w of winners.slice(0, 12)) {
    const slug = w.slug;
    const fm = slug ? readBlogFrontmatter(slug) : null;
    const t = fm?.title || slug;
    abVariants.push({
      page: w.path,
      slug,
      axis: "title",
      variant_a: t,
      variant_b: `${t.split("—")[0].trim()} — Templates & Examples`,
      measurement: "Compare CTR in GSC after deploy; keep winner after 14d"
    });
    abVariants.push({
      page: w.path,
      slug,
      axis: "cta",
      variant_a: "Try the free generator",
      variant_b: "Generate your next post in one click",
      measurement: "Track tool_click + upgrade_clicked from this page segment"
    });
  }

  for (const row of lowCtrFixes.slice(0, 8)) {
    abVariants.push({
      page: row.path,
      slug: row.slug,
      axis: "title",
      variant_a: row.current.title,
      variant_b: row.rewrite_suggestions.title_b,
      measurement: "GSC CTR delta vs control week"
    });
  }

  const abDoc = {
    version: "176",
    builtAt,
    scope: "title_and_cta_only",
    variants: abVariants,
    rules: [
      "Deploy one variant per URL at a time (no multivariate on same URL)",
      "Record deploy date; compare GSC last 14d vs prior 14d"
    ]
  };

  /** Revenue / upgrade signals from JSONL + funnel. */
  const events = readJsonlEvents(PATHS.toolEvents);
  let pricingTouch = 0;
  let upgradeClick = 0;
  for (const e of events) {
    const ref = String(e.referrer || "");
    if (ref.includes("/pricing")) pricingTouch += 1;
  }
  for (const e of events) {
    if (String(e.type) === "upgrade_clicked" || String(e.event_type) === "upgrade_clicked") upgradeClick += 1;
  }

  const highConvSlugs = toolMap?.classification?.high_conversion_pages || [];
  const revenueDoc = {
    version: "176",
    builtAt,
    upgrade_click_events_observed: upgradeClick,
    pricing_referrer_touchpoints: pricingTouch,
    funnel_publish_redirect: Number(funnel.publish_redirect_click) || 0,
    conversion_rate_proxy:
      copyToPublishStrength != null ? Math.round(copyToPublishStrength * 1000) / 1000 : null,
    high_conversion_blog_slugs: highConvSlugs,
    high_value_pages_sample: winners.slice(0, 15).map((w) => ({ path: w.path, score: w.score })),
    note: "Server-side upgrade streams may live outside tool-click-events.jsonl — this is the minimum on-disk signal."
  };

  const gate = {
    has_gsc_page_rows: hasGscRows,
    has_gsc_aggregate: hasAggregateSignal,
    stale_data: freshness?.stale_data === true,
    growth_metrics_version: growth?.version ?? null
  };

  const winnersDoc = {
    version: "176",
    builtAt,
    criteria:
      "Top ~10% of scored blog pages by page-value score, preferring rows with GSC impressions/clicks; falls back to score-only when GSC empty.",
    gate,
    winners
  };

  const lowCtrDoc = {
    version: "176",
    builtAt,
    criteria: "Blog URLs with impressions>=20 and CTR below 2% or below ~60% of cohort median.",
    gate,
    has_search_signals: gscBlogRows.length > 0,
    fixes: lowCtrFixes,
    cold_generation_tools: coldTools
  };

  fs.mkdirSync(path.dirname(PATHS.outWinners), { recursive: true });
  fs.writeFileSync(PATHS.outWinners, JSON.stringify(winnersDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outLowCtr, JSON.stringify(lowCtrDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outConvAmp, JSON.stringify(conversionAmplify, null, 2), "utf8");
  fs.writeFileSync(PATHS.outLinkWeights, JSON.stringify(linkWeights, null, 2), "utf8");
  fs.writeFileSync(PATHS.outAb, JSON.stringify(abDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outRevenue, JSON.stringify(revenueDoc, null, 2), "utf8");

  console.log(
    "[build-v176-growth-execution]",
    `winners=${winners.length} low_ctr=${lowCtrFixes.length} boost_slugs=${boost_slugs.length} → generated/v176-*.json`
  );
}

main();
