/**
 * v60 Auto Content Factory - Daily SEO page generation
 * Run: npm run zh:auto
 * Schedule: 2x daily at 02:00 and 14:00 UTC (cron / Task Scheduler)
 *
 * - Loads existing keywords from data/zh-keywords.json
 * - Expands with new goals (涨粉, 变现, 做爆款, 引流, 做内容)
 * - Generates up to 200 new keywords per run (V63.1)
 * - Reuses existing content generator
 * - Logs to logs/auto-gen.log
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { openaiChatCompletions, getBaseUrl, getModel } = require("./lib/openai-fetch");
const { generateV63Keywords, scoreKeyword } = require("./lib/keyword-expansion-v63");
const {
  validateZhKeywordContent,
  computeSimilarityAgainstCorpus,
  loadFingerprintStore,
  saveFingerprintStore,
  writeRejectionLog,
  nowIso
} = require("./lib/seo-quality-gate");

const CACHE_PATH = path.join(process.cwd(), "data", "zh-keywords.json");
const LOG_PATH = path.join(process.cwd(), "logs", "auto-gen.log");
const FINGERPRINT_STORE = path.join(process.cwd(), "generated", "quality-gate", "zh-keywords-fingerprints.json");
const REJECTION_LOG = path.join(process.cwd(), "logs", "quality-gate-rejections.jsonl");
const NEW_KEYWORDS_LIMIT = 200;
const RETRY_COUNT = 3;

const PLATFORMS = ["tiktok", "youtube", "instagram"];
const PLATFORM_NAMES = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
// 与 generate-zh-keywords.js 一致：15 goals × 15 patterns = 675 总组合
const GOALS = [
  "涨粉", "获得播放量", "做爆款视频", "提高互动率", "账号起号",
  "变现", "做爆款", "引流", "做内容",
  "提高完播率", "直播带货", "私域引流", "品牌打造", "算法优化", "数据分析"
];
const GOAL_SLUGS = {
  涨粉: "zhangfen",
  "获得播放量": "bofangliang",
  "做爆款视频": "baokuan",
  "提高互动率": "hudong",
  "账号起号": "qihao",
  变现: "bianxian",
  做爆款: "baokuan-v2",
  引流: "yinliu",
  "做内容": "neirong",
  "提高完播率": "wanbolv",
  "直播带货": "daihuo",
  "私域引流": "siyu",
  "品牌打造": "pinpai",
  "算法优化": "suanfa",
  "数据分析": "shuju"
};
const PATTERNS = [
  { id: "ruhe", template: "如何在 {platform} 上 {goal}", slug: "ruhe" },
  { id: "fangfa", template: "{platform} {goal} 方法", slug: "fangfa" },
  { id: "zenme", template: "{platform} 怎么 {goal}", slug: "zenme" },
  { id: "jiqiao", template: "{platform} {goal} 技巧", slug: "jiqiao" },
  { id: "2026", template: "{platform} {goal} 2026", slug: "2026" },
  { id: "mijue", template: "{platform} {goal} 秘诀", slug: "mijue" },
  { id: "gonglue", template: "{platform} {goal} 攻略", slug: "gonglue" },
  { id: "rumen", template: "{platform} {goal} 入门", slug: "rumen" },
  { id: "jiaocheng", template: "{platform} {goal} 教程", slug: "jiaocheng" },
  { id: "xinshou", template: "{platform} {goal} 新手", slug: "xinshou" },
  { id: "gaoxiao", template: "{platform} {goal} 高效", slug: "gaoxiao" },
  { id: "kuaisu", template: "{platform} 快速 {goal}", slug: "kuaisu" },
  { id: "shizhan", template: "{platform} {goal} 实战", slug: "shizhan" },
  { id: "wanzheng", template: "{platform} {goal} 完整指南", slug: "wanzheng" },
  { id: "jinjie", template: "{platform} {goal} 进阶", slug: "jinjie" }
];

function fillPattern(tpl, platform, goal) {
  return tpl.replace("{platform}", platform).replace("{goal}", goal);
}

function ensureLogDir() {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg, alsoConsole = true) {
  ensureLogDir();
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line, "utf8");
  if (alsoConsole) console.log(msg);
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

function generateAllPossibleKeywords() {
  const entries = [];
  const seen = new Set();
  for (const platform of PLATFORMS) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of GOALS) {
      for (const pattern of PATTERNS) {
        const keyword = fillPattern(pattern.template, pName, goal);
        const slug = `${platform}-${GOAL_SLUGS[goal]}-${pattern.slug}`;
        if (seen.has(slug)) continue;
        seen.add(slug);
        entries.push({ keyword, platform, goal, patternId: pattern.id, slug });
      }
    }
  }
  return entries;
}

function getNewKeywordsToGenerate(cache, limit) {
  const all = generateAllPossibleKeywords();
  const existing = new Set(Object.keys(cache));
  const newOnes = all.filter((e) => !existing.has(e.slug));
  return newOnes;
}

function mergeAndScoreCandidates(legacy, v63, limit) {
  const merged = [
    ...legacy.map((e) => ({ ...e, _score: scoreKeyword(e.keyword) })),
    ...v63.map((e) => ({ ...e, _score: scoreKeyword(e.keyword) }))
  ];
  merged.sort((a, b) => (b._score || 0) - (a._score || 0));
  return merged.slice(0, limit).map(({ _score, ...e }) => e);
}

// v61: CTR title patterns (randomly assign per page)
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

function buildKeywordPrompt(entry) {
  const { keyword, platform, goal } = entry;
  const pName = PLATFORM_NAMES[platform];
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
- 必须输出 resultPreview：2个示例（如 TikTok 涨粉文案示例、YouTube 标题示例），每个 1-2 句

输出 JSON：
{
  "titlePattern": "${titlePat.id}",
  "title": "${titleExample}",
  "description": "meta description，150字内，带情感钩子",
  "h1": "页面主标题",
  "directAnswer": "直接回答，40-60字",
  "resultPreview": ["示例1：如 TikTok 涨粉文案示例", "示例2：如 YouTube 标题示例"],
  "intro": "引言",
  "guide": "指南正文 Markdown",
  "stepByStep": "分步骤指南 Markdown",
  "faq": "3-5个FAQ Markdown（### Q1: ... ### A1: ...）",
  "strategy": "策略 Markdown",
  "tips": "技巧 Markdown"
}`;
}

async function generateWithRetry(prompt, apiKey) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
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
      lastErr = e;
      if (attempt < RETRY_COUNT) {
        log(`  Retry ${attempt}/${RETRY_COUNT} for keyword: ${e.message}`, false);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw lastErr;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    log("ERROR: OPENAI_API_KEY required");
    process.exit(1);
  }

  log("===== v63.1 Auto Content Factory =====");
  log(`OpenAI base: ${getBaseUrl()}`);

  const cache = loadCache();
  const corpus = loadFingerprintStore(FINGERPRINT_STORE);
  const existingSlugs = new Set(Object.keys(cache));
  const existingKeywords = Object.values(cache)
    .filter((c) => c && c.published !== false)
    .map((c) => c.h1 || c.title || c.keyword || "")
    .filter(Boolean);
  const legacy = getNewKeywordsToGenerate(cache);
  const v63 = generateV63Keywords(existingSlugs, existingKeywords, 500);
  const toGenerate = mergeAndScoreCandidates(legacy, v63, NEW_KEYWORDS_LIMIT);

  if (toGenerate.length === 0) {
    log("No new keywords to generate. All patterns exhausted.");
    return;
  }

  log(`New keywords to generate: ${toGenerate.length} (limit ${NEW_KEYWORDS_LIMIT})`);

  let success = 0;
  let failed = 0;
  let rejected = 0;

  for (const entry of toGenerate) {
    try {
      const prompt = buildKeywordPrompt(entry);
      const content = await generateWithRetry(prompt, apiKey);
      const next = {
        ...content,
        keyword: entry.keyword,
        platform: entry.platform,
        goal: entry.goal,
        ...(entry.audience && { audience: entry.audience }),
        ...(entry.format && { format: entry.format }),
        ...(entry.time && { time: entry.time }),
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
        log(`  ○ ${entry.slug} rejected by quality gate (${entry.keyword})`, false);
      } else {
        cache[entry.slug] = next;
        saveCache(cache);
        corpus.push({ id: entry.slug, slug: entry.slug, hashes: sim.hashes });
        success++;
        log(`  ✓ ${entry.slug} (${entry.keyword})`);
      }
    } catch (err) {
      failed++;
      const msg = `  ✗ ${entry.slug}: ${err.message}`;
      log(msg);
      log(`  SKIP (failed after ${RETRY_COUNT} retries)`, false);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  saveFingerprintStore(FINGERPRINT_STORE, corpus);
  log(`===== Done: ${success} generated, ${rejected} rejected, ${failed} failed =====`);

  if (success > 0) {
    const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.tooleagle.com";
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(`${baseUrl}/sitemap-zh.xml`)}`;
    try {
      await fetch(pingUrl);
      log("Pinged Google with sitemap-zh.xml");
    } catch {
      // 国内网络可能无法访问 Google，静默忽略
    }

    // v61: Auto git add/commit/push after zh:auto
    const { execSync } = require("child_process");
    try {
      execSync(`git add data/zh-keywords.json`, { stdio: "inherit" });
      execSync(`git commit -m "auto: update zh keywords"`, { stdio: "inherit" });
      execSync(`git push`, { stdio: "inherit" });
      log("Git: committed and pushed zh-keywords.json");
    } catch (e) {
      log(`Git: ${e.message} (non-fatal)`, false);
    }

    // Optional: trigger deployment webhook if exists
    const webhookUrl = process.env.DEPLOY_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, { method: "POST" });
        log("Deployment webhook triggered");
      } catch (e) {
        log(`Webhook: ${e.message} (non-fatal)`, false);
      }
    }
  }
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
