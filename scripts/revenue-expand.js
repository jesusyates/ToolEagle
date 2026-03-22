/**
 * V87: Revenue Expansion Script
 * Input: top keywords (from args or API)
 * Output: expanded keyword list, new page candidates
 *
 * Usage:
 *   node scripts/revenue-expand.js "TikTok 变现" "YouTube 涨粉"
 *   node scripts/revenue-expand.js --from-dashboard
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const PLATFORMS = ["tiktok", "youtube", "instagram"];
const PLATFORM_NAMES = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
const GOAL_SLUGS = {
  涨粉: "zhangfen", 变现: "bianxian", 引流: "yinliu",
  做爆款: "baokuan-v2", "做内容": "neirong", 账号起号: "qihao"
};

const EXPANSION_SUFFIXES = [
  { suffix: "方法", slug: "fangfa" },
  { suffix: "新手", slug: "xinshou" },
  { suffix: "工具", slug: "gongju" },
  { suffix: "教程", slug: "jiaocheng" },
  { suffix: "2026", slug: "2026" },
  { suffix: "技巧", slug: "jiqiao" },
  { suffix: "攻略", slug: "gonglue" }
];

function inferPlatform(keyword) {
  if (/TikTok|抖音/.test(keyword)) return "tiktok";
  if (/YouTube|油管/.test(keyword)) return "youtube";
  if (/Instagram|ins/.test(keyword)) return "instagram";
  return "tiktok";
}

function inferGoal(keyword) {
  if (/变现/.test(keyword)) return "变现";
  if (/赚钱/.test(keyword)) return "变现";
  if (/引流/.test(keyword)) return "引流";
  if (/涨粉/.test(keyword)) return "涨粉";
  if (/爆款/.test(keyword)) return "做爆款";
  return "变现";
}

function getGoalSlug(goal) {
  return GOAL_SLUGS[goal] ?? goal.replace(/\s/g, "-").toLowerCase();
}

function expandKeyword(keyword, options = {}) {
  const { crossPlatform = true, maxPerKeyword = 50 } = options;
  const results = [];
  const seen = new Set();

  const platform = inferPlatform(keyword);
  const goal = inferGoal(keyword);
  const goalSlug = getGoalSlug(goal);
  const platformsToUse = crossPlatform ? PLATFORMS : [platform];

  for (const p of platformsToUse) {
    const pName = PLATFORM_NAMES[p];
    for (const { suffix, slug } of EXPANSION_SUFFIXES) {
      const expandedKeyword = `${pName} ${goal} ${suffix}`.replace(/\s+/g, " ").trim();
      const candidateSlug = `${p}-${goalSlug}-${slug}`;
      if (seen.has(candidateSlug)) continue;
      seen.add(candidateSlug);
      results.push({
        keyword: expandedKeyword,
        slug: candidateSlug,
        platform: p,
        goal,
        sourceKeyword: keyword,
        variation: suffix
      });
      if (results.length >= maxPerKeyword) return results;
    }
    const baseOnly = `${pName} ${goal}`.trim();
    const baseSlug = `${p}-${goalSlug}-ruhe`;
    if (!seen.has(baseSlug)) {
      seen.add(baseSlug);
      results.push({
        keyword: baseOnly,
        slug: baseSlug,
        platform: p,
        goal,
        sourceKeyword: keyword,
        variation: "base"
      });
    }
  }
  return results;
}

async function fetchTopKeywordsFromDb() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return [];
  try {
    const { Client } = require("pg");
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    const res = await client.query(`
      SELECT keyword, SUM(clicks) as total_clicks
      FROM zh_page_revenue_metrics
      WHERE keyword IS NOT NULL AND keyword != ''
      GROUP BY keyword
      ORDER BY total_clicks DESC
      LIMIT 5
    `);
    await client.end();
    return (res.rows || []).map((r) => r.keyword);
  } catch (e) {
    console.error("DB fetch error:", e.message);
    return [];
  }
}

async function main() {
  let topKeywords = [];
  const args = process.argv.slice(2);

  if (args.includes("--from-dashboard")) {
    topKeywords = await fetchTopKeywordsFromDb();
    console.log("Fetched from DB:", topKeywords.join(", ") || "(none)");
  } else {
    topKeywords = args.filter((a) => !a.startsWith("--"));
  }

  if (topKeywords.length === 0) {
    topKeywords = ["TikTok 变现", "YouTube 涨粉", "TikTok 引流"];
    console.log("Using default keywords:", topKeywords.join(", "));
  }

  const existingSlugs = new Set();
  try {
    const fs = require("fs");
    const path = require("path");
    const cachePath = path.join(process.cwd(), "data", "zh-keywords.json");
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      Object.keys(cache).forEach((s) => existingSlugs.add(s));
    }
  } catch (_) {}

  const maxTotal = 200;
  const perKeyword = Math.ceil(maxTotal / topKeywords.length);
  const allCandidates = [];
  const bySource = {};

  for (const kw of topKeywords.slice(0, 3)) {
    const expanded = expandKeyword(kw, {
      crossPlatform: true,
      maxPerKeyword: Math.min(perKeyword, 70)
    });
    const filtered = expanded.filter((c) => !existingSlugs.has(c.slug));
    bySource[kw] = filtered;
    for (const c of filtered) {
      if (!existingSlugs.has(c.slug)) {
        existingSlugs.add(c.slug);
        allCandidates.push(c);
      }
    }
  }

  const output = {
    inputKeywords: topKeywords,
    expandedCount: allCandidates.length,
    candidates: allCandidates.slice(0, maxTotal),
    bySource: Object.fromEntries(
      Object.entries(bySource).map(([k, v]) => [k, v.slice(0, 20)])
    ),
    internalLinkStructure: {
      mainMoneyPage: allCandidates[0]
        ? { slug: topKeywords[0]?.replace(/\s/g, "-").toLowerCase(), keyword: topKeywords[0] }
        : null,
      topToolLink: "/go/copy-ai",
      relatedPages: allCandidates.slice(0, 10).map((c) => ({ slug: c.slug, keyword: c.keyword }))
    }
  };

  console.log("\n=== Revenue Expansion Output ===\n");
  console.log("Input keywords:", topKeywords.join(", "));
  console.log("Expanded candidates:", allCandidates.length);
  console.log("\nSample new pages (first 15):");
  allCandidates.slice(0, 15).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.keyword} → /zh/search/${c.slug}`);
  });
  console.log("\nBy source:");
  Object.entries(bySource).forEach(([src, list]) => {
    console.log(`  ${src}: ${list.length} candidates`);
  });

  const outPath = require("path").join(process.cwd(), "generated", "revenue-expansion.json");
  require("fs").mkdirSync(require("path").dirname(outPath), { recursive: true });
  require("fs").writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`\nWritten to ${outPath}`);
}

main().catch(console.error);
