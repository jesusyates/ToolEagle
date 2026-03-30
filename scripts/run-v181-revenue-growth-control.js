#!/usr/bin/env node
/**
 * V181 / V181.1 — Revenue-driven growth control: exact revenue → allocation, linking, CTA tiers, repair plan,
 * dashboard, v181-final-link-control.json (EN blog link closure with en-internal-linking.js).
 * Inputs: v180 precise paths + revenue dashboard, page-value-score, topic-production-control, v174-scale-plan,
 * optional v179-low-revenue-fix, v180 friction, data-freshness, v176-internal-link-weights.
 */

const fs = require("fs");
const path = require("path");
const { TOOL_SIGNAL } = require("./lib/content-allocation");

const ROOT = process.cwd();
const PATHS = {
  precise: path.join(ROOT, "generated", "v180-precise-paths.json"),
  dash180: path.join(ROOT, "generated", "v180-revenue-dashboard.json"),
  pageValue: path.join(ROOT, "generated", "page-value-score.json"),
  topicCtrl: path.join(ROOT, "generated", "topic-production-control.json"),
  v174: path.join(ROOT, "generated", "v174-scale-plan.json"),
  v179fix: path.join(ROOT, "generated", "v179-low-revenue-fix.json"),
  friction: path.join(ROOT, "generated", "v180-paywall-friction-report.json"),
  freshness: path.join(ROOT, "generated", "data-freshness.json"),
  v180runtime: path.join(ROOT, "generated", "v180-paywall-runtime.json"),
  v179runtime: path.join(ROOT, "generated", "v179-upgrade-runtime.json"),
  outControl: path.join(ROOT, "generated", "v181-revenue-growth-control.json"),
  outLink: path.join(ROOT, "generated", "v181-revenue-link-priority.json"),
  outCta: path.join(ROOT, "generated", "v181-revenue-cta-runtime.json"),
  outRepair: path.join(ROOT, "generated", "v181-revenue-repair-plan.json"),
  outGrowthDash: path.join(ROOT, "generated", "v181-revenue-growth-dashboard.json"),
  outFinalLink: path.join(ROOT, "generated", "v181-final-link-control.json"),
  v176weights: path.join(ROOT, "generated", "v176-internal-link-weights.json")
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

/** Same tail as EN programmatic blog: platform-contentType-topic */
function parseProgrammaticSlug(slug) {
  const PLATFORMS = new Set(["tiktok", "youtube", "instagram"]);
  const CONTENT_TYPES = new Set(["captions", "hashtags", "titles", "hooks"]);
  const parts = String(slug || "").split("-");
  if (parts.length < 3) return null;
  const platform = parts[0];
  const contentType = parts[1];
  if (!PLATFORMS.has(platform) || !CONTENT_TYPES.has(contentType)) return null;
  return { platform, contentType, topic: parts.slice(2).join("-") };
}

function pathToBlogSlug(p) {
  const m = String(p || "").match(/\/blog\/([^/?#]+)/);
  return m ? m[1] : null;
}

function main() {
  const builtAt = new Date().toISOString();
  const precise = safeReadJson(PATHS.precise) || {};
  const dash = safeReadJson(PATHS.dash180) || {};
  const pv = safeReadJson(PATHS.pageValue) || {};
  const topicCtrl = safeReadJson(PATHS.topicCtrl) || {};
  const v174 = safeReadJson(PATHS.v174) || {};
  const v179fix = safeReadJson(PATHS.v179fix) || {};
  const friction = safeReadJson(PATHS.friction) || {};
  const freshness = safeReadJson(PATHS.freshness) || {};
  const v180rt = safeReadJson(PATHS.v180runtime) || {};
  const v179rt = safeReadJson(PATHS.v179runtime) || {};

  const topToolsExact = Array.isArray(precise.top_paid_tools_exact) ? precise.top_paid_tools_exact : [];
  const topPagesExact = Array.isArray(precise.top_paid_pages_exact) ? precise.top_paid_pages_exact : [];
  const topPathsExact = Array.isArray(precise.top_paid_paths_exact) ? precise.top_paid_paths_exact : precise.top_paid_pages_exact || [];
  const inferredOnly = Array.isArray(precise.inferred_only_paths) ? precise.inferred_only_paths : [];

  const revenueByToolExact = dash.revenue_by_tool_exact && typeof dash.revenue_by_tool_exact === "object" ? dash.revenue_by_tool_exact : {};
  const revenueByPageExact = dash.revenue_by_page_exact && typeof dash.revenue_by_page_exact === "object" ? dash.revenue_by_page_exact : {};

  const topicTiers = v174.topicTiers && typeof v174.topicTiers === "object" ? v174.topicTiers : {};
  const topicKeys = Object.keys(topicTiers);

  const pages = Array.isArray(pv.pages) ? pv.pages : [];

  /** ---- Topic revenue from exact tool revenue (intent + topic bumps) ---- */
  const intentRevenueMultipliers = { captions: 1, hashtags: 1, titles: 1, hooks: 1 };
  const topicRevenueMultipliers = {};
  for (const k of topicKeys) topicRevenueMultipliers[k] = 1;

  const sortedTools = [...topToolsExact].sort((a, b) => (b.paid_conversions || 0) - (a.paid_conversions || 0));
  const maxConv = sortedTools[0]?.paid_conversions || 1;

  for (let i = 0; i < sortedTools.length; i++) {
    const row = sortedTools[i];
    const slug = row.tool_slug;
    if (!slug) continue;
    const sig = TOOL_SIGNAL[slug];
    const conv = Number(row.paid_conversions) || 0;
    const rankBoost = 1.2 + 0.8 * (conv / Math.max(1, maxConv));
    const mult = clamp(rankBoost, 1.2, 2.0);
    if (!sig) continue;
    for (const intent of sig.intents || []) {
      if (intentRevenueMultipliers[intent] != null) {
        intentRevenueMultipliers[intent] = Math.max(intentRevenueMultipliers[intent], mult);
      }
    }
  }

  /** Simpler topic bump: any topic tail appearing in a top exact-revenue blog path */
  const topBlogTopics = new Set();
  for (const p of Object.keys(revenueByPageExact)) {
    if (!p.includes("/blog/")) continue;
    const bs = pathToBlogSlug(p);
    if (!bs) continue;
    const parsed = parseProgrammaticSlug(bs);
    if (parsed) topBlogTopics.add(parsed.topic);
  }
  for (const t of topBlogTopics) {
    if (topicRevenueMultipliers[t] != null) topicRevenueMultipliers[t] = clamp((topicRevenueMultipliers[t] || 1) * 1.15, 1, 1.6);
  }

  const lowRevTopics = [];
  const exactRevPaths = new Set(Object.keys(revenueByPageExact));

  /** Demote: high page-value blog clusters without exact paid attribution on that path (never demote exact-revenue topics) */
  for (const pg of pages.slice(0, 250)) {
    const slug = pathToBlogSlug(pg.path);
    if (!slug) continue;
    const parsed = parseProgrammaticSlug(slug);
    if (!parsed) continue;
    if (topBlogTopics.has(parsed.topic)) continue;
    const sc = Number(pg.score) || 0;
    if (sc < 0.52) continue;
    if (exactRevPaths.has(pg.path)) continue;
    const prev = topicRevenueMultipliers[parsed.topic] ?? 1;
    topicRevenueMultipliers[parsed.topic] = clamp(prev * (sc >= 0.55 ? 0.9 : 0.94), 0.65, 0.98);
    lowRevTopics.push({ topic: parsed.topic, path: pg.path, page_value_proxy: sc, action: "demote_allocation" });
  }

  const topRevenueTopicsExact = [...topBlogTopics].sort().slice(0, 80);

  const revenuePromoteIntents = Object.entries(intentRevenueMultipliers)
    .filter(([, v]) => v > 1.05)
    .map(([intent, mult]) => ({ intent, multiplier: mult }));
  const promoteTopics = [
    ...topicKeys.filter((t) => (topicRevenueMultipliers[t] || 1) > 1.05),
    ...revenuePromoteIntents.map((x) => `intent:${x.intent}`)
  ];
  const demoteTopics = topicKeys.filter((t) => (topicRevenueMultipliers[t] || 1) < 0.98);

  /** Inferred-only paths must not receive max tier */
  const inferredOnlyPathsList = inferredOnly.map((x) => (typeof x === "object" ? x.path || x : x)).filter(Boolean);
  const inferredOnlyToolSlugs = new Set();
  for (const p of inferredOnlyPathsList) {
    const m = String(p).match(/\/(?:zh\/)?tools\/([^/]+)/);
    if (m) inferredOnlyToolSlugs.add(m[1]);
  }

  const growthControl = {
    version: "181",
    builtAt,
    note: "Exact V180.1 revenue drives promote/demote; inferred-only paths excluded from max priority.",
    top_revenue_tools_exact: sortedTools.slice(0, 40),
    top_revenue_pages_exact: topPagesExact.slice(0, 40),
    top_revenue_topics_exact: topRevenueTopicsExact.map((topic) => ({
      topic,
      source: "exact_revenue_blog_paths_and_tools"
    })),
    low_revenue_high_traffic_topics: lowRevTopics.slice(0, 60),
    revenue_demote_topics: demoteTopics.slice(0, 80),
    revenue_promote_topics: promoteTopics.slice(0, 80),
    revenue_promote_intents: revenuePromoteIntents,
    intent_revenue_multipliers: intentRevenueMultipliers,
    topic_revenue_multipliers: topicRevenueMultipliers,
    inferred_only_paths_excluded_from_max_tier: inferredOnlyPathsList.slice(0, 100)
  };

  /** ---- Link priority: boost high exact revenue tools, penalize demoted ---- */
  const linkScoreBoostByToolSlug = {};
  const linkScorePenaltyByToolSlug = {};
  const preferredOutboundTargets = {};
  for (const row of sortedTools.slice(0, 24)) {
    const slug = row.tool_slug;
    if (!slug) continue;
    const conv = Number(row.paid_conversions) || 0;
    linkScoreBoostByToolSlug[slug] = clamp(1 + 0.08 * Math.min(conv, 8), 1.08, 1.55);
  }
  for (const row of friction.paths || []) {
    const slug = row.tool_slug;
    if (!slug) continue;
    linkScorePenaltyByToolSlug[slug] = 0.88;
    preferredOutboundTargets[slug] = sortedTools.slice(0, 3).map((x) => x.tool_slug).filter(Boolean);
  }

  const linkDoc = {
    version: "181",
    builtAt,
    note: "Applied in build-internal-link-priority-report.ts — boost inbound to high exact-revenue tools; friction tools penalized.",
    linkScoreBoostByToolSlug,
    linkScorePenaltyByToolSlug,
    preferredOutboundTargets
  };

  /** ---- CTA runtime: merge v180 + revenue tiers ---- */
  const v180tools = v180rt.tools && typeof v180rt.tools === "object" ? v180rt.tools : {};
  const v179tools = v179rt.tools && typeof v179rt.tools === "object" ? v179rt.tools : {};
  const ctaTools = {};
  const allSlugs = new Set([
    ...Object.keys(v180tools),
    ...Object.keys(v179tools),
    ...sortedTools.map((x) => x.tool_slug).filter(Boolean),
    ...Object.keys(TOOL_SIGNAL)
  ]);

  for (const slug of allSlugs) {
    const base = { ...(v180tools[slug] || {}) };
    const rev179 = v179tools[slug] || {};
    const conv = sortedTools.find((r) => r.tool_slug === slug)?.paid_conversions || 0;
    const isHighExact = conv > 0 && !inferredOnlyToolSlugs.has(slug);
    const isFriction = (friction.paths || []).some((p) => p.tool_slug === slug);
    const isHighTrafficLowRev = isFriction && conv < 1;

    let tier = "default";
    if (inferredOnlyToolSlugs.has(slug)) tier = "inferred_only_no_max_tier";
    else if (isHighExact) tier = "high_revenue_exact";
    else if (isHighTrafficLowRev) tier = "high_traffic_low_revenue";
    else if (isFriction) tier = "friction_upgrade_weak";

    let trust_block = base.trust_block || "compact";
    let workflow_upgrade_hidden = Boolean(base.workflow_upgrade_hidden);
    let paywall_ab = base.paywall_ab || "a";
    let cta_density = "medium";
    let prefer_short_tool_path = false;

    if (tier === "high_revenue_exact") {
      trust_block = "full";
      workflow_upgrade_hidden = false;
      cta_density = "high";
    } else if (tier === "high_traffic_low_revenue") {
      trust_block = "compact";
      workflow_upgrade_hidden = true;
      cta_density = "low";
      prefer_short_tool_path = true;
    } else if (tier === "friction_upgrade_weak") {
      trust_block = "full";
      cta_density = "medium";
    } else if (tier === "inferred_only_no_max_tier") {
      trust_block = "compact";
      cta_density = "medium";
      workflow_upgrade_hidden = Boolean(base.workflow_upgrade_hidden);
    }

    ctaTools[slug] = {
      ...base,
      v181_tier: tier,
      trust_block,
      workflow_upgrade_hidden,
      paywall_ab,
      cta_density,
      prefer_short_tool_path,
      upgrade_boost_hint: rev179.upgrade_boost || (isHighExact ? "max" : "standard"),
      revenue_exact_paid_conversions: conv
    };
  }

  const ctaDoc = {
    version: "181",
    builtAt,
    note: "Merged v180 paywall runtime + v179 boost hints + V181 revenue tiers. UI loads via v181-revenue-cta-runtime.ts",
    tools: ctaTools
  };

  /** ---- Repair plan ---- */
  const repair = {
    version: "181",
    builtAt,
    traffic_good_but_tool_weak: [],
    tool_good_but_upgrade_weak: [],
    upgrade_good_but_payment_weak: []
  };

  for (const pg of pages.slice(0, 120)) {
    const sc = Number(pg.score) || 0;
    if (sc < 0.54) continue;
    const slug = pathToBlogSlug(pg.path);
    const parsed = slug ? parseProgrammaticSlug(slug) : null;
    repair.traffic_good_but_tool_weak.push({
      path: pg.path,
      page_value_score: sc,
      topic: parsed?.topic || null,
      fix: "strengthen_tool_cta_and_demo_on_page"
    });
  }
  repair.traffic_good_but_tool_weak = repair.traffic_good_but_tool_weak.slice(0, 40);

  for (const row of friction.paths || []) {
    repair.tool_good_but_upgrade_weak.push({
      tool_slug: row.tool_slug,
      path: row.path,
      upgrade_click: row.upgrade_click,
      fix: "shorten_path_to_tool_cta_strengthen_workflow_before_blind_upgrade"
    });
  }

  const toolsWithExactPaid = new Set(
    Object.keys(revenueByToolExact).filter((k) => Number(revenueByToolExact[k]) > 0)
  );
  for (const row of friction.paths || []) {
    const slug = row.tool_slug;
    if (!slug || toolsWithExactPaid.has(slug)) continue;
    if ((row.upgrade_click || 0) < 2) continue;
    repair.upgrade_good_but_payment_weak.push({
      tool_slug: slug,
      upgrade_click: row.upgrade_click,
      note: "upgrade_intent_present_but_no_exact_paid_in_dashboard",
      fix: "verify_checkout_attribution_trust_and_payment_flow"
    });
  }
  repair.tool_good_but_upgrade_weak = repair.tool_good_but_upgrade_weak.slice(0, 30);
  repair.upgrade_good_but_payment_weak = repair.upgrade_good_but_payment_weak.slice(0, 30);

  if (Array.isArray(v179fix.fixes)) {
    for (const f of v179fix.fixes) {
      repair.traffic_good_but_tool_weak.push({ from_v179_fix: true, ...f });
    }
  }

  /** ---- Growth dashboard ---- */
  const growthDash = {
    version: "181",
    builtAt,
    exact_revenue_pages: Object.entries(revenueByPageExact)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([path, n]) => ({ path, exact_paid_conversions: n })),
    exact_revenue_tools: sortedTools.slice(0, 40),
    revenue_weighted_topics: promoteTopics.slice(0, 40).map((t) => ({
      topic: t,
      multiplier: topicRevenueMultipliers[t]
    })),
    promoted_by_revenue: [
      ...promoteTopics.slice(0, 40).map((t) => ({ kind: "topic", id: t, multiplier: topicRevenueMultipliers[t] })),
      ...revenuePromoteIntents.slice(0, 20).map((x) => ({ kind: "intent", intent: x.intent, multiplier: x.multiplier }))
    ],
    demoted_by_revenue: demoteTopics.slice(0, 60),
    high_traffic_low_revenue_pages: pages
      .filter((p) => (Number(p.score) || 0) >= 0.53 && !exactRevPaths.has(p.path))
      .slice(0, 40)
      .map((p) => ({ path: p.path, score: p.score })),
    high_revenue_paths_exact: topPathsExact.slice(0, 40),
    revenue_signal_freshness: {
      stale_data: Boolean(freshness.stale_data),
      data_freshness_builtAt: freshness.builtAt || null,
      v180_dashboard_version: dash.version || null
    },
    topic_production_note: Array.isArray(topicCtrl.topics) ? topicCtrl.topics.length : 0
  };

  const v176raw = safeReadJson(PATHS.v176weights) || {};
  const finalLinkControl = {
    version: "181.1",
    builtAt,
    final_weight_order: [
      "base_relevance_jaccard_similarity",
      "search_growth_priority_and_weak_sets",
      "v176_growth_execution_blog_slug_boost_reduce",
      "v181_revenue_tool_boost_penalty_preferred_outbound",
      "hard_content_quality_excludes"
    ],
    final_boost_targets: [
      ...(v176raw.boost_slugs || []).slice(0, 50).map((slug) => ({ layer: "v176", slug, kind: "blog_slug" })),
      ...Object.entries(linkDoc.linkScoreBoostByToolSlug || {}).map(([tool_slug, mult]) => ({
        layer: "v181",
        tool_slug,
        multiplier: mult,
        kind: "tool_boost"
      }))
    ],
    final_reduce_targets: [
      ...(v176raw.reduce_slugs || []).slice(0, 40).map((slug) => ({ layer: "v176", slug, kind: "blog_slug" })),
      ...Object.entries(linkDoc.linkScorePenaltyByToolSlug || {}).map(([tool_slug, mult]) => ({
        layer: "v181",
        tool_slug,
        multiplier: mult,
        kind: "tool_penalty"
      }))
    ],
    revenue_weight_applied: {
      source: "generated/v181-revenue-link-priority.json",
      linkScoreBoostByToolSlug: linkDoc.linkScoreBoostByToolSlug,
      linkScorePenaltyByToolSlug: linkDoc.linkScorePenaltyByToolSlug,
      preferredOutboundTargets: linkDoc.preferredOutboundTargets
    },
    growth_weight_applied: {
      source: "generated/v176-internal-link-weights.json",
      boost_slugs_count: (v176raw.boost_slugs || []).length,
      reduce_slugs_count: (v176raw.reduce_slugs || []).length,
      link_score_boost_bonus: v176raw.link_score_boost_bonus,
      link_score_reduce_penalty: v176raw.link_score_reduce_penalty
    },
    en_blog_write_path:
      "scripts/lib/en-internal-linking.js — selectEnBlogRelatedPageSlugs, sortBlogSlugsForBacklinks, computeEnRelatedToolLinksForBlogPage; loadSearchLinkPriority() attaches v176 + v181",
    consumers: ["scripts/generate-seo-blog.js", "scripts/backfill-en-blog-linking.js"],
    note: "V181 revenue weights apply in the EN blog MDX write path, not only in internal-link-priority-report.json."
  };

  fs.mkdirSync(path.dirname(PATHS.outControl), { recursive: true });
  fs.writeFileSync(PATHS.outFinalLink, JSON.stringify(finalLinkControl, null, 2), "utf8");
  fs.writeFileSync(PATHS.outControl, JSON.stringify(growthControl, null, 2), "utf8");
  fs.writeFileSync(PATHS.outLink, JSON.stringify(linkDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outCta, JSON.stringify(ctaDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outRepair, JSON.stringify(repair, null, 2), "utf8");
  fs.writeFileSync(PATHS.outGrowthDash, JSON.stringify(growthDash, null, 2), "utf8");

  console.log(
    `[run-v181-revenue-growth-control] wrote v181 control, link, final-link-control, cta, repair, dashboard — promote_rows=${promoteTopics.length} promote_intents=${revenuePromoteIntents.length} demote_topics=${demoteTopics.length}`
  );
}

main();
