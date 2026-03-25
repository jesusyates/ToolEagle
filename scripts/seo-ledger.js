/**
 * SEO Ledger - daily automatic record (no network)
 *
 * Writes:
 * - logs/seo-ledger-YYYY-MM-DD.json
 * - logs/seo-ledger.jsonl (append)
 * - logs/seo-ledger-last.json (for diff computation)
 *
 * What it records:
 * - EN: content/blog mdx items created today that match SEO criteria (category/tags/slug)
 * - ZH: data/zh-seo.json published topics (published:true) + newly-added since last snapshot
 * - totals snapshots for quick "in my head" checks
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const LEDGER_DIR = path.join(process.cwd(), "logs");
const JSONL_PATH = path.join(LEDGER_DIR, "seo-ledger.jsonl");
const LAST_PATH = path.join(LEDGER_DIR, "seo-ledger-last.json");

const CONTENT_BLOG_DIR = path.join(process.cwd(), "content", "blog");
const ZH_SEO_PATH = path.join(process.cwd(), "data", "zh-seo.json");

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isoDateUTC(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(filePath, obj) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
}

function appendJsonl(filePath, obj) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, JSON.stringify(obj) + "\n", "utf8");
}

function listMdxFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).map((f) => path.join(dir, f));
}

function isSeoPostFromFrontmatter(frontmatter, fileSlug) {
  const category = (frontmatter?.category || "").toString().toLowerCase();
  const slug = (frontmatter?.slug || fileSlug || "").toString().toLowerCase();
  const tags = Array.isArray(frontmatter?.tags) ? frontmatter.tags.map((t) => (t || "").toString().toLowerCase()) : [];

  const tagSeo = tags.includes("seo");
  const tagSearchSignals = tags.some((t) =>
    [
      "search engine",
      "indexing",
      "sitemap",
      "robots",
      "baidu",
      "google",
      "crawl",
      "ranking",
      "relevance"
    ].some((k) => t.includes(k))
  );

  return category === "seo" || tagSeo || tagSearchSignals || slug.startsWith("seo-");
}

function readEnSeoPostsToday(dateISO) {
  const mdxFiles = listMdxFiles(CONTENT_BLOG_DIR);
  const results = [];

  for (const filePath of mdxFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const { data } = matter(source);

    const fm = data || {};
    const fileSlug = path.basename(filePath).replace(/\.mdx$/i, "");
    const postDate = (fm.date || "").toString();
    if (postDate !== dateISO) continue;

    if (!isSeoPostFromFrontmatter(fm, fileSlug)) continue;

    const slug = (fm.slug || fileSlug || "").toString();
    const title = (fm.title || "").toString();
    results.push({ slug, title });
  }

  // de-dup by slug
  const seen = new Set();
  const unique = [];
  for (const r of results) {
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    unique.push(r);
  }
  return unique;
}

function getEnTotals() {
  const mdxFiles = listMdxFiles(CONTENT_BLOG_DIR);
  const totalPosts = mdxFiles.length;

  let seoTotalPosts = 0;
  for (const filePath of mdxFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const { data } = matter(source);
    const fileSlug = path.basename(filePath).replace(/\.mdx$/i, "");
    if (isSeoPostFromFrontmatter(data || {}, fileSlug)) seoTotalPosts++;
  }

  return { totalPosts, seoTotalPosts };
}

function getZhSeoPublishedTopics() {
  let cache;
  try {
    cache = JSON.parse(fs.readFileSync(ZH_SEO_PATH, "utf8"));
  } catch {
    cache = null;
  }
  if (!cache) {
    return {
      total: 0,
      published: 0,
      unpublished: 0,
      topics: []
    };
  }

  const topics = [];
  let total = 0;
  let published = 0;
  for (const [pageType, topicMap] of Object.entries(cache)) {
    if (!topicMap || typeof topicMap !== "object") continue;
    for (const [topic, data] of Object.entries(topicMap)) {
      total++;
      const isPub = !!data && data.published === true;
      if (isPub) published++;
      if (isPub) topics.push({ pageType, topic });
    }
  }

  const unpublished = total - published;
  return { total, published, unpublished, topics };
}

function diffTopics(currentTopics, prevTopics) {
  const curSet = new Set(currentTopics.map((x) => `${x.pageType}:${x.topic}`));
  const prevSet = new Set(prevTopics.map((x) => `${x.pageType}:${x.topic}`));
  const added = [];
  const removed = [];

  for (const t of currentTopics) {
    const k = `${t.pageType}:${t.topic}`;
    if (!prevSet.has(k)) added.push(t);
  }
  for (const t of prevTopics) {
    const k = `${t.pageType}:${t.topic}`;
    if (!curSet.has(k)) removed.push(t);
  }
  return { added, removed };
}

function recordSeoLedger({ dateISO = isoDateUTC(), reason = "unknown" } = {}) {
  if (!fs.existsSync(LEDGER_DIR)) fs.mkdirSync(LEDGER_DIR, { recursive: true });

  const enTotals = getEnTotals();
  const enSeoToday = readEnSeoPostsToday(dateISO);

  const zh = getZhSeoPublishedTopics();
  // Daily anchor: first ledger run of the day captures "baseline published set".
  // Subsequent runs show cumulative new published topics since that baseline.
  const dayAnchorPath = path.join(LEDGER_DIR, `seo-ledger-anchor-${dateISO}.json`);
  const anchor = readJson(dayAnchorPath);
  const anchorZhTopics = anchor?.zh?.publishedTopics || null;
  if (!anchorZhTopics) {
    writeJson(dayAnchorPath, { dateISO, zh: { publishedTopics: zh.topics } });
  }
  const baseline = readJson(dayAnchorPath)?.zh?.publishedTopics || [];
  const diff = diffTopics(zh.topics, baseline);

  const prev = readJson(LAST_PATH);
  const prevZhTopics = prev?.zh?.publishedTopics || [];
  // (Optional) kept for debugging / potential future display.
  void prevZhTopics;

  const entry = {
    dateISO,
    generatedAt: new Date().toISOString(),
    reason,
    totals: {
      en: enTotals,
      zh: {
        total: zh.total,
        published: zh.published,
        unpublished: zh.unpublished
      }
    },
    today: {
      enSeoPublished: {
        count: enSeoToday.length,
        items: enSeoToday
      },
      zhNewlyPublished: {
        count: diff.added.length,
        topics: diff.added
      }
    }
  };

  const dayFile = path.join(LEDGER_DIR, `seo-ledger-${dateISO}.json`);
  writeJson(dayFile, entry);
  appendJsonl(JSONL_PATH, entry);

  // update last snapshot for next run
  writeJson(LAST_PATH, {
    dateISO,
    zh: { publishedTopics: zh.topics }
  });

  // small console summary for operators
  console.log(`[seo-ledger] ${dateISO} reason=${reason}`);
  console.log(
    `[seo-ledger] EN seo today: ${enSeoToday.length}, ZH zhNewlyPublished: ${diff.added.length}, zhPublishedTotal: ${zh.published}`
  );

  return entry;
}

function main() {
  const args = process.argv.slice(2);
  const dateArg = args.find((a) => a.startsWith("--date="));
  const dateISO = dateArg ? dateArg.slice("--date=".length) : isoDateUTC();
  const reason = args.find((a) => a.startsWith("--reason="))?.slice("--reason=".length) || "unknown";
  recordSeoLedger({ dateISO, reason });
}

module.exports = { recordSeoLedger };

if (require.main === module) {
  main();
}

