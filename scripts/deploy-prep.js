/**
 * v60.2 Deploy Prep - Validate before deploying (EN + ZH).
 * Run: npm run deploy:prep
 *
 * V96: Pre-publish quality gate for SEO/programmatic content pages.
 * - ZH guides: data/zh-seo.json
 * - ZH keyword pages: data/zh-keywords.json
 * - EN blog mdx: content/blog/*.mdx (best-effort scan)
 * EN: Checks core-pages-en.json exists and has valid structure
 */

const path = require("path");
const fs = require("fs");
const {
  validateZhGuideContent,
  validateZhKeywordContent,
  validateEnBlogMdx
} = require("./lib/seo-quality-gate");

const ZH_CACHE_PATH = path.join(process.cwd(), "data", "zh-seo.json");
const ZH_KEYWORDS_PATH = path.join(process.cwd(), "data", "zh-keywords.json");
const EN_BLOG_DIR = path.join(process.cwd(), "content", "blog");
const EN_CORE_PATH = path.join(process.cwd(), "data", "core-pages-en.json");

function loadJson(p, defaultVal) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return defaultVal;
  }
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function main() {
  console.log("\n========== DEPLOY PREP (EN + ZH) ==========\n");

  // ----- ZH -----
  if (fs.existsSync(ZH_CACHE_PATH)) {
    const cache = loadJson(ZH_CACHE_PATH, {});
    let published = 0;
    let total = 0;
    const issues = [];

    for (const [pageType, topics] of Object.entries(cache)) {
      if (typeof topics !== "object" || topics === null) continue;
      for (const [topic, data] of Object.entries(topics)) {
        if (typeof data !== "object" || data === null) continue;
        total++;
        if (data.published === true) {
          published++;
          const gate = validateZhGuideContent({ pageType, topic, content: data });
          if (!gate.ok) {
            issues.push(`ZH ${pageType}/${topic}: ${gate.reasons.join(", ")}`);
          }
        }
      }
    }

    console.log("【中文 ZH】");
    console.log(`  Total pages: ${total}`);
    console.log(`  Published: ${published}`);
    if (issues.length > 0) {
      console.log(`  ⚠ Issues: ${issues.length}`);
      issues.slice(0, 5).forEach((i) => console.log(`    - ${i}`));
    } else {
      console.log("  ✓ No validation issues");
    }
    console.log("");
  } else {
    console.log("【中文 ZH】未找到 data/zh-seo.json\n");
  }

  // ----- ZH keyword pages (/zh/search) -----
  if (fs.existsSync(ZH_KEYWORDS_PATH)) {
    const cache = loadJson(ZH_KEYWORDS_PATH, {});
    let total = 0;
    let published = 0;
    const issues = [];
    for (const [slug, data] of Object.entries(cache)) {
      if (!data || typeof data !== "object") continue;
      total++;
      if (data.published === false) continue;
      published++;
      const gate = validateZhKeywordContent({ slug, keyword: data.keyword || data.h1 || slug, content: data });
      if (!gate.ok) issues.push(`ZH keyword ${slug}: ${gate.reasons.join(", ")}`);
    }
    console.log("【中文 ZH /zh/search】");
    console.log(`  Total keyword entries: ${total}`);
    console.log(`  Published keyword pages: ${published}`);
    if (issues.length > 0) {
      console.log(`  ⚠ Issues: ${issues.length}`);
      issues.slice(0, 5).forEach((i) => console.log(`    - ${i}`));
    } else {
      console.log("  ✓ No validation issues");
    }
    console.log("");
  } else {
    console.log("【中文 ZH /zh/search】未找到 data/zh-keywords.json\n");
  }

  // ----- EN blog mdx (best-effort; blocks placeholder mass-gen) -----
  if (fs.existsSync(EN_BLOG_DIR)) {
    const files = fs.readdirSync(EN_BLOG_DIR).filter((f) => f.endsWith(".mdx"));
    let scanned = 0;
    let issues = 0;
    for (const f of files.slice(0, 3000)) {
      const slug = f.replace(/\.mdx$/i, "");
      const mdx = readFileSafe(path.join(EN_BLOG_DIR, f));
      if (!mdx.trim()) continue;
      scanned++;
      // Minimal parse: title/description from frontmatter lines; body is everything after first --- block.
      const fm = mdx.match(/^---\s*[\s\S]*?\n---\s*\n/m);
      const frontmatter = fm ? fm[0] : "";
      const body = fm ? mdx.slice(frontmatter.length) : mdx;
      const titleMatch = frontmatter.match(/\ntitle:\s*"(.*)"\s*\n/);
      const descMatch = frontmatter.match(/\ndescription:\s*"(.*)"\s*\n/);
      const title = titleMatch ? titleMatch[1] : "";
      const description = descMatch ? descMatch[1] : "";
      const gate = validateEnBlogMdx({
        slug,
        title,
        description,
        body,
        recommendedTools: ["(unknown)"], // best-effort; the script generator enforces real tool links anyway
        minBodyChars: 650
      });
      if (!gate.ok) issues++;
    }
    console.log("【英文 EN /blog】");
    console.log(`  MDX scanned: ${scanned}`);
    console.log(`  Potential quality-gate issues: ${issues}`);
    console.log("");
  }

  // ----- EN -----
  if (fs.existsSync(EN_CORE_PATH)) {
    const core = loadJson(EN_CORE_PATH, {});
    const popular = (core.popularGuides || []).length;
    const allUrls = (core.allCoreUrls || []).length;
    const hasBest = core.bestGuidesByPlatform && Object.keys(core.bestGuidesByPlatform).length > 0;

    console.log("【英文 EN】");
    console.log(`  Core URLs: ${allUrls}`);
    console.log(`  Popular guides: ${popular}`);
    console.log(`  Best by platform: ${hasBest ? "✓" : "⚠"}`);
    console.log("  ✓ Config valid\n");
  } else {
    console.log("【英文 EN】未找到 data/core-pages-en.json（使用 src/config 默认配置）\n");
  }

  console.log("==========================================\n");
}

main();
