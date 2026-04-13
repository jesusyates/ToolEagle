#!/usr/bin/env node
/**
 * V112 — Build generated/page-optimization-candidates.json from search-performance + growth-priority
 *
 * Usage: node scripts/build-page-optimization-candidates.js
 */

const fs = require("fs");
const path = require("path");
const {
  PATH_SEARCH,
  PATH_GROWTH,
  safeReadJson,
  blogSlugFromPath
} = require("./lib/page-optimization-shared");

const OUT = path.join(process.cwd(), "generated", "page-optimization-candidates.json");

function priorityForPage(p, growthBlog) {
  const last = p.last14 || {};
  const imp = last.impressions ?? 0;
  const clk = last.clicks ?? 0;
  const ctr = last.ctr ?? 0;
  const pos = last.position ?? 0;
  const b = p.bucket;

  const parts = [];
  let tier = 99;
  let rank = 0;

  if (b === "high_potential") {
    tier = 1;
    rank = 1000 + Math.min(imp, 5000);
    parts.push(`high_potential: high impressions (${imp}) but CTR ${(ctr * 100).toFixed(2)}% below target`);
  } else if (b === "rising_pages" && ctr < 0.035) {
    tier = 2;
    rank = 800 + imp * 0.5;
    parts.push(`rising_pages with weak CTR (${(ctr * 100).toFixed(2)}%) — capture more clicks`);
  } else if (b === "rising_pages") {
    tier = 4;
    rank = 400 + imp * 0.3;
    parts.push(`rising_pages — tighten SERP snippet to improve click yield`);
  } else if (b === "winners" && imp >= 80 && ctr < 0.055) {
    tier = 3;
    rank = 600 + imp;
    parts.push(`winner with room to lift CTR (${(ctr * 100).toFixed(2)}%) further`);
  } else if (b === "winners") {
    tier = 5;
    rank = 200 + imp * 0.2;
    parts.push(`winner — optional meta/title polish for incremental gains`);
  } else {
    parts.push(`bucket=${b} — lower priority for CTR pass`);
    rank = imp;
  }

  if (growthBlog && typeof growthBlog.growthScore === "number") {
    parts.push(`growthScore=${growthBlog.growthScore}`);
    rank += growthBlog.growthScore * 50;
  }

  return { tier, rank, priorityReason: parts.join(" · ") };
}

function main() {
  const search = safeReadJson(PATH_SEARCH);
  const growth = safeReadJson(PATH_GROWTH) || {};
  const growthBlogs = growth.blogs && typeof growth.blogs === "object" ? growth.blogs : {};

  if (!search || !Array.isArray(search.pages)) {
    const stub = {
      updatedAt: new Date().toISOString(),
      error:
        "Missing or invalid generated/search-performance.json — add or refresh that file manually (legacy GSC pull script removed)",
      candidates: []
    };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(stub, null, 2), "utf8");
    console.warn("[build-page-optimization-candidates] Wrote stub — no search-performance data.");
    return;
  }

  const candidates = [];
  for (const p of search.pages) {
    if (p.pageType !== "blog") continue;
    const slug = blogSlugFromPath(p.path);
    if (!slug) continue;
    const last = p.last14 || {};
    const { tier, rank, priorityReason } = priorityForPage(p, growthBlogs[slug]);

    candidates.push({
      path: p.path,
      slug,
      bucket: p.bucket,
      impressions: last.impressions ?? 0,
      clicks: last.clicks ?? 0,
      ctr: last.ctr ?? 0,
      position: last.position ?? 0,
      priorityTier: tier,
      priorityRank: rank,
      priorityReason,
      growthScore: growthBlogs[slug]?.growthScore ?? null
    });
  }

  candidates.sort((a, b) => b.priorityRank - a.priorityRank);

  const out = {
    updatedAt: new Date().toISOString(),
    source: "search-performance.json + growth-priority.json",
    selectionNote:
      "Tier 1–3: primary CTR work (high_potential, rising+low CTR, winners with CTR headroom). Tier 4–5: secondary.",
    candidates
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`[build-page-optimization-candidates] ${candidates.length} blog pages → ${OUT}`);
}

main();
