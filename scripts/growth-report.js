/**
 * V82: Weekly Growth Report (AUTO)
 * Run: node scripts/growth-report.js
 * Schedule: weekly (e.g. 0 9 * * 0 for Sunday 9am)
 *
 * Output: pages created, share content generated, backlinks logged, top pages
 * Save: data/growth-report.json
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { Client } = require("pg");

const ZH_KEYWORDS_PATH = path.join(process.cwd(), "data", "zh-keywords.json");
const REPORT_PATH = path.join(process.cwd(), "data", "growth-report.json");
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.tooleagle.com";

function loadZhKeywords() {
  try {
    return JSON.parse(fs.readFileSync(ZH_KEYWORDS_PATH, "utf8"));
  } catch {
    return {};
  }
}

function countZhPages(cache) {
  return Object.entries(cache).filter(([, d]) => d.published !== false).length;
}

function getTopPages(cache, limit = 10) {
  return Object.entries(cache)
    .filter(([, d]) => d.published !== false && (d.title || d.h1 || d.keyword))
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
    .slice(0, limit)
    .map(([slug, d]) => ({
      slug,
      title: d.title || d.h1 || d.keyword,
      url: `${BASE_URL}/zh/search/${slug}`,
      createdAt: d.createdAt
    }));
}

async function getBacklinksCount(client) {
  try {
    const res = await client.query("SELECT COUNT(*) as c FROM backlinks");
    return parseInt(res.rows[0]?.c ?? 0, 10);
  } catch {
    return 0;
  }
}

async function getDistributionQueueCount(client) {
  try {
    const res = await client.query("SELECT COUNT(*) as c FROM distribution_queue WHERE status = 'pending'");
    return parseInt(res.rows[0]?.c ?? 0, 10);
  } catch {
    return 0;
  }
}

async function getShareContentGenerated(client) {
  try {
    const res = await client.query("SELECT COUNT(*) as c FROM distribution_queue");
    return parseInt(res.rows[0]?.c ?? 0, 10);
  } catch {
    return 0;
  }
}

async function main() {
  const cache = loadZhKeywords();
  const pagesCreated = countZhPages(cache);
  const topPages = getTopPages(cache);

  let backlinksLogged = 0;
  let shareContentGenerated = 0;
  let pendingPosts = 0;

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (dbUrl) {
    const client = new Client({ connectionString: dbUrl });
    try {
      await client.connect();
      backlinksLogged = await getBacklinksCount(client);
      shareContentGenerated = await getShareContentGenerated(client);
      pendingPosts = await getDistributionQueueCount(client);
    } catch (e) {
      console.error("DB error:", e.message);
    } finally {
      await client.end();
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    pagesCreated,
    shareContentGenerated,
    backlinksLogged,
    pendingPosts,
    topPages
  };

  const dir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("\n===== Growth Report =====");
  console.log("Pages created:", pagesCreated);
  console.log("Share content generated:", shareContentGenerated);
  console.log("Backlinks logged:", backlinksLogged);
  console.log("Pending posts:", pendingPosts);
  console.log("Top pages:", topPages.length);
  console.log("\nSaved to:", REPORT_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
