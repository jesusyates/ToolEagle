/**
 * v54 Generate Chinese SEO content via AI.
 * Run: node scripts/generate-zh-seo-content.js
 * Requires: OPENAI_API_KEY
 * Optional: OPENAI_BASE_URL (for proxy, e.g. https://your-proxy/v1)
 *
 * Generates top 200 topics × 4 page types. Use --limit N to limit.
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { openaiChatCompletions, getModel } = require("./lib/openai-fetch");

const CACHE_PATH = path.join(process.cwd(), "data", "zh-seo.json");

async function generateWithOpenAI(prompt, apiKey) {
  try {
    const content = await openaiChatCompletions(
      {
        model: getModel(),
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      },
      apiKey
    );
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, content];
    const jsonStr = (jsonMatch[1] || content).trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("OpenAI error:", e.message);
    throw e;
  }
}

function formatTopicLabel(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPageLabel(pageType, topicLabel) {
  const labels = {
    "how-to": `如何${topicLabel}`,
    "ai-prompts": `${topicLabel} AI 提示词`,
    "content-strategy": `${topicLabel} 内容策略`,
    "viral-examples": `${topicLabel} 爆款案例`
  };
  return labels[pageType] || topicLabel;
}

const MODIFIERS = ["fast", "beginners", "2026", "strategy", "tips"];

function parseSlug(slug) {
  for (const mod of MODIFIERS) {
    const suffix = `-${mod}`;
    if (slug.endsWith(suffix)) return { baseTopic: slug.slice(0, -suffix.length), modifier: mod };
  }
  return { baseTopic: slug, modifier: null };
}

const MOD_LABELS = { fast: "快速", beginners: "新手", "2026": "2026", strategy: "策略", tips: "技巧" };

function buildPrompt(pageType, topic) {
  const { baseTopic, modifier } = parseSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic);
  const modLabel = modifier ? MOD_LABELS[modifier] || modifier : "";
  const focus = modifier ? { fast: "侧重快速见效", beginners: "侧重零基础入门", "2026": "侧重2026最新趋势", strategy: "侧重长期策略", tips: "侧重实用技巧" }[modifier] || "";

  const instructions = {
    "how-to": `写一篇关于「${topicLabel}」的完整指南${focus ? `，${focus}` : ""}。必须包含：直接回答（40-80字）、分步骤指南、3个FAQ、技巧。总字数 1200-2000 字。`,
    "ai-prompts": `写一篇关于「${topicLabel}」的 AI 提示词指南${focus ? `，${focus}` : ""}。必须包含：直接回答（40-80字）、分步骤、3个FAQ、技巧。总字数 1200-2000 字。`,
    "content-strategy": `写一篇关于「${topicLabel}」的内容策略指南${focus ? `，${focus}` : ""}。必须包含：直接回答（40-80字）、分步骤、3个FAQ、技巧。总字数 1200-2000 字。`,
    "viral-examples": `写一篇关于「${topicLabel}」的爆款案例指南${focus ? `，${focus}` : ""}。必须包含：直接回答（40-80字）、分步骤、3个FAQ、技巧。总字数 1200-2000 字。`
  };

  return `你是一位资深中文内容创作者。用中文撰写，面向抖音、小红书、B站创作者。

主题：${topicLabel}${modLabel ? `（${modLabel}）` : ""}
页面类型：${getPageLabel(pageType, topicLabel)}${modLabel ? `（${modLabel}）` : ""}

要求：${instructions[pageType]}
使用 Markdown，## 和 ###。内容原创，实用可操作。

输出 JSON：
{
  "title": "SEO 标题（含2026、数字、如7个方法）",
  "description": "meta description，含钩子句+利益+关键词，150字内",
  "h1": "页面主标题",
  "directAnswer": "直接回答，40-60字",
  "intro": "引言",
  "guide": "指南正文 Markdown，用5步/7法/10条等数字结构",
  "stepByStep": "分步骤指南 Markdown",
  "faq": "3个FAQ Markdown",
  "strategy": "策略 Markdown",
  "tips": "技巧 Markdown",
  "titleVariations": ["备选标题1", "备选标题2", "备选标题3"]
}`;
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY required");
    process.exit(1);
  }

  const limit = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || "800", 10);

  const GUIDE_CONFIG = {
    "how-to": ["grow-on-tiktok", "go-viral-on-instagram", "get-youtube-subscribers", "write-viral-captions", "get-instagram-followers", "create-viral-hooks", "grow-on-youtube-shorts", "build-creator-brand", "monetize-tiktok", "increase-engagement"],
    "ai-prompts": ["tiktok", "youtube", "instagram", "startup", "fitness", "travel", "food", "business", "motivation", "beauty"],
    "content-strategy": ["startup", "fitness", "personal-brand", "online-business", "ecommerce", "coaching", "content-creator", "influencer"],
    "viral-examples": ["fitness", "motivation", "business", "travel", "food", "beauty", "lifestyle", "tech", "education", "gaming"]
  };

  const allParams = [];
  for (const [pageType, baseTopics] of Object.entries(GUIDE_CONFIG)) {
    for (const base of baseTopics) {
      allParams.push({ pageType, topic: base });
      for (const mod of MODIFIERS) {
        allParams.push({ pageType, topic: `${base}-${mod}` });
      }
    }
  }

  const toGenerate = allParams.slice(0, limit);

  console.log(`Generating ${toGenerate.length} Chinese SEO pages...`);

  const cache = loadCache();
  let generated = 0;
  let skipped = 0;

  for (const { pageType, topic } of toGenerate) {
    if (cache[pageType]?.[topic]) {
      skipped++;
      continue;
    }

    try {
      const prompt = buildPrompt(pageType, topic);
      const content = await generateWithOpenAI(prompt, apiKey);
      const titleVariations = Array.isArray(content.titleVariations)
        ? content.titleVariations.slice(0, 3)
        : [];
      if (!cache[pageType]) cache[pageType] = {};
      cache[pageType][topic] = {
        ...content,
        titleVariations: titleVariations.length > 0 ? titleVariations : undefined,
        createdAt: Date.now(),
        lastModified: Date.now(),
        published: false
      };
      saveCache(cache);
      generated++;
      console.log(`  ✓ ${pageType}/${topic}`);
    } catch (err) {
      console.error(`  ✗ ${pageType}/${topic}:`, err.message);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`Done. Generated: ${generated}, Skipped: ${skipped}`);

  if (generated > 0) {
    const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.tooleagle.com";
    const sitemapUrl = encodeURIComponent(`${baseUrl}/sitemap-zh.xml`);
    const pingUrl = `https://www.google.com/ping?sitemap=${sitemapUrl}`;
    try {
      await fetch(pingUrl);
      console.log("Pinged Google with sitemap-zh.xml");
    } catch (e) {
      console.warn("Failed to ping Google:", e.message);
    }
  }
}

main().catch(console.error);
