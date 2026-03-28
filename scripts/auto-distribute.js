/**
 * V82: Auto Distribution System - Generate share content for latest pages
 * Run: node scripts/auto-distribute.js
 * Schedule: daily after zh:auto / en:auto
 *
 * For latest 20-50 pages (zh + en):
 * - Generate Reddit post, X thread, Quora answer
 * - Store in distribution_queue (no auto posting)
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { Client } = require("pg");
const { isSeoDryRun, ensureSandboxDir } = require("./lib/seo-sandbox-context");

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.tooleagle.com";
const ZH_KEYWORDS_PATH = path.join(process.cwd(), "data", "zh-keywords.json");
const LIMIT = 50;

function truncate(s, maxLen) {
  if (!s) return "";
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 3) + "...";
}

function generateReddit(title, oneLiner, pageUrl, slug) {
  const isZh = slug.startsWith("tiktok-") || slug.startsWith("youtube-") || slug.startsWith("instagram-");
  const redditTitle = truncate(title, 300);
  const redditBody = isZh
    ? `分享一个我最近在用的方法：\n\n${oneLiner}\n\n完整指南：${pageUrl}`
    : `Sharing a method I've been using:\n\n${oneLiner}\n\nFull guide: ${pageUrl}`;
  return { redditTitle, redditBody };
}

function generateXThread(title, oneLiner, pageUrl) {
  const tweet1 = truncate(`🔥 ${title}`, 280);
  const tweet2 = truncate(oneLiner, 280);
  const tweet3 = truncate(`Full method here → ${pageUrl}`, 280);
  return `${tweet1}\n\n---\n\n${tweet2}\n\n---\n\n${tweet3}`;
}

function generateQuora(title, oneLiner, pageUrl, slug) {
  const isZh = slug.startsWith("tiktok-") || slug.startsWith("youtube-") || slug.startsWith("instagram-");
  return isZh
    ? `根据我的实践，${oneLiner}\n\n详细步骤和案例可以看这个指南：${pageUrl}`
    : `Based on my experience, ${oneLiner}\n\nSee the full guide with steps: ${pageUrl}`;
}

function loadZhPages(limit) {
  let cache;
  try {
    cache = JSON.parse(fs.readFileSync(ZH_KEYWORDS_PATH, "utf8"));
  } catch (e) {
    return [];
  }
  return Object.entries(cache)
    .filter(([, d]) => d.published !== false && (d.title || d.h1 || d.keyword))
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
    .slice(0, limit)
    .map(([slug, data]) => ({
      slug,
      pageType: "zh-search",
      title: data.title || data.h1 || data.keyword || slug,
      oneLiner: (data.directAnswer || data.description || (data.intro || "").slice(0, 150)).slice(0, 200),
      pageUrl: `${BASE_URL}/zh/search/${slug}`
    }));
}

function loadEnPages(limit) {
  const enPath = path.join(process.cwd(), "src", "lib", "en-how-to-content.ts");
  if (!fs.existsSync(enPath)) return [];
  const content = fs.readFileSync(enPath, "utf8");
  const pages = [];
  const re = /"([a-z0-9-]+)":\s*tpl\(\s*"\1",\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    pages.push({ slug: m[1], title: m[2] });
  }
  return pages.slice(0, limit).map(({ slug, title }) => ({
    slug,
    pageType: "en-how-to",
    title,
    oneLiner: `${title} - Free guide from ToolEagle`,
    pageUrl: `${BASE_URL}/en/how-to/${slug}`
  }));
}

async function main() {
  const dry = isSeoDryRun();
  if (dry) {
    console.log("[auto-distribute] V157 dry-run: skipping DB upsert; writing distribution JSON to sandbox only.");
  }
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.log("SUPABASE_DB_URL not set. Skipping DB insert. Writing to generated/distribution-queue.json instead.");
  }

  const zhPages = loadZhPages(Math.ceil(LIMIT / 2));
  const enPages = loadEnPages(Math.floor(LIMIT / 2));
  const allPages = [...zhPages, ...enPages].slice(0, LIMIT);

  console.log(`Generated share content for ${allPages.length} pages (${zhPages.length} zh, ${enPages.length} en)`);

  const results = [];
  for (const page of allPages) {
    const { redditTitle, redditBody } = generateReddit(page.title, page.oneLiner, page.pageUrl, page.slug);
    const xThread = generateXThread(page.title, page.oneLiner, page.pageUrl);
    const quoraAnswer = generateQuora(page.title, page.oneLiner, page.pageUrl, page.slug);

    results.push({
      slug: page.slug,
      page_type: page.pageType,
      title: page.title,
      one_liner: page.oneLiner,
      page_url: page.pageUrl,
      reddit_title: redditTitle,
      reddit_body: redditBody,
      x_thread: xThread,
      quora_answer: quoraAnswer
    });
  }

  if (dbUrl && !dry) {
    const client = new Client({ connectionString: dbUrl });
    try {
      await client.connect();
      let inserted = 0;
      for (const r of results) {
        await client.query(
          `INSERT INTO distribution_queue (slug, page_type, title, one_liner, page_url, reddit_title, reddit_body, x_thread, quora_answer, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
           ON CONFLICT (slug, page_type) DO UPDATE SET
             title = EXCLUDED.title, one_liner = EXCLUDED.one_liner, page_url = EXCLUDED.page_url,
             reddit_title = EXCLUDED.reddit_title, reddit_body = EXCLUDED.reddit_body,
             x_thread = EXCLUDED.x_thread, quora_answer = EXCLUDED.quora_answer,
             status = CASE WHEN distribution_queue.status = 'posted' THEN 'posted' ELSE 'pending' END`,
          [r.slug, r.page_type, r.title, r.one_liner, r.page_url, r.reddit_title, r.reddit_body, r.x_thread, r.quora_answer]
        );
        inserted++;
      }
      console.log(`Upserted ${inserted} rows into distribution_queue`);
    } catch (e) {
      if (e.code === "42P01") {
        console.log("Table distribution_queue not found. Run: npm run db:migrate");
      } else {
        console.error("DB error:", e.message);
      }
    } finally {
      await client.end();
    }
  }

  const outDir = dry ? ensureSandboxDir(process.cwd()) : path.join(process.cwd(), "generated");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "distribution-queue.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), items: results }, null, 2),
    "utf8"
  );
  console.log(`Generated: generated/distribution-queue.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
