/**
 * V96 — Scan existing SEO content for quality-gate violations.
 * Usage: node scripts/seo-quality-scan.js
 *
 * Reports counts only (does not mutate content).
 */

const fs = require("fs");
const path = require("path");
const {
  validateZhKeywordContent,
  validateZhGuideContent,
  validateEnBlogMdx
} = require("./lib/seo-quality-gate");

const ROOT = process.cwd();
const ZH_GUIDE = path.join(ROOT, "data", "zh-seo.json");
const ZH_KEYWORDS = path.join(ROOT, "data", "zh-keywords.json");
const EN_BLOG = path.join(ROOT, "content", "blog");
const EN_FAIL_SLUGS_OUT = path.join(ROOT, "generated", "quality-gate", "en-blog-failing-slugs.json");

function loadJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function scanZhGuide() {
  if (!fs.existsSync(ZH_GUIDE)) return { exists: false };
  const cache = loadJson(ZH_GUIDE, {});
  let total = 0;
  let published = 0;
  let failingPublished = 0;
  for (const [pageType, topics] of Object.entries(cache)) {
    if (!topics || typeof topics !== "object") continue;
    for (const [topic, data] of Object.entries(topics)) {
      if (!data || typeof data !== "object") continue;
      total++;
      if (data.published === true) {
        published++;
        const gate = validateZhGuideContent({ pageType, topic, content: data });
        if (!gate.ok) failingPublished++;
      }
    }
  }
  return { exists: true, total, published, failingPublished };
}

function scanZhKeywords() {
  if (!fs.existsSync(ZH_KEYWORDS)) return { exists: false };
  const cache = loadJson(ZH_KEYWORDS, {});
  let total = 0;
  let published = 0;
  let failingPublished = 0;
  for (const [slug, data] of Object.entries(cache)) {
    if (!data || typeof data !== "object") continue;
    total++;
    if (data.published === false) continue;
    published++;
    const gate = validateZhKeywordContent({ slug, keyword: data.keyword || data.h1 || slug, content: data });
    if (!gate.ok) failingPublished++;
  }
  return { exists: true, total, published, failingPublished };
}

function scanEnBlog() {
  if (!fs.existsSync(EN_BLOG)) return { exists: false };
  const files = fs.readdirSync(EN_BLOG).filter((f) => f.endsWith(".mdx"));
  let scanned = 0;
  let failing = 0;
  const failingSlugs = [];
  for (const f of files) {
    const slug = f.replace(/\.mdx$/i, "");
    const mdx = fs.readFileSync(path.join(EN_BLOG, f), "utf8");
    if (!mdx.trim()) continue;
    scanned++;
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
      recommendedTools: ["(best-effort)"],
      minBodyChars: 900
    });
    if (!gate.ok) failing++;
    if (!gate.ok) failingSlugs.push(slug);
  }

  if (failingSlugs.length > 0) {
    const outDir = path.dirname(EN_FAIL_SLUGS_OUT);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(EN_FAIL_SLUGS_OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: failingSlugs.length, slugs: failingSlugs }, null, 2), "utf8");
  } else {
    if (fs.existsSync(EN_FAIL_SLUGS_OUT)) fs.unlinkSync(EN_FAIL_SLUGS_OUT);
  }
  return { exists: true, scanned, failing };
}

function main() {
  console.log("\n=== V96 SEO Quality Scan ===\n");
  const g = scanZhGuide();
  const k = scanZhKeywords();
  const b = scanEnBlog();

  if (g.exists) {
    console.log(`[ZH guide] total=${g.total} published=${g.published} failing_published=${g.failingPublished}`);
  } else {
    console.log("[ZH guide] data/zh-seo.json not found");
  }

  if (k.exists) {
    console.log(`[ZH keyword] total=${k.total} published=${k.published} failing_published=${k.failingPublished}`);
  } else {
    console.log("[ZH keyword] data/zh-keywords.json not found");
  }

  if (b.exists) {
    console.log(`[EN blog] scanned=${b.scanned} failing=${b.failing}`);
  } else {
    console.log("[EN blog] content/blog not found");
  }

  console.log("\n============================\n");

  const failOn = process.argv.includes("--fail-on-violations");
  if (failOn) {
    const zhFail =
      (g.exists ? g.failingPublished || 0 : 0) + (k.exists ? k.failingPublished || 0 : 0);
    const enFail = b.exists ? b.failing || 0 : 0;
    if (zhFail > 0 || enFail > 0) {
      console.error(
        `[seo-quality-scan] --fail-on-violations: zh_failing_published=${zhFail} en_blog_failing=${enFail}`
      );
      process.exit(1);
    }
  }
}

main();

