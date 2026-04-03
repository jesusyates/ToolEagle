/**
 * V63 Keyword Expansion Engine - Scale x10
 * Run: node scripts/generate-zh-keywords-v63.js [--limit=200]
 * platform × goal × audience × format × time, max 200 per run
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { exitIfLegacyZhSeoDisabled } = require("./lib/legacy-zh-seo-flag");
exitIfLegacyZhSeoDisabled();

const path = require("path");
const fs = require("fs");
const { openaiChatCompletions, getBaseUrl, getModel } = require("./lib/openai-fetch");
const { generateV63Keywords } = require("./lib/keyword-expansion-v63");
const {
  validateZhKeywordContent,
  computeSimilarityAgainstCorpus,
  loadFingerprintStore,
  saveFingerprintStore,
  writeRejectionLog,
  nowIso
} = require("./lib/seo-quality-gate");

const CACHE_PATH = path.join(process.cwd(), "data", "zh-keywords.json");
const FINGERPRINT_STORE = path.join(process.cwd(), "generated", "quality-gate", "zh-keywords-fingerprints.json");
const REJECTION_LOG = path.join(process.cwd(), "logs", "quality-gate-rejections.jsonl");

const TITLE_PATTERNS = [
  { id: "A", template: "🔥 {keyword}（2026最全指南+实测）" },
  { id: "B", template: "{keyword}？3个方法快速搞定（新手必看）" },
  { id: "C", template: "{keyword}全攻略（从0到1完整教程）" },
  { id: "D", template: "⚠️ {keyword}做错这3点，难怪没效果" }
];
const DESC_PATTERNS = [
  "90%的人都做错了，这才是正确的{keyword}方法",
  "不需要粉丝，也能实现{keyword}，方法公开",
  "从0开始，手把手教你完成{keyword}"
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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

function buildKeywordPrompt(entry) {
  const { keyword } = entry;
  const titlePat = pickRandom(TITLE_PATTERNS);
  const descPat = pickRandom(DESC_PATTERNS);
  const titleExample = titlePat.template.replace("{keyword}", keyword);
  const descExample = descPat.replace("{keyword}", keyword);

  return `你是一位资深中文内容创作者和 SEO 专家。用中文撰写，面向抖音、TikTok、YouTube、Instagram 创作者。

搜索关键词：${keyword}

要求：内容必须完全围绕「${keyword}」的搜索意图，直接回答用户想知道的。
- 直接回答（40-80字）
- 分步骤指南
- 3-5个FAQ（用于富结果）
- 实用技巧
- 总字数 1200-2000 字
- Markdown 格式，## 和 ### 标题

【v61 CTR 优化】
- 标题必须使用此格式：${titleExample}
- meta description 使用情感钩子风格，参考：${descExample}
- 必须输出 resultPreview：2个示例，每个 1-2 句

输出 JSON：
{
  "titlePattern": "${titlePat.id}",
  "title": "${titleExample}",
  "description": "meta description，150字内，带情感钩子",
  "h1": "页面主标题",
  "directAnswer": "直接回答，40-60字",
  "resultPreview": ["示例1", "示例2"],
  "intro": "引言",
  "guide": "指南正文 Markdown",
  "stepByStep": "分步骤指南 Markdown",
  "faq": "3-5个FAQ Markdown（### Q1: ... ### A1: ...）",
  "strategy": "策略 Markdown",
  "tips": "技巧 Markdown"
}`;
}

async function generateWithOpenAI(prompt, apiKey) {
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
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY required");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 200;
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const cache = loadCache();
  const corpus = loadFingerprintStore(FINGERPRINT_STORE);
  const existingSlugs = new Set(Object.keys(cache));
  const existingKeywords = Object.values(cache)
    .filter((c) => c && c.published !== false)
    .map((c) => c.h1 || c.title || c.keyword || "")
    .filter(Boolean);

  const toGenerate = generateV63Keywords(existingSlugs, existingKeywords, safeLimit);

  console.log("\n===== V63 Keyword Expansion Engine =====\n");
  console.log(`OpenAI base URL: ${getBaseUrl()}`);
  console.log(`V63 keywords to generate: ${toGenerate.length} (limit ${safeLimit})`);
  if (toGenerate.length === 0) {
    console.log("No new V63 keywords (all generated or pool exhausted).");
    return;
  }
  console.log(`Example: ${toGenerate[0]?.keyword} -> /zh/search/${toGenerate[0]?.slug}\n`);

  let generated = 0;
  let rejected = 0;
  for (const entry of toGenerate) {
    try {
      const prompt = buildKeywordPrompt(entry);
      const content = await generateWithOpenAI(prompt, apiKey);
      const next = {
        ...content,
        keyword: entry.keyword,
        platform: entry.platform,
        goal: entry.goal,
        audience: entry.audience,
        format: entry.format,
        time: entry.time,
        createdAt: Date.now(),
        lastModified: Date.now(),
        published: true
      };
      const textForSim = [
        next.title,
        next.description,
        next.directAnswer,
        next.intro,
        next.guide,
        next.stepByStep,
        next.faq,
        next.strategy,
        next.tips,
        Array.isArray(next.resultPreview) ? next.resultPreview.join("\n") : ""
      ]
        .filter(Boolean)
        .join("\n");
      const sim = computeSimilarityAgainstCorpus(textForSim, corpus, { similarityMax: 0.94 });
      const gate = validateZhKeywordContent({
        slug: entry.slug,
        keyword: entry.keyword,
        content: next,
        similarity: sim.bestSimilarity
      });
      if (!gate.ok) {
        rejected++;
        cache[entry.slug] = { ...next, published: false };
        saveCache(cache);
        writeRejectionLog(
          {
            at: nowIso(),
            ...gate.meta,
            reasons: gate.reasons,
            bestSimilarity: sim.bestSimilarity,
            bestMatchId: sim.bestMatchId
          },
          REJECTION_LOG
        );
        console.log(`  ○ ${entry.slug} rejected by quality gate`);
      } else {
        cache[entry.slug] = next;
        saveCache(cache);
        corpus.push({ id: entry.slug, slug: entry.slug, hashes: sim.hashes });
        generated++;
        console.log(`  ✓ ${entry.slug} (${entry.keyword})`);
      }
    } catch (err) {
      console.error(`  ✗ ${entry.slug}:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  saveFingerprintStore(FINGERPRINT_STORE, corpus);
  console.log("\n===== Output =====");
  console.log(`V63 generated: ${generated}`);
  console.log(`Rejected by quality gate: ${rejected}`);
  console.log("==================\n");

  if (generated > 0) {
    try {
      await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(
          (process.env.SITE_URL || "https://www.tooleagle.com") + "/sitemap-zh.xml"
        )}`
      );
    } catch {}
  }
}

main().catch(console.error);
