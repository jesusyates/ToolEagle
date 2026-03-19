/**
 * V70 Revenue Automation - Weekly auto summary
 * Output: data/revenue-summary.json
 *
 * Run: node scripts/revenue-summary.js
 * Requires: SUPABASE_SERVICE_ROLE_KEY or connection to Supabase
 */

const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const base = SUPABASE_URL.replace(/\/$/, "");
  const now = new Date().toISOString();

  const [pageMetrics, toolMetrics] = await Promise.all([
    fetchJson(`${base}/rest/v1/zh_page_revenue_metrics?select=*`),
    fetchJson(`${base}/rest/v1/zh_tool_metrics?select=*`)
  ]);

  const byPage = new Map();
  for (const r of pageMetrics || []) {
    const key = r.page_slug;
    const cur = byPage.get(key) || { slug: key, keyword: r.keyword, views: 0, clicks: 0, revenue: 0 };
    cur.views += r.views || 0;
    cur.clicks += r.clicks || 0;
    cur.revenue += Number(r.estimated_revenue || 0);
    byPage.set(key, cur);
  }

  const pageList = [...byPage.values()];
  const topPages = pageList.sort((a, b) => b.revenue - a.revenue).slice(0, 20);
  const topByViews = [...pageList].sort((a, b) => b.views - a.views).slice(0, 20);

  const toolList = (toolMetrics || []).map((r) => ({
    toolId: r.tool_id,
    views: r.views || 0,
    clicks: r.clicks || 0,
    ctr: (r.views || 0) > 0 ? (r.clicks || 0) / (r.views || 0) : 0,
    revenue: (r.clicks || 0) * 0.5
  }));
  const topTools = toolList.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const lowCtrPages = pageList.filter((p) => p.views > 100 && p.views > 0 && p.clicks / p.views < 0.01).slice(0, 20);

  const byKeyword = new Map();
  for (const p of pageList) {
    const kw = p.keyword || "(无)";
    const cur = byKeyword.get(kw) || { keyword: kw, revenue: 0, clicks: 0 };
    cur.revenue += p.revenue;
    cur.clicks += p.clicks;
    byKeyword.set(kw, cur);
  }
  const bestKeywords = [...byKeyword.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 15);

  const summary = {
    generatedAt: now,
    topPages,
    topPagesByViews: topByViews.slice(0, 10),
    topTools,
    lowCtrPages,
    bestRevenueKeywords: bestKeywords,
    totals: {
      pages: pageList.length,
      totalViews: pageList.reduce((s, p) => s + p.views, 0),
      totalClicks: pageList.reduce((s, p) => s + p.clicks, 0),
      totalRevenue: pageList.reduce((s, p) => s + p.revenue, 0)
    }
  };

  const outDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "revenue-summary.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
