/**
 * v59 Programmatic Keyword Mining - Generate keyword pages via AI.
 * Run: node scripts/generate-zh-keywords.js [--limit=200]
 * Requires: OPENAI_API_KEY (in .env.local or env)
 *
 * Generates 200-675 keyword pages: pattern × platform × goal (15×15×3=675)
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { openaiChatCompletions, getBaseUrl, getModel } = require("./lib/openai-fetch");

const CACHE_PATH = path.join(process.cwd(), "data", "zh-keywords.json");

const PLATFORMS = ["tiktok", "youtube", "instagram"];
const PLATFORM_NAMES = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
// 15 goals × 15 patterns × 3 platforms = 675 keywords (支持 --limit=500/1000)
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

function generateKeywords(limit) {
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
        if (entries.length >= limit) return entries;
      }
    }
  }
  return entries;
}

// v61: CTR title patterns (randomly assign per page)
const TITLE_PATTERNS = [
  { id: "A", template: "🔥 {keyword}（2026最全指南+实测）" },
  { id: "B", template: "{keyword}？3个方法快速搞定（新手必看）" },
  { id: "C", template: "{keyword}全攻略（从0到1完整教程）" },
  { id: "D", template: "⚠️ {keyword}做错这3点，难怪没效果" }
];
// v61: Emotional description hooks
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
    const cause = e.cause ? ` | cause: ${e.cause?.message || e.cause}` : "";
    console.error("OpenAI error:", e.message + cause);
    throw e;
  }
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

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 200;
  const safeLimit = Math.min(Math.max(limit, 1), 1000);

  const keywords = generateKeywords(safeLimit);
  const cache = loadCache();

  console.log("\n===== v59 Keyword Mining Engine =====\n");
  console.log(`OpenAI base URL: ${getBaseUrl()}`);
  if (process.env.HTTPS_PROXY) console.log(`Using proxy: ${process.env.HTTPS_PROXY}`);
  console.log(`Total keywords to generate: ${keywords.length}`);
  console.log(`Example keywords: ${keywords.slice(0, 5).map((k) => k.keyword).join(", ")}`);
  console.log(`Example URLs: ${keywords.slice(0, 3).map((k) => `/zh/search/${k.slug}`).join(", ")}\n`);

  let generated = 0;
  let skipped = 0;

  for (const entry of keywords) {
    if (cache[entry.slug] && cache[entry.slug].published !== false) {
      skipped++;
      continue;
    }

    try {
      const prompt = buildKeywordPrompt(entry);
      const content = await generateWithOpenAI(prompt, apiKey);
      cache[entry.slug] = {
        ...content,
        createdAt: Date.now(),
        lastModified: Date.now(),
        published: true
      };
      saveCache(cache);
      generated++;
      console.log(`  ✓ ${entry.slug} (${entry.keyword})`);
    } catch (err) {
      console.error(`  ✗ ${entry.slug}:`, err.message);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  const totalWithContent = Object.keys(cache).filter((k) => cache[k].published !== false).length;

  console.log("\n===== Output =====");
  console.log(`Total keywords generated: ${keywords.length}`);
  console.log(`New pages this run: ${generated}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Total keyword pages with content: ${totalWithContent}`);
  console.log(`Example URLs:`);
  keywords.slice(0, 5).forEach((k) => console.log(`  - /zh/search/${k.slug}`));
  console.log("==================\n");

  if (generated > 0) {
    const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.tooleagle.com";
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(`${baseUrl}/sitemap-zh.xml`)}`;
    try {
      await fetch(pingUrl);
      console.log("Pinged Google with sitemap-zh.xml");
    } catch {
      // 国内网络可能无法访问 Google，静默忽略
    }
  }
}

main().catch(console.error);
