/**
 * V67.1 DAILY share content - for manual distribution
 * Output: data/share-content.txt
 *
 * Run: node scripts/generate-share-content.js
 * Cron: run daily (e.g. 0 6 * * *)
 */

const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tooleagle.com";
const ZH_KEYWORDS_PATH = path.join(process.cwd(), "data", "zh-keywords.json");
// Output to generated/ so GitHub Actions can commit it (data/ is gitignored)
const OUTPUT_PATH = path.join(process.cwd(), "generated", "share-content.txt");
const LIMIT = 20;

function truncate(s, maxLen) {
  if (!s) return "";
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 3) + "...";
}

function main() {
  let cache;
  try {
    cache = JSON.parse(fs.readFileSync(ZH_KEYWORDS_PATH, "utf8"));
  } catch (e) {
    console.error("No zh-keywords.json found");
    process.exit(1);
  }

  const entries = Object.entries(cache)
    .filter(([, d]) => d.published !== false && d.title)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
    .slice(0, LIMIT);

  const lines = [];
  lines.push("# ToolEagle 每日分享内容 - 手动分发");
  lines.push(`# 生成时间: ${new Date().toISOString()}`);
  lines.push(`# 用于: Reddit, X (Twitter), Quora`);
  lines.push("");

  for (const [slug, data] of entries) {
    const title = data.title || data.h1 || data.keyword || slug;
    const oneLiner = data.directAnswer || data.description || (data.intro || "").slice(0, 120);
    const pageUrl = `${BASE_URL}/zh/search/${slug}`;

    const xVersion = truncate(`${title}\n\n${oneLiner}\n\n${pageUrl}`, 280);
    const redditTitle = truncate(title, 300);
    const redditBody = `${oneLiner}\n\n来源：${pageUrl}`;
    const quoraVersion = `${title}\n\n${oneLiner}\n\n完整指南：${pageUrl}`;

    lines.push("=".repeat(60));
    lines.push(`SLUG: ${slug}`);
    lines.push("");
    lines.push("--- Title (吸引点击) ---");
    lines.push(title);
    lines.push("");
    lines.push("--- 1句话价值 ---");
    lines.push(oneLiner);
    lines.push("");
    lines.push("--- Link ---");
    lines.push(pageUrl);
    lines.push("");
    lines.push("--- Reddit版本 (标题+正文) ---");
    lines.push(`标题: ${redditTitle}`);
    lines.push(`正文: ${redditBody}`);
    lines.push("");
    lines.push("--- X版本 ---");
    lines.push(xVersion);
    lines.push("");
    lines.push("--- Quora版本 ---");
    lines.push(quoraVersion);
    lines.push("");
  }

  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf8");

  console.log(`Generated share content for ${entries.length} pages`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main();
