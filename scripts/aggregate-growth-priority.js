#!/usr/bin/env node
/**
 * V110 — Unified growth scores from V107 (search) + V108 (conversion) + V109 (quality).
 * Reads generated JSON from prior steps; writes generated/growth-priority.json
 *
 * Usage: node scripts/aggregate-growth-priority.js
 */

const fs = require("fs");
const path = require("path");

const PATH_SEARCH = path.join(process.cwd(), "generated", "search-performance.json");
const PATH_CONV = path.join(process.cwd(), "generated", "tool-conversion-map.json");
const PATH_QUALITY = path.join(process.cwd(), "generated", "tool-output-quality.json");
const OUT = path.join(process.cwd(), "generated", "growth-priority.json");

const W_BLOG_SEARCH = 0.5;
const W_BLOG_CONV = 0.5;
const W_TOOL_CONV = 0.4;
const W_TOOL_QUAL = 0.6;

function blogSlugFromPath(pathname) {
  if (!pathname || !pathname.startsWith("/blog/")) return null;
  const rest = pathname.replace(/\/$/, "").slice("/blog/".length);
  if (!rest || rest.includes("/")) return null;
  return rest;
}

function toolSlugFromPath(pathname) {
  if (!pathname || !pathname.startsWith("/tools/")) return null;
  const rest = pathname.replace(/\/$/, "").slice("/tools/".length);
  const seg = rest.split("/")[0];
  return seg || null;
}

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/** Map x>=0 to [0,1] using max log1p in cohort (avoids single huge page dominating). */
function makeLogNormalizer(values) {
  const logs = values.map((v) => Math.log1p(Math.max(0, Number(v) || 0)));
  const maxL = Math.max(1e-9, ...logs);
  return (v) => Math.log1p(Math.max(0, Number(v) || 0)) / maxL;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function main() {
  const search = safeReadJson(PATH_SEARCH);
  const conv = safeReadJson(PATH_CONV) || {};
  const quality = safeReadJson(PATH_QUALITY) || {};

  const blogBySlug = new Map();
  const toolBySlug = new Map();

  /** V107 — blog + tool page rows */
  const pages = Array.isArray(search?.pages) ? search.pages : [];
  for (const p of pages) {
    if (p.pageType === "blog") {
      const slug = blogSlugFromPath(p.path);
      if (!slug) continue;
      const last = p.last14 || {};
      const imp = last.impressions ?? 0;
      const ctr = last.ctr ?? 0;
      const pos = last.position ?? 50;
      const prev = blogBySlug.get(slug);
      if (!prev || imp > (prev.impressions || 0)) {
        blogBySlug.set(slug, { impressions: imp, ctr, position: pos });
      }
    }
    if (p.pageType === "tool") {
      const slug = toolSlugFromPath(p.path);
      if (!slug) continue;
      const last = p.last14 || {};
      const imp = last.impressions ?? 0;
      const ctr = last.ctr ?? 0;
      const pos = last.position ?? 50;
      const prev = toolBySlug.get(slug);
      if (!prev || imp > (prev.impressions || 0)) {
        toolBySlug.set(slug, { impressions: imp, ctr, position: pos });
      }
    }
  }

  const convBlogs = conv.blogs && typeof conv.blogs === "object" ? conv.blogs : {};
  const allBlogSlugs = new Set([...blogBySlug.keys(), ...Object.keys(convBlogs)]);

  const impList = [];
  const ctrList = [];
  for (const slug of allBlogSlugs) {
    const g = blogBySlug.get(slug);
    impList.push(g?.impressions ?? 0);
    ctrList.push(g?.ctr ?? 0);
  }
  const normImp = makeLogNormalizer(impList.length ? impList : [0]);
  const maxCtr = Math.max(1e-6, ...ctrList, 0.001);
  const maxPos = Math.max(...[...blogBySlug.values()].map((b) => b.position || 1), 50);

  const blogRows = [];
  for (const slug of allBlogSlugs) {
    const g = blogBySlug.get(slug);
    const c = convBlogs[slug];
    const imp = g?.impressions ?? 0;
    const ctr = g?.ctr ?? 0;
    const pos = g?.position ?? maxPos;
    const impN = normImp(imp);
    const ctrN = clamp01(ctr / maxCtr);
    const posN = clamp01(1 - (pos - 1) / Math.max(1, maxPos - 1));
    const searchScore = g ? clamp01(0.35 * impN + 0.35 * ctrN + 0.3 * posN) : null;

    const tc = c?.toolClicksTotal ?? 0;
    const te = c?.toolEntriesTotal ?? 0;
    const rawConv = tc + 3 * te;
    const convScores = [...Object.keys(convBlogs)].map((s) => {
      const x = convBlogs[s];
      return (x?.toolClicksTotal ?? 0) + 3 * (x?.toolEntriesTotal ?? 0);
    });
    const normConv = makeLogNormalizer(convScores.length ? convScores : [0]);
    const conversionScore = c ? clamp01(normConv(rawConv)) : null;

    let growthScore;
    if (searchScore != null && conversionScore != null) {
      growthScore = clamp01(W_BLOG_SEARCH * searchScore + W_BLOG_CONV * conversionScore);
    } else if (searchScore != null) {
      growthScore = clamp01(searchScore);
    } else if (conversionScore != null) {
      growthScore = clamp01(conversionScore);
    } else {
      growthScore = 0;
    }

    blogRows.push({
      slug,
      growthScore,
      searchScore: searchScore ?? null,
      conversionScore: conversionScore ?? null,
      components: {
        impressions: imp,
        ctr,
        position: pos,
        toolClicksTotal: tc,
        toolEntriesTotal: te
      }
    });
  }

  blogRows.sort((a, b) => b.growthScore - a.growthScore);

  /** Aggregate tool-level conversion from all blogs */
  const toolConvRaw = new Map();
  for (const b of Object.values(convBlogs)) {
    const tc = b?.toolClicks || {};
    const te = b?.toolEntries || {};
    for (const [t, n] of Object.entries(tc)) {
      toolConvRaw.set(t, (toolConvRaw.get(t) || 0) + Number(n) || 0);
    }
    for (const [t, n] of Object.entries(te)) {
      toolConvRaw.set(t, (toolConvRaw.get(t) || 0) + 3 * (Number(n) || 0));
    }
  }

  const toolSlugs = new Set([...toolConvRaw.keys(), ...Object.keys(quality.tools || {})]);
  for (const slug of toolBySlug.keys()) toolSlugs.add(slug);

  const convVals = [...toolConvRaw.values()];
  const normToolConv = makeLogNormalizer(convVals.length ? convVals : [0]);

  const toolRows = [];
  for (const slug of toolSlugs) {
    const rawC = toolConvRaw.get(slug) || 0;
    const conversionScore = toolConvRaw.has(slug) || convVals.length ? clamp01(normToolConv(rawC)) : null;

    const q = quality.tools?.[slug];
    const qualityScore =
      q && typeof q.qualityScore === "number" ? clamp01(q.qualityScore) : null;

    let growthScore;
    if (conversionScore != null && qualityScore != null) {
      growthScore = clamp01(W_TOOL_CONV * conversionScore + W_TOOL_QUAL * qualityScore);
    } else if (conversionScore != null) {
      growthScore = clamp01(W_TOOL_CONV * conversionScore + W_TOOL_QUAL * 0.5);
    } else if (qualityScore != null) {
      growthScore = clamp01(W_TOOL_CONV * 0.5 + W_TOOL_QUAL * qualityScore);
    } else {
      growthScore = 0;
    }

    const gsc = toolBySlug.get(slug);
    toolRows.push({
      slug,
      growthScore,
      conversionScore: conversionScore ?? null,
      qualityScore: qualityScore ?? null,
      components: {
        aggregatedConversionWeighted: rawC,
        impressions: gsc?.impressions ?? 0,
        ctr: gsc?.ctr ?? 0,
        position: gsc?.position ?? null
      }
    });
  }

  toolRows.sort((a, b) => b.growthScore - a.growthScore);

  const topBlogs = blogRows.filter((r) => r.growthScore > 0).slice(0, 30);
  const topTools = toolRows.filter((r) => r.growthScore > 0).slice(0, 30);

  const median = (arr) => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  const blogScores = blogRows.map((r) => r.growthScore).filter((x) => x > 0);
  const medB = median(blogScores);
  const underperformingBlogs = blogRows
    .filter((r) => r.growthScore > 0 && r.growthScore < medB && r.growthScore < 0.45)
    .sort((a, b) => a.growthScore - b.growthScore)
    .slice(0, 25);

  const toolScores = toolRows.map((r) => r.growthScore).filter((x) => x > 0);
  const medT = median(toolScores);
  const underperformingTools = toolRows
    .filter((r) => r.growthScore > 0 && r.growthScore < medT && r.growthScore < 0.45)
    .sort((a, b) => a.growthScore - b.growthScore)
    .slice(0, 25);

  const out = {
    updatedAt: new Date().toISOString(),
    sources: {
      searchPerformance: fs.existsSync(PATH_SEARCH),
      toolConversionMap: fs.existsSync(PATH_CONV),
      toolOutputQuality: fs.existsSync(PATH_QUALITY)
    },
    weights: {
      blog: { searchScore: W_BLOG_SEARCH, conversionScore: W_BLOG_CONV },
      tool: { conversionScore: W_TOOL_CONV, qualityScore: W_TOOL_QUAL }
    },
    normalization: {
      counts: "log1p relative to cohort max",
      ctr: "divide by max CTR in blog/tool GSC cohort",
      position: "linear invert: 1 - (pos-1)/(maxPos-1)",
      regen: "embedded in V109 qualityScore (already penalizes high regenRatio)",
      blogConversion: "log1p(clicks + 3*entries) vs max across blogs",
      toolConversion: "log1p(aggregated weighted clicks+entries across blogs) vs cohort max"
    },
    blogs: blogRows,
    tools: toolRows,
    topBlogs,
    topTools,
    underperformingBlogs,
    underperformingTools,
    decisions: {
      expandTopicsFrom: topBlogs.slice(0, 15).map((b) => b.slug),
      improveToolsFirst: underperformingTools.slice(0, 15).map((t) => t.slug),
      linkBoostSlugs: topBlogs.slice(0, 40).map((b) => b.slug),
      reduceFocusSlugs: underperformingBlogs.slice(0, 25).map((b) => b.slug),
      note:
        "Batch-only. Merge with en-internal-linking via growth-priority.json (topBlogs → priority, underperformingBlogs → weak)."
    }
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(
    `[aggregate-growth-priority] blogs=${blogRows.length} tools=${toolRows.length} → ${OUT}`
  );
}

main();
