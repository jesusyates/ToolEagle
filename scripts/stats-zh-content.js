/**
 * v59.2 ZH SEO Stats - Fast analytics for zh content.
 * Run: npm run zh:stats
 */

const path = require("path");
const fs = require("fs");

const CACHE_PATH = path.join(process.cwd(), "data", "zh-seo.json");
const MODIFIERS = ["fast", "beginners", "2026", "strategy", "tips"];

function parseSlug(slug) {
  for (const mod of MODIFIERS) {
    if (slug.endsWith(`-${mod}`)) return slug.slice(0, -mod.length - 1);
  }
  return slug;
}

function extractPlatform(topic) {
  const base = parseSlug(topic);
  if (base.includes("tiktok")) return "tiktok";
  if (base.includes("youtube")) return "youtube";
  if (base.includes("instagram")) return "instagram";
  return "general";
}

function main() {
  let cache;
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    console.log("==== ZH SEO STATS ====\nNo data/zh-seo.json found.\n");
    process.exit(0);
    return;
  }

  let total = 0;
  let published = 0;
  const byType = { "how-to": 0, "content-strategy": 0, "viral-examples": 0, "ai-prompts": 0 };
  const byPlatform = { tiktok: 0, youtube: 0, instagram: 0, general: 0 };

  for (const [pageType, topics] of Object.entries(cache)) {
    if (typeof topics !== "object" || !topics) continue;
    for (const [topic, data] of Object.entries(topics)) {
      if (typeof data !== "object" || !data) continue;
      total++;
      if (data.published === true) published++;
      if (byType[pageType] !== undefined) byType[pageType]++;
      const platform = extractPlatform(topic);
      byPlatform[platform]++;
    }
  }

  const unpublished = total - published;

  console.log("==== ZH SEO STATS ====\n");
  console.log(`Total pages: ${total}`);
  console.log(`Published: ${published}`);
  console.log(`Unpublished: ${unpublished}`);
  console.log("\nBy Type:");
  console.log(`how-to: ${byType["how-to"]}`);
  console.log(`content-strategy: ${byType["content-strategy"]}`);
  console.log(`viral-examples: ${byType["viral-examples"]}`);
  console.log(`ai-prompts: ${byType["ai-prompts"]}`);
  console.log("\nBy Platform:");
  console.log(`tiktok: ${byPlatform.tiktok}`);
  console.log(`youtube: ${byPlatform.youtube}`);
  console.log(`instagram: ${byPlatform.instagram}`);
  console.log(`general: ${byPlatform.general}`);
  console.log("");
}

main();
