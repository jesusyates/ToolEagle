#!/usr/bin/env node
/**
 * V179 — Revenue optimization: surface map, paths, dashboard, low-revenue fixes, A/B defs,
 * upgrade-runtime.json for ToolPageStandardAsideLead + optional blog MDX structure.
 * CLI: --dry-run
 * MDX writes only when V177_AUTO_EXECUTION=1 and not --dry-run.
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = process.cwd();
const mdxSafety = require(path.join(ROOT, "scripts", "lib", "mdx-safety.js"));

const V178_CORE_TOOL_SLUGS = [
  "tiktok-caption-generator",
  "hashtag-generator",
  "hook-generator",
  "title-generator"
];

const PATHS = {
  revenueSignals: path.join(ROOT, "generated", "v176-revenue-signals.json"),
  toolConv: path.join(ROOT, "generated", "tool-conversion-map.json"),
  convPath174: path.join(ROOT, "generated", "v174-conversion-path-optimization.json"),
  pageValue: path.join(ROOT, "generated", "page-value-score.json"),
  winners: path.join(ROOT, "generated", "v176-top-winners.json"),
  amplify: path.join(ROOT, "generated", "v176-conversion-path-amplify.json"),
  searchPerf: path.join(ROOT, "generated", "search-performance.json"),
  dataFreshness: path.join(ROOT, "generated", "data-freshness.json"),
  toolClickJsonl: path.join(ROOT, "generated", "tool-click-events.jsonl"),
  blogDir: path.join(ROOT, "content", "blog"),
  outSurfaceMap: path.join(ROOT, "generated", "v179-upgrade-surface-map.json"),
  outPaths: path.join(ROOT, "generated", "v179-revenue-paths.json"),
  outDashboard: path.join(ROOT, "generated", "v179-revenue-dashboard.json"),
  outLowFix: path.join(ROOT, "generated", "v179-low-revenue-fix.json"),
  outAb: path.join(ROOT, "generated", "v179-upgrade-ab-test.json"),
  outRuntime: path.join(ROOT, "generated", "v179-upgrade-runtime.json"),
  boostLog: path.join(ROOT, "generated", "v179-upgrade-boost-log.jsonl")
};

const BLOG_REVENUE_HEADING = "## Faster path: tools → publish → upgrade (auto)";

function parseArgs() {
  const argv = process.argv.slice(2);
  return { dryRun: argv.includes("--dry-run") };
}

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function appendBoostLog(row) {
  fs.mkdirSync(path.dirname(PATHS.boostLog), { recursive: true });
  fs.appendFileSync(PATHS.boostLog, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n", "utf8");
}

function findSectionRange(body, heading) {
  const b = String(body || "");
  const start = b.indexOf(heading);
  if (start < 0) return { start: -1, end: -1 };
  const next = b.indexOf("\n## ", start + heading.length);
  const end = next >= 0 ? next : b.length;
  return { start, end };
}

function upsertBeforeSummary(body, heading, md) {
  const b = String(body || "");
  const summaryMarker = "\n## Summary";
  const range = findSectionRange(b, heading);
  const block = `${heading}\n\n${md}\n`;
  if (range.start >= 0 && range.end > range.start) {
    return `${b.slice(0, range.start)}${block}${b.slice(range.end)}`.replace(/\n{3,}/g, "\n\n");
  }
  const idx = b.indexOf(summaryMarker);
  if (idx >= 0) {
    return `${b.slice(0, idx).trimEnd()}\n\n${block}${b.slice(idx)}`.replace(/\n{3,}/g, "\n\n");
  }
  return `${b.trimEnd()}\n\n${block}`;
}

function scanPricingAdjacentEvents() {
  const byPage = {};
  const byType = { tool: 0, blog: 0, answer: 0, other: 0 };
  let total = 0;
  if (!fs.existsSync(PATHS.toolClickJsonl)) return { total: 0, byPage, byType };
  for (const line of fs.readFileSync(PATHS.toolClickJsonl, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      const ref = String(o.referrer || "").toLowerCase();
      const href = String(o.href || o.url || "");
      if (!ref.includes("/pricing") && !href.includes("/pricing")) continue;
      total++;
      let pageKey = "unknown";
      if (o.toolSlug) {
        pageKey = `/tools/${o.toolSlug}`;
        byType.tool += 1;
      } else if (o.blogSlug) {
        pageKey = `/blog/${o.blogSlug}`;
        byType.blog += 1;
      } else if (o.path && String(o.path).startsWith("/")) {
        pageKey = o.path.split("?")[0];
        if (pageKey.startsWith("/blog/")) byType.blog += 1;
        else if (pageKey.startsWith("/answers/")) byType.answer += 1;
        else if (pageKey.startsWith("/tools/")) byType.tool += 1;
        else byType.other += 1;
      } else {
        byType.other += 1;
      }
      byPage[pageKey] = (byPage[pageKey] || 0) + 1;
    } catch {
      /* ignore */
    }
  }
  return { total, byPage, byType };
}

function main() {
  const { dryRun } = parseArgs();
  const builtAt = new Date().toISOString();
  const applyMdx = process.env.V177_AUTO_EXECUTION === "1" && !dryRun;

  const revenue = readJson(PATHS.revenueSignals) || {};
  const toolConv = readJson(PATHS.toolConv) || {};
  const conv174 = readJson(PATHS.convPath174) || {};
  const pageValueDoc = readJson(PATHS.pageValue) || {};
  const winnersDoc = readJson(PATHS.winners) || {};
  const amplify = readJson(PATHS.amplify) || {};
  const search = readJson(PATHS.searchPerf) || {};
  const freshness = readJson(PATHS.dataFreshness) || {};

  const pricingScan = scanPricingAdjacentEvents();
  const upgradeClickTotal =
    Number(revenue.upgrade_click_events_observed) > 0
      ? Number(revenue.upgrade_click_events_observed)
      : pricingScan.total;

  const highCopySlugs = new Set(
    (amplify.high_copy_tools || []).map((x) => x.tool_slug).filter(Boolean)
  );
  const prioritizeSlugs = new Set(amplify.prioritize_tools_for_cta || []);

  const byToolCopies = toolConv.tool_output_quality_rollup?.by_tool_copies || {};
  const copyPublishStrong = Object.entries(byToolCopies)
    .filter(([, n]) => Number(n) >= 2)
    .map(([slug]) => slug);

  const pageRows = pageValueDoc.pages || [];
  const gscByPath = new Map();
  for (const p of search.pages || []) {
    const pathname = String(p.path || "");
    const im = Number(p.last14?.impressions ?? p.impressions) || 0;
    const cl = Number(p.last14?.clicks ?? p.clicks) || 0;
    gscByPath.set(pathname, { impressions: im, clicks: cl });
  }

  const lowRevenueHighTraffic = [];
  for (const row of pageRows) {
    const pathname = String(row.path || "");
    if (!pathname.startsWith("/blog/")) continue;
    const g = gscByPath.get(pathname) || { impressions: 0, clicks: 0 };
    const conv = Number(row.conversion) || 0;
    const seo = Number(row.seo) || 0;
    const im = g.impressions;
    const clicks = g.clicks;
    if (im >= 20 && clicks >= 1 && conv <= 0.38 && seo >= 0.52) {
      lowRevenueHighTraffic.push({
        path: pathname,
        slug: pathname.replace("/blog/", ""),
        impressions: im,
        clicks,
        conversion_proxy: conv,
        seo
      });
    }
  }
  lowRevenueHighTraffic.sort((a, b) => b.impressions - a.impressions);
  const lowFixTop = lowRevenueHighTraffic.slice(0, 48);

  const winnerBlogSlugs = new Set(
    (winnersDoc.winners || []).map((w) => w.slug).filter(Boolean)
  );

  const topRevenuePaths = [
    ...copyPublishStrong.map((slug) => ({
      kind: "tool_copy_publish",
      path: `/tools/${slug}`,
      signal: "high_copy_events",
      weight: Number(byToolCopies[slug]) || 0
    })),
    ...(revenue.high_value_pages_sample || []).slice(0, 12).map((x) => ({
      kind: "blog_value_score",
      path: x.path,
      score: x.score
    }))
  ];

  const surfaceMap = {
    version: "179",
    builtAt,
    policy: {
      forbid_random_pricing_links: true,
      runtime_source: "generated/v179-upgrade-runtime.json",
      gate_env: "V177_AUTO_EXECUTION=1"
    },
    levels: {
      A: {
        label: "strong",
        description: "Core tools, high-conversion tools, copy→publish path primary upgrade control",
        zones: ["tool_aside_publish_path_card", "workflow_upgrade_subtle_when_primary_shown"]
      },
      B: {
        label: "medium",
        description: "Answer primary CTA strip, blog mid-page structured workflow",
        zones: ["answer_primary_tool_cta", "blog_mid_workflow_section"]
      },
      C: {
        label: "weak",
        description: "Footer-adjacent / supplemental links only",
        zones: ["blog_footer_related", "related_links_component"]
      }
    },
    by_page_type: {
      core_tool: { default_upgrade_level: "A", surfaces: ["A"] },
      tool: { default_upgrade_level: "A", surfaces: ["A", "C"] },
      answer: { default_upgrade_level: "B", surfaces: ["B", "C"] },
      blog: { default_upgrade_level: "B", surfaces: ["B", "C"] }
    }
  };

  const revenuePaths = {
    version: "179",
    builtAt,
    high_upgrade_click_pages: Object.entries(pricingScan.byPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([path, count]) => ({ path, pricing_adjacent_events: count })),
    high_copy_publish_upgrade_path: copyPublishStrong.map((slug) => ({
      tool_slug: slug,
      copies: Number(byToolCopies[slug]) || 0
    })),
    low_revenue_high_traffic_pages: lowRevenueHighTraffic.slice(0, 32),
    inputs: {
      v176_revenue_signals: Boolean(revenue.version),
      tool_conversion_map: Boolean(toolConv.version),
      v174_conversion_path: Boolean(conv174.version),
      page_value_score: Boolean(pageValueDoc.version)
    }
  };

  const staleRevenueData = Boolean(freshness.stale_data) || !revenue.builtAt;

  const dashboard = {
    version: "179",
    builtAt,
    upgrade_click_total: upgradeClickTotal,
    upgrade_click_by_page: pricingScan.byPage,
    upgrade_click_by_page_type: pricingScan.byType,
    top_revenue_paths: topRevenuePaths.slice(0, 30),
    low_revenue_high_traffic_pages: lowRevenueHighTraffic.slice(0, 40),
    core_tool_upgrade_rate: {
      note: "proxy until dedicated upgrade attribution per slug",
      core_slugs: V178_CORE_TOOL_SLUGS,
      pricing_adjacent_hits_core: V178_CORE_TOOL_SLUGS.reduce(
        (acc, s) => acc + (pricingScan.byPage[`/tools/${s}`] || 0),
        0
      )
    },
    tool_vs_blog_upgrade_rate: {
      tool: pricingScan.byType.tool,
      blog: pricingScan.byType.blog,
      answer: pricingScan.byType.answer,
      other: pricingScan.byType.other
    },
    stale_revenue_data: staleRevenueData
  };

  const lowRevenueFixDoc = {
    version: "179",
    builtAt,
    fixes: lowFixTop.map((x) => ({
      path: x.path,
      slug: x.slug,
      reason: "traffic_with_clicks_low_conversion_proxy",
      actions: ["mdx_level_b_workflow_cta", "runtime_boost_optional"]
    }))
  };

  const abTests = {
    version: "179",
    builtAt,
    scope_note: "core_tool, winner_blog, low_revenue_high_traffic",
    tests: [
      ...V178_CORE_TOOL_SLUGS.map((slug) => ({
        target_type: "core_tool",
        target_id: slug,
        axis: "cta_copy",
        variant_a: { upgrade_button_label: "Upgrade for higher limits →" },
        variant_b: { upgrade_button_label: "See plans & raise limits →" }
      })),
      ...[...winnerBlogSlugs].slice(0, 20).map((slug) => ({
        target_type: "winner_blog",
        target_id: slug,
        axis: "cta_placement",
        variant_a: { mid_section: "before_summary" },
        variant_b: { mid_section: "before_summary" }
      })),
      ...lowFixTop.slice(0, 12).map((x) => ({
        target_type: "low_revenue_high_traffic_blog",
        target_id: x.slug,
        axis: "cta_style_tier",
        variant_a: { tier: "B" },
        variant_b: { tier: "B" }
      }))
    ]
  };

  function pickAbVariant(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
    return h % 2 === 0 ? "a" : "b";
  }

  const runtimeTools = {};
  function setTool(slug, patch) {
    if (!slug) return;
    runtimeTools[slug] = { ...(runtimeTools[slug] || {}), ...patch };
  }

  for (const s of V178_CORE_TOOL_SLUGS) {
    const ab = pickAbVariant(`core-${s}`);
    setTool(s, {
      surface_level: "A",
      upgrade_boost: "max",
      workflow_upgrade_mode: "subtle",
      ab_upgrade_copy: ab
    });
  }
  for (const s of highCopySlugs) {
    const ab = pickAbVariant(`hc-${s}`);
    setTool(s, {
      surface_level: "A",
      upgrade_boost: "max",
      workflow_upgrade_mode: "subtle",
      ab_upgrade_copy: ab
    });
  }
  for (const s of prioritizeSlugs) {
    setTool(s, {
      surface_level: "A",
      upgrade_boost: "max",
      workflow_upgrade_mode: "subtle",
      ab_upgrade_copy: pickAbVariant(`pr-${s}`)
    });
  }
  for (const s of copyPublishStrong) {
    if (!runtimeTools[s]) {
      setTool(s, {
        surface_level: "A",
        upgrade_boost: "standard",
        workflow_upgrade_mode: "default",
        ab_upgrade_copy: pickAbVariant(`cp-${s}`)
      });
    }
  }

  const runtimeBlogs = {};
  for (const slug of winnerBlogSlugs) {
    runtimeBlogs[slug] = {
      surface_level: "B",
      mid_workflow_cta: true,
      ab_variant: pickAbVariant(`win-${slug}`)
    };
  }

  const runtime = {
    version: "179",
    builtAt,
    dry_run: dryRun,
    tools: runtimeTools,
    blogs: runtimeBlogs,
    answers_default: { surface_level: "B", upgrade_near_primary: true }
  };

  fs.mkdirSync(path.dirname(PATHS.outSurfaceMap), { recursive: true });
  fs.writeFileSync(PATHS.outSurfaceMap, JSON.stringify(surfaceMap, null, 2), "utf8");
  fs.writeFileSync(PATHS.outPaths, JSON.stringify(revenuePaths, null, 2), "utf8");
  fs.writeFileSync(PATHS.outDashboard, JSON.stringify(dashboard, null, 2), "utf8");
  fs.writeFileSync(PATHS.outLowFix, JSON.stringify(lowRevenueFixDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outAb, JSON.stringify(abTests, null, 2), "utf8");
  fs.writeFileSync(PATHS.outRuntime, JSON.stringify(runtime, null, 2), "utf8");

  appendBoostLog({
    kind: "v179_artifacts_written",
    page_type: "system",
    action_type: "revenue_optimization",
    dry_run: dryRun,
    source: "run-v179-revenue-optimization"
  });

  const blogMd = [
    "- [Browse all tools](/tools) — generate copy, then publish in your app.",
    "- [Pricing](/pricing) — upgrade when you post often or hit free limits."
  ].join("\n");

  let mdxTouched = 0;
  if (applyMdx) {
    for (const fix of lowRevenueFixDoc.fixes) {
      const slug = fix.slug;
      const fp = path.join(PATHS.blogDir, `${slug}.mdx`);
      if (!fs.existsSync(fp)) continue;
      const raw = fs.readFileSync(fp, "utf8");
      const parsed = matter(raw);
      const fm = { ...(parsed.data || {}) };
      if (fm.v179_revenue_mid_at || String(parsed.content || "").includes(BLOG_REVENUE_HEADING)) {
        appendBoostLog({
          kind: "v179_blog_skip",
          page_type: "blog",
          action_type: "v179_upgrade_boost",
          slug,
          reason: "already_applied"
        });
        continue;
      }
      const body = upsertBeforeSummary(String(parsed.content || ""), BLOG_REVENUE_HEADING, blogMd);
      const nextFm = { ...fm, v179_revenue_mid_at: builtAt };
      const out = matter.stringify(body, nextFm);
      const res = mdxSafety.sanitizeAndValidateMdxForWrite({
        mdxString: out,
        filePath: fp,
        slug,
        failureKind: "v179_revenue_mid"
      });
      if (res.ok) {
        fs.writeFileSync(fp, res.sanitizedMdx, "utf8");
        mdxTouched++;
        appendBoostLog({
          kind: "v179_blog_boost_applied",
          page_type: "blog",
          action_type: "v179_upgrade_boost",
          slug,
          path: fix.path,
          source: "v179_low_revenue_fix"
        });
      } else {
        appendBoostLog({
          kind: "v179_blog_boost_failed",
          page_type: "blog",
          action_type: "v179_upgrade_boost",
          slug,
          reason: "mdx_compile"
        });
      }
    }
  } else {
    appendBoostLog({
      kind: "v179_blog_skipped",
      page_type: "blog",
      action_type: "v179_upgrade_boost",
      reason: applyMdx ? "none" : "need_V177_AUTO_EXECUTION_and_not_dry_run",
      dry_run: dryRun
    });
  }

  console.log(
    `[run-v179-revenue-optimization] dashboard_ok low_fix=${lowRevenueFixDoc.fixes.length} mdx_touched=${mdxTouched} dryRun=${dryRun} applyMdx=${applyMdx}`
  );
}

main();
