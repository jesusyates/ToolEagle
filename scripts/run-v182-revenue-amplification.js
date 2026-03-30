#!/usr/bin/env node
/**
 * V182 — Revenue amplification execution: exact-revenue paths get higher allocation, entry boost, expansion hints, reclaim plan.
 * Runs after V181. Inputs: v180 precise + dashboard, v181 control + final-link-control.
 */

const fs = require("fs");
const path = require("path");
const { TOOL_SIGNAL } = require("./lib/content-allocation");

const ROOT = process.cwd();
const PATHS = {
  precise: path.join(ROOT, "generated", "v180-precise-paths.json"),
  dash180: path.join(ROOT, "generated", "v180-revenue-dashboard.json"),
  v181control: path.join(ROOT, "generated", "v181-revenue-growth-control.json"),
  v181final: path.join(ROOT, "generated", "v181-final-link-control.json"),
  friction: path.join(ROOT, "generated", "v180-paywall-friction-report.json"),
  repair: path.join(ROOT, "generated", "v181-revenue-repair-plan.json"),
  pageValue: path.join(ROOT, "generated", "page-value-score.json"),
  freshness: path.join(ROOT, "generated", "data-freshness.json"),
  outPlan: path.join(ROOT, "generated", "v182-revenue-amplification-plan.json"),
  outExpansion: path.join(ROOT, "generated", "v182-revenue-expansion-hints.json"),
  outEntry: path.join(ROOT, "generated", "v182-revenue-entry-boost.json"),
  outReclaim: path.join(ROOT, "generated", "v182-revenue-resource-reclaim.json"),
  outLog: path.join(ROOT, "generated", "v182-revenue-amplification-log.jsonl")
};

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function appendLog(row) {
  fs.mkdirSync(path.dirname(PATHS.outLog), { recursive: true });
  fs.appendFileSync(
    PATHS.outLog,
    JSON.stringify({ timestamp: new Date().toISOString(), ...row }) + "\n",
    "utf8"
  );
}

function pathToBlogSlug(p) {
  const m = String(p || "").match(/\/blog\/([^/?#]+)/);
  return m ? m[1] : null;
}

function parseProgrammaticBlogSlug(slug) {
  const PLATFORMS = new Set(["tiktok", "youtube", "instagram"]);
  const CONTENT_TYPES = new Set(["captions", "hashtags", "titles", "hooks"]);
  const parts = String(slug || "").split("-");
  if (parts.length < 3) return null;
  const platform = parts[0];
  const contentType = parts[1];
  if (!PLATFORMS.has(platform) || !CONTENT_TYPES.has(contentType)) return null;
  return { platform, contentType, topic: parts.slice(2).join("-") };
}

function main() {
  fs.mkdirSync(path.dirname(PATHS.outLog), { recursive: true });
  if (fs.existsSync(PATHS.outLog)) fs.unlinkSync(PATHS.outLog);

  const builtAt = new Date().toISOString();
  const precise = safeReadJson(PATHS.precise) || {};
  const dash = safeReadJson(PATHS.dash180) || {};
  const v181c = safeReadJson(PATHS.v181control) || {};
  const v181f = safeReadJson(PATHS.v181final) || {};
  const friction = safeReadJson(PATHS.friction) || {};
  const repair = safeReadJson(PATHS.repair) || {};
  const pv = safeReadJson(PATHS.pageValue) || {};
  const fresh = safeReadJson(PATHS.freshness) || {};

  const stale = Boolean(fresh.stale_data);
  const inferredOnlyPaths = Array.isArray(precise.inferred_only_paths)
    ? precise.inferred_only_paths
        .map((x) => (typeof x === "object" && x ? x.path || x.href : x))
        .filter(Boolean)
    : [];

  const topToolsExact = Array.isArray(precise.top_paid_tools_exact) ? precise.top_paid_tools_exact : [];
  const topPagesExact = Array.isArray(precise.top_paid_pages_exact) ? precise.top_paid_pages_exact : [];
  const topPathsExact = Array.isArray(precise.top_paid_paths_exact) ? precise.top_paid_paths_exact : topPagesExact;

  const revenueByToolExact = dash.revenue_by_tool_exact && typeof dash.revenue_by_tool_exact === "object" ? dash.revenue_by_tool_exact : {};
  const revenueByPageExact = dash.revenue_by_page_exact && typeof dash.revenue_by_page_exact === "object" ? dash.revenue_by_page_exact : {};

  /** Intent/topic amplify multipliers — only exact signal; sparse output (no flat 1.0 fill). */
  const intentAmplify = { captions: 1, hashtags: 1, titles: 1, hooks: 1 };
  const topicAmplify = {};

  const sortedTools = [...topToolsExact].sort((a, b) => (b.paid_conversions || 0) - (a.paid_conversions || 0));
  const maxC = sortedTools[0]?.paid_conversions || 1;

  for (const row of sortedTools.slice(0, 24)) {
    const slug = row.tool_slug;
    if (!slug) continue;
    const sig = TOOL_SIGNAL[slug];
    const conv = Number(row.paid_conversions) || 0;
    const tier =
      conv >= maxC * 0.85 && maxC >= 1
        ? "peak"
        : conv > 0
          ? "stable"
          : "none";
    if (tier === "none" || stale) continue;
    const peakMult = tier === "peak" ? clamp(1.35 + 0.6 * (conv / Math.max(1, maxC)), 1.3, 2.5) : clamp(1.1 + 0.2 * (conv / Math.max(1, maxC)), 1.1, 1.3);
    if (!sig) continue;
    for (const intent of sig.intents || []) {
      if (intentAmplify[intent] != null) {
        intentAmplify[intent] = Math.max(intentAmplify[intent], peakMult);
      }
    }
  }

  for (const p of Object.keys(revenueByPageExact)) {
    if (!p.includes("/blog/")) continue;
    const bs = pathToBlogSlug(p);
    if (!bs) continue;
    const parsed = parseProgrammaticBlogSlug(bs);
    if (!parsed) continue;
    const conv = Number(revenueByPageExact[p]) || 0;
    if (conv <= 0) continue;
    const mult = clamp(1.15 + 0.1 * Math.min(conv, 5), 1.08, 1.45);
    const prev = topicAmplify[parsed.topic] ?? 1;
    topicAmplify[parsed.topic] = Math.max(prev, mult);
  }

  const blockedFromAmplify = {
    inferred_only_paths: inferredOnlyPaths.slice(0, 120),
    stale_data: stale,
    weak_confidence_reasons: stale
      ? ["data_freshness_stale"]
      : inferredOnlyPaths.length
        ? ["inferred_revenue_paths_excluded_from_peak_amplify"]
        : []
  };

  if (stale) {
    for (const k of Object.keys(intentAmplify)) intentAmplify[k] = Math.min(intentAmplify[k], 1.1);
    for (const t of Object.keys(topicAmplify)) topicAmplify[t] = Math.min(topicAmplify[t], 1.08);
  }

  const amplifyPages = Object.entries(revenueByPageExact)
    .filter(([path]) => path.includes("/blog/") || path.startsWith("/tools/"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([path, n]) => ({ path, exact_paid_conversions: n, tier: n >= 2 ? "peak" : "stable" }));

  const amplifyTools = sortedTools.slice(0, 30).map((r) => ({
    tool_slug: r.tool_slug,
    paid_conversions: r.paid_conversions,
    tier: (r.paid_conversions || 0) >= maxC * 0.5 && maxC >= 1 ? "peak" : "stable"
  }));

  const amplifyTopics = Object.entries(topicAmplify)
    .filter(([, m]) => m > 1.02)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([topic, multiplier]) => ({ topic, multiplier }));

  const plan = {
    version: "182",
    builtAt,
    note: "Amplify tiers apply only to exact V180.1 revenue signals; inferred-only excluded from peak.",
    top_exact_revenue_pages: amplifyPages.slice(0, 25),
    top_exact_revenue_tools: amplifyTools.slice(0, 25),
    top_exact_revenue_paths: topPathsExact.slice(0, 40),
    amplify_pages: amplifyPages,
    amplify_tools: amplifyTools,
    amplify_topics: amplifyTopics,
    intent_amplify_multipliers: Object.fromEntries(
      Object.entries(intentAmplify).filter(([, m]) => Number(m) > 1.01)
    ),
    topic_amplify_multipliers: Object.fromEntries(
      Object.entries(topicAmplify).filter(([, m]) => Number(m) > 1.01)
    ),
    blocked_from_amplify: blockedFromAmplify,
    v181_cross_ref: {
      final_link_control: "generated/v181-final-link-control.json",
      growth_control: "generated/v181-revenue-growth-control.json"
    }
  };

  const expansion = {
    version: "182",
    builtAt,
    expand_from_top_tools: sortedTools.slice(0, 12).map((r) => ({
      tool_slug: r.tool_slug,
      suggest_blog_clusters: [
        `more ${r.tool_slug} workflow tutorials`,
        "tool-support how-to variants",
        "same-topic long-tail captions/hooks"
      ],
      suggest_answer_links: [`/answers/how-to-write-viral-hooks`]
    })),
    expand_from_top_pages: amplifyPages.slice(0, 15).map((x) => ({
      path: x.path,
      idea: "add adjacent topic variants + FAQ block"
    })),
    expand_from_top_topics: amplifyTopics.slice(0, 20).map((x) => ({
      topic: x.topic,
      idea: "additional platform-contentType combinations"
    })),
    next_variants_to_generate: amplifyTopics.slice(0, 12).map((x) => `extra-${x.topic}-variants`),
    next_blog_clusters_to_generate: sortedTools.slice(0, 8).map((r) => {
      const sig = TOOL_SIGNAL[r.tool_slug];
      const pl = sig?.platforms?.[0] || "tiktok";
      const ct = sig?.intents?.[0] || "captions";
      return `${pl}-${ct}-${r.tool_slug}-tips`;
    })
  };

  const toolEntryBoost = {};
  const blogSlugBoost = {};
  for (const row of amplifyTools) {
    const slug = row.tool_slug;
    if (!slug) continue;
    toolEntryBoost[slug] = {
      tier: row.tier,
      extra_related_placement: row.tier === "peak",
      trust_block_override: row.tier === "peak" ? "full" : undefined,
      short_click_path: true
    };
  }
  for (const row of amplifyPages) {
    const bs = pathToBlogSlug(row.path);
    if (bs) blogSlugBoost[bs] = row.tier === "peak" ? 1.22 : 1.1;
  }

  const entryBoost = {
    version: "182",
    builtAt,
    note: "Consumed by en-internal-linking.js + ToolPageStandardAsideLead (v182 loader).",
    tool_entry_boost: toolEntryBoost,
    blog_slug_entry_boost: blogSlugBoost,
    related_tools_placement_boost: sortedTools.slice(0, 15).map((r) => r.tool_slug).filter(Boolean),
    preferred_shorter_paths: ["/pricing", "/zh/pricing", ...sortedTools.slice(0, 5).map((r) => `/tools/${r.tool_slug}`)],
    final_weight_order: [
      ...(v181f.final_weight_order || []),
      "v182_revenue_amplify_entry_peak_stable"
    ]
  };

  const pages = Array.isArray(pv.pages) ? pv.pages : [];
  const highPvLowRev = pages
    .filter((pg) => (Number(pg.score) || 0) >= 0.54)
    .filter((pg) => {
      const hit = Object.keys(revenueByPageExact).some((k) => k === pg.path);
      return !hit;
    })
    .slice(0, 40);

  const frictionSlugs = (friction.paths || []).map((p) => p.tool_slug).filter(Boolean);

  const reclaim = {
    version: "182",
    builtAt,
    reclaim_internal_links: highPvLowRev.slice(0, 25).map((p) => ({
      path: p.path,
      action: "reduce_inbound_priority_direct_to_amplify_tools",
      target: "prefer links to /tools/* in amplify_tools list"
    })),
    reclaim_generation_budget: {
      action: "lower_topic_weight_for_high_pv_no_exact_revenue",
      topics: highPvLowRev
        .map((p) => pathToBlogSlug(p.path))
        .map(parseProgrammaticBlogSlug)
        .filter(Boolean)
        .map((m) => m.topic)
        .slice(0, 20)
    },
    reclaim_cta_priority: frictionSlugs.slice(0, 20).map((slug) => ({
      tool_slug: slug,
      action: "demote_upgrade_cta_density_until_payment_flow_fixed",
      source: "v180-paywall-friction-report"
    })),
    source: repair.version ? "v181-revenue-repair-plan + v180 friction + page-value-score" : "friction + page-value"
  };

  fs.mkdirSync(path.dirname(PATHS.outPlan), { recursive: true });
  fs.writeFileSync(PATHS.outPlan, JSON.stringify(plan, null, 2), "utf8");
  fs.writeFileSync(PATHS.outExpansion, JSON.stringify(expansion, null, 2), "utf8");
  fs.writeFileSync(PATHS.outEntry, JSON.stringify(entryBoost, null, 2), "utf8");
  fs.writeFileSync(PATHS.outReclaim, JSON.stringify(reclaim, null, 2), "utf8");

  appendLog({
    action_type: "v182_artifacts_written",
    amplify_target: "batch",
    source_signal: "v180_exact+v181",
    exact_inferred: "exact"
  });
  for (const t of amplifyTools.slice(0, 15)) {
    appendLog({
      action_type: "amplify_tool",
      amplify_target: t.tool_slug,
      source_signal: "v180-precise-paths",
      exact_inferred: "exact",
      tier: t.tier
    });
  }

  console.log(
    `[run-v182-revenue-amplification] wrote plan, expansion, entry-boost, reclaim, log — amplify_tools=${amplifyTools.length} stale=${stale}`
  );
}

main();
