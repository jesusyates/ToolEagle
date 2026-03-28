/**
 * V82: EN Scaling Automation - Generate 20-50 EN pages per run
 * Run: node scripts/en-auto.js
 * Based on: existing zh keywords, translated + adapted patterns
 *
 * Output: Updates src/lib/en-how-to-content.ts with new pages
 * (For now: generates JSON to data/en-how-to-new.json for manual merge)
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { isSeoDryRun, pathInSandbox } = require("./lib/seo-sandbox-context");

const ZH_KEYWORDS_PATH = path.join(process.cwd(), "data", "zh-keywords.json");
const OUTPUT_PATH = isSeoDryRun()
  ? pathInSandbox(process.cwd(), "data", "en-how-to-new.json")
  : path.join(process.cwd(), "data", "en-how-to-new.json");
const LIMIT = 50;

const ZH_TO_EN_GOALS = {
  涨粉: "grow",
  变现: "monetize",
  做爆款: "go viral",
  引流: "drive traffic",
  做内容: "create content",
  获得播放量: "get views",
  提高互动率: "increase engagement",
  账号起号: "start from zero",
  提高完播率: "improve watch time",
  直播带货: "live selling",
  私域引流: "private traffic",
  品牌打造: "品牌打造",
  算法优化: "algorithm optimization",
  数据分析: "data analysis"
};

const PLATFORM_MAP = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function loadZhKeywords() {
  try {
    return JSON.parse(fs.readFileSync(ZH_KEYWORDS_PATH, "utf8"));
  } catch {
    return {};
  }
}

function getExistingEnSlugs() {
  const enPath = path.join(process.cwd(), "src", "lib", "en-how-to-content.ts");
  if (!fs.existsSync(enPath)) return new Set();
  const content = fs.readFileSync(enPath, "utf8");
  const slugs = new Set();
  const re = /"([a-z0-9-]+)":\s*tpl\(/g;
  let m;
  while ((m = re.exec(content)) !== null) slugs.add(m[1]);
  return slugs;
}

function main() {
  const cache = loadZhKeywords();
  const existingEn = getExistingEnSlugs();

  const candidates = [];
  for (const [slug, data] of Object.entries(cache)) {
    if (data.published === false || !data.keyword) continue;
    const platform = slug.startsWith("tiktok-") ? "tiktok" : slug.startsWith("youtube-") ? "youtube" : slug.startsWith("instagram-") ? "instagram" : null;
    if (!platform) continue;
    const goal = data.goal;
    const enGoal = ZH_TO_EN_GOALS[goal] || goal;
    const enSlug = `${slugify(enGoal)}-on-${platform}`;
    if (existingEn.has(enSlug)) continue;
    candidates.push({
      slug: enSlug,
      title: `How to ${enGoal} on ${PLATFORM_MAP[platform]} (2026 Guide)`,
      platform,
      keyword: data.keyword,
      zhSlug: slug
    });
  }

  const toGenerate = candidates.slice(0, LIMIT);

  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: toGenerate.length,
        items: toGenerate
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Generated ${toGenerate.length} EN page candidates`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log("\nTo add to en-how-to-content.ts, use the slugs and titles from the JSON.");
  console.log("Or run with AI to generate full content (future enhancement).");
}

main();
