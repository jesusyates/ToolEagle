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
const { isSeoDryRun, ensureSandboxDir } = require("./lib/seo-sandbox-context");
const { openaiChatCompletions, getBaseUrl, getModel } = require("./lib/openai-fetch");
const { evaluateRetrievalForKeyword, formatHitsForPrompt } = require("./lib/seo-retrieval-v153");
const { appendRetrievalTelemetryEvent } = require("./lib/seo-retrieval-events-store");
const { pickSeoChatConfig } = require("./lib/seo-model-router-v153");
const {
  logV153SeoGeneration,
  logRetrievalPathUsed,
  logAiFallbackUsed,
  logCostOptimizationApplied
} = require("./lib/seo-telemetry-v153");
const { writeCostEfficiencyArtifact } = require("./lib/seo-cost-artifact-v153");
const { appendHighQualityAsset, mergeRetrievalStats } = require("./lib/seo-hq-assets-store");
const { generateV63Keywords, scoreKeyword } = require("./lib/keyword-expansion-v63");
const {
  validateZhKeywordContent,
  computeSimilarityAgainstCorpus,
  loadFingerprintStore,
  saveFingerprintStore,
  writeRejectionLog,
  nowIso
} = require("./lib/seo-quality-gate");

const NEW_KEYWORDS_LIMIT = 200;
const RETRY_COUNT = 3;

function topicClusterKeyForRisk(entry) {
  if (entry.platform && entry.goal && GOAL_SLUGS[entry.goal]) {
    return `${entry.platform}-${GOAL_SLUGS[entry.goal]}`;
  }
  const parts = String(entry.slug || "")
    .toLowerCase()
    .split("-")
    .filter(Boolean);
  if (parts.length < 2) return parts[0] || "";
  return `${parts[0]}-${parts[1]}`;
}

function parseCliArgs() {
  const argv = process.argv.slice(2);
  let batchSize = NEW_KEYWORDS_LIMIT;
  let noGit = false;
  for (const a of argv) {
    if (a.startsWith("--batch-size=")) {
      const n = parseInt(a.split("=")[1], 10);
      if (Number.isFinite(n)) batchSize = Math.min(200, Math.max(1, n));
    }
    if (a === "--no-git") noGit = true;
  }
  return { batchSize, noGit };
}

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

/** V157 — live cache read; sandbox write when SEO_DRY_RUN. */
function zhAutogenPaths() {
  const cwd = process.cwd();
  const dry = isSeoDryRun();
  const liveCache = path.join(cwd, "data", "zh-keywords.json");
  if (!dry) {
    return {
      cacheRead: liveCache,
      cacheWrite: liveCache,
      fingerprint: path.join(cwd, "generated", "quality-gate", "zh-keywords-fingerprints.json"),
      rejectionLog: path.join(cwd, "logs", "quality-gate-rejections.jsonl"),
      logPath: path.join(cwd, "logs", "auto-gen.log")
    };
  }
  const sb = ensureSandboxDir(cwd);
  return {
    cacheRead: liveCache,
    cacheWrite: path.join(sb, "data", "zh-keywords.json"),
    fingerprint: path.join(sb, "quality-gate", "zh-keywords-fingerprints.json"),
    rejectionLog: path.join(sb, "quality-gate-rejections.jsonl"),
    logPath: path.join(sb, "auto-gen.log")
  };
}

/** V156/V157 — search risk context (sandbox first when dry-run). */
function loadSearchRiskContext() {
  const cwd = process.cwd();
  const paths = isSeoDryRun()
    ? [
        path.join(cwd, "generated", "sandbox", "seo-risk-context.json"),
        path.join(cwd, "generated", "seo-risk-context.json")
      ]
    : [path.join(cwd, "generated", "seo-risk-context.json")];
  for (const p of paths) {
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      const lim = Number(j.v63_expansion_limit);
      return {
        deprioritized_topic_prefixes: Array.isArray(j.deprioritized_topic_prefixes)
          ? j.deprioritized_topic_prefixes.map((s) => String(s).toLowerCase())
          : [],
        v63_expansion_limit: Number.isFinite(lim) ? Math.max(80, Math.min(500, Math.floor(lim))) : 500
      };
    } catch {
      continue;
    }
  }
  return { deprioritized_topic_prefixes: [], v63_expansion_limit: 500 };
}

function fillPattern(tpl, platform, goal) {
  return tpl.replace("{platform}", platform).replace("{goal}", goal);
}

function ensureLogDir() {
  const dir = path.dirname(zhAutogenPaths().logPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg, alsoConsole = true) {
  ensureLogDir();
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(zhAutogenPaths().logPath, line, "utf8");
  if (alsoConsole) console.log(msg);
}

function loadCache() {
  const { cacheRead } = zhAutogenPaths();
  try {
    return JSON.parse(fs.readFileSync(cacheRead, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  const { cacheWrite } = zhAutogenPaths();
  const dir = path.dirname(cacheWrite);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(cacheWrite, JSON.stringify(cache, null, 2), "utf8");
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

/** V160 — prefer expansion aligned with last dominance artifact (optional file). */
function loadAiCitationDominance() {
  const cwd = process.cwd();
  const paths = isSeoDryRun()
    ? [
        path.join(cwd, "generated", "sandbox", "asset-seo-ai-citation-dominance.json"),
        path.join(cwd, "generated", "asset-seo-ai-citation-dominance.json")
      ]
    : [path.join(cwd, "generated", "asset-seo-ai-citation-dominance.json")];
  for (const p of paths) {
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      if (j && (Array.isArray(j.top_ai_citable_topics) || j.version)) return j;
    } catch (_) {
      /* optional */
    }
  }
  return null;
}

/** V161 — optional traffic allocation artifact (topic tiers + suppression). */
function loadTrafficAllocation() {
  const cwd = process.cwd();
  const paths = isSeoDryRun()
    ? [
        path.join(cwd, "generated", "sandbox", "asset-seo-traffic-allocation.json"),
        path.join(cwd, "generated", "asset-seo-traffic-allocation.json")
      ]
    : [path.join(cwd, "generated", "asset-seo-traffic-allocation.json")];
  for (const p of paths) {
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      if (j && (Array.isArray(j.top_allocated_topics) || j.version)) return j;
    } catch (_) {
      /* optional */
    }
  }
  return null;
}

/** Bounded ±4 on expansion sort key; does not override risk deprioritization. */
function aiCitationExpansionBias(entry, dominance) {
  if (!dominance) return 0;
  const kw = String(entry.keyword || "").toLowerCase();
  let delta = 0;
  const tops = Array.isArray(dominance.top_ai_citable_topics) ? dominance.top_ai_citable_topics : [];
  for (const t of tops) {
    const tk = String((t && t.topic_key) || t || "")
      .toLowerCase()
      .trim();
    if (tk.length < 2) continue;
    if (kw.includes(tk) || tk.includes(kw.slice(0, Math.min(12, kw.length)))) {
      delta += 2;
      break;
    }
  }
  const weaks = Array.isArray(dominance.weak_topics) ? dominance.weak_topics : [];
  for (const t of weaks) {
    const tk = String((t && t.topic_key) || t || "")
      .toLowerCase()
      .trim();
    if (tk.length < 2) continue;
    if (kw.includes(tk) || tk.includes(kw.slice(0, Math.min(10, kw.length)))) {
      delta -= 3;
      break;
    }
  }
  return Math.max(-4, Math.min(4, delta));
}

/** Bounded ±3 on expansion sort key from V161 allocation summary. */
function trafficAllocationExpansionBias(entry, alloc) {
  if (!alloc) return 0;
  const kw = String(entry.keyword || "").toLowerCase();
  let delta = 0;
  const tops = Array.isArray(alloc.top_allocated_topics) ? alloc.top_allocated_topics : [];
  for (const t of tops) {
    const tk = String((t && typeof t === "object" && t.topic_key) || t || "")
      .toLowerCase()
      .trim();
    if (tk.length < 2) continue;
    if (kw.includes(tk) || tk.includes(kw.slice(0, Math.min(14, kw.length)))) {
      delta += 2;
      break;
    }
  }
  const suppressed = Array.isArray(alloc.suppressed_segments) ? alloc.suppressed_segments : [];
  for (const s of suppressed) {
    if ((s.kind || "") !== "topic") continue;
    const seg = String(s.segment || "").toLowerCase();
    if (seg.length < 2) continue;
    if (kw.includes(seg) || seg.includes(kw.slice(0, 12))) {
      delta -= 3;
      break;
    }
  }
  const explore = Array.isArray(alloc.exploration_quota_assignments) ? alloc.exploration_quota_assignments : [];
  for (const e of explore) {
    const ek = String(e || "").toLowerCase().trim();
    if (ek.length < 2) continue;
    if (kw.includes(ek) || ek.includes(kw.slice(0, 12))) {
      delta += 1;
      break;
    }
  }
  return Math.max(-3, Math.min(3, delta));
}

function mergeAndScoreCandidates(legacy, v63, limit, riskCtx, dominance, trafficAlloc) {
  const deps = new Set(riskCtx?.deprioritized_topic_prefixes || []);
  const bump = (e) => {
    const k = topicClusterKeyForRisk(e);
    return deps.has(k) ? -8 : 0;
  };
  const merged = [
    ...legacy.map((e) => ({
      ...e,
      _score:
        scoreKeyword(e.keyword) +
        bump(e) +
        aiCitationExpansionBias(e, dominance) +
        trafficAllocationExpansionBias(e, trafficAlloc)
    })),
    ...v63.map((e) => ({
      ...e,
      _score:
        scoreKeyword(e.keyword) +
        bump(e) +
        aiCitationExpansionBias(e, dominance) +
        trafficAllocationExpansionBias(e, trafficAlloc)
    }))
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

function buildRetrievalRewritePrompt(entry, contextBlocks) {
  const { keyword, platform, goal } = entry;
  return `你是中文 SEO 编辑。基于以下检索到的内部高质量素材，改写成完整页面 JSON，不得编造事实；可重组语句与结构。
搜索关键词：${keyword}
平台：${platform}，目标：${goal}

【素材】
${contextBlocks}

输出单个 JSON（与全量生成字段一致）：titlePattern, title, description, h1, directAnswer, resultPreview（2条）, intro, guide, stepByStep, faq, strategy, tips。
Markdown 用 ## / ###。总字数 1200-2000 字。只输出 JSON。`;
}

/** @param {{ model: string, apiKey: string, baseUrl?: string }} chatCfg */
async function generateWithRetry(prompt, chatCfg, genOpts = {}) {
  const max_tokens = genOpts.max_tokens ?? 4000;
  const temperature = genOpts.temperature ?? 0.7;
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      const content = await openaiChatCompletions(
        {
          model: chatCfg.model,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens
        },
        chatCfg.apiKey,
        chatCfg.baseUrl ? { baseUrl: chatCfg.baseUrl } : {}
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
  const cli = parseCliArgs();
  const primaryCfg = pickSeoChatConfig({ bulk: true });
  if (!primaryCfg.apiKey) {
    log("ERROR: API key required (OPENAI_API_KEY or GLM_API_KEY when SEO_USE_GLM_FOR_CN=1)");
    process.exit(1);
  }

  log("===== v63.1 Auto Content Factory (V153 retrieval + cost) =====");
  log(`Primary API base: ${primaryCfg.baseUrl || getBaseUrl()} batch=${cli.batchSize} noGit=${cli.noGit}`);

  const cache = loadCache();
  const pathsForRun = zhAutogenPaths();
  const corpus = loadFingerprintStore(pathsForRun.fingerprint);
  const existingSlugs = new Set(Object.keys(cache));
  const existingKeywords = Object.values(cache)
    .filter((c) => c && c.published !== false)
    .map((c) => c.h1 || c.title || c.keyword || "")
    .filter(Boolean);
  const riskCtx = loadSearchRiskContext();
  const legacy = getNewKeywordsToGenerate(cache);
  const v63 = generateV63Keywords(existingSlugs, existingKeywords, riskCtx.v63_expansion_limit);
  const dominance = loadAiCitationDominance();
  const trafficAlloc = loadTrafficAllocation();
  const toGenerate = mergeAndScoreCandidates(legacy, v63, cli.batchSize, riskCtx, dominance, trafficAlloc);

  if (toGenerate.length === 0) {
    log("No new keywords to generate. All patterns exhausted.");
    return;
  }

  log(`New keywords to generate: ${toGenerate.length} (limit ${cli.batchSize})`);

  let success = 0;
  let failed = 0;
  let rejected = 0;
  const runStats = { retrieval: 0, ai: 0, highCost: 0, topicModes: {} };

  for (const entry of toGenerate) {
    try {
      const evalr = evaluateRetrievalForKeyword({
        keyword: entry.keyword,
        platform: entry.platform,
        goal: entry.goal
      });
      const hits = evalr.hits;
      const useRetrieval = evalr.sufficient;
      const cwdZh = process.cwd();
      if (evalr.bias && evalr.bias.biasApplied) {
        appendRetrievalTelemetryEvent(cwdZh, {
          event: "retrieval_bias_applied",
          keyword: entry.keyword,
          platform: entry.platform,
          goal: entry.goal,
          bias_applied: true,
          bias_factor: evalr.bias.biasFactor
        });
      }
      if (useRetrieval) {
        appendRetrievalTelemetryEvent(cwdZh, {
          event: "retrieval_hit_recorded",
          keyword: entry.keyword,
          platform: entry.platform,
          goal: entry.goal,
          top_score: evalr.topScore,
          primary_lane: evalr.primaryLane
        });
      } else {
        appendRetrievalTelemetryEvent(cwdZh, {
          event: "retrieval_fallback_reason_recorded",
          keyword: entry.keyword,
          platform: entry.platform,
          goal: entry.goal,
          reason: evalr.fallbackReason || "unknown",
          top_score: evalr.topScore
        });
      }
      let chatCfg = { ...pickSeoChatConfig({ bulk: true }) };
      let generation_mode = useRetrieval ? "retrieval" : "ai";
      let prompt = useRetrieval
        ? buildRetrievalRewritePrompt(entry, formatHitsForPrompt(hits))
        : buildKeywordPrompt(entry);
      const max_tokens = useRetrieval ? 2800 : 4000;
      const temperature = useRetrieval ? 0.55 : 0.7;

      if (useRetrieval) {
        logRetrievalPathUsed({ slug: entry.slug, hits: hits.length, top: hits[0]?.score });
        logCostOptimizationApplied({ slug: entry.slug, method: "retrieval_rewrite" });
      }

      let content;
      try {
        content = await generateWithRetry(prompt, chatCfg, { max_tokens, temperature });
      } catch (e1) {
        if (process.env.SEO_ALLOW_OPENAI_FALLBACK === "1") {
          const fb = pickSeoChatConfig({ bulk: false, forceOpenAiFallback: true });
          if (fb.apiKey) {
            logAiFallbackUsed({ slug: entry.slug, reason: String(e1.message || e1) });
            chatCfg = { ...fb };
            content = await generateWithRetry(prompt, chatCfg, { max_tokens, temperature });
          } else {
            throw e1;
          }
        } else {
          throw e1;
        }
      }
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
          pathsForRun.rejectionLog
        );
        log(`  ○ ${entry.slug} rejected by quality gate (${entry.keyword})`, false);
      } else {
        cache[entry.slug] = next;
        saveCache(cache);
        corpus.push({ id: entry.slug, slug: entry.slug, hashes: sim.hashes });
        success++;
        log(`  ✓ ${entry.slug} (${entry.keyword})`);
        const tier = chatCfg.model_cost_tier || "medium";
        if (generation_mode === "retrieval") runStats.retrieval++;
        else runStats.ai++;
        if (tier === "high") runStats.highCost++;
        const tk = entry.keyword || entry.slug;
        if (!runStats.topicModes[tk]) runStats.topicModes[tk] = { retrieval: 0, ai: 0 };
        if (generation_mode === "retrieval") runStats.topicModes[tk].retrieval++;
        else runStats.topicModes[tk].ai++;
        logV153SeoGeneration({
          retrieval_used: useRetrieval,
          generation_mode,
          model_cost_tier: tier,
          slug: entry.slug,
          keyword: entry.keyword
        });
        try {
          const structure = [next.title, next.directAnswer, next.intro, next.guide]
            .filter(Boolean)
            .join("\n")
            .slice(0, 2000);
          const qs = Math.min(
            0.99,
            0.52 +
              (1 - Math.min(sim.bestSimilarity, 0.99)) * 0.38 +
              (generation_mode === "retrieval" ? 0.12 : 0)
          );
          appendHighQualityAsset(process.cwd(), {
            topic: entry.keyword,
            workflow: String(entry.platform || "zh-seo"),
            page_type: "zh_keyword",
            content_summary: String(next.directAnswer || next.intro || next.title || "").slice(0, 1200),
            quality_score: qs,
            title: next.title || entry.keyword,
            structure
          });
        } catch (e) {
          log(`  HQ asset append: ${e.message}`, false);
        }
      }
    } catch (err) {
      failed++;
      const msg = `  ✗ ${entry.slug}: ${err.message}`;
      log(msg);
      log(`  SKIP (failed after ${RETRY_COUNT} retries)`, false);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  saveFingerprintStore(pathsForRun.fingerprint, corpus);
  log(`===== Done: ${success} generated, ${rejected} rejected, ${failed} failed =====`);

  try {
    writeCostEfficiencyArtifact({
      runStats,
      zhKeywordsSnapshot: Object.keys(loadCache()).length
    });
    mergeRetrievalStats(process.cwd(), {
      retrieval_delta: runStats.retrieval,
      ai_delta: runStats.ai
    });
    const { execSync } = require("child_process");
    try {
      execSync("npx tsx scripts/write-retrieval-utilization-summary.ts", {
        cwd: process.cwd(),
        stdio: "ignore"
      });
    } catch {
      // non-fatal
    }
    execSync("npx tsx scripts/build-asset-seo-publish-queue.ts", { cwd: process.cwd(), stdio: "inherit" });
  } catch (e) {
    log(`V153 artifact refresh: ${e.message} (non-fatal)`, false);
  }

  if (success > 0 && !cli.noGit && !isSeoDryRun()) {
    const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.tooleagle.com";
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(`${baseUrl}/sitemap-zh.xml`)}`;
    try {
      await fetch(pingUrl);
      log("Pinged Google with sitemap-zh.xml");
    } catch {
      // 国内网络可能无法访问 Google，静默忽略
    }

    // v61: Auto git add/commit/push after zh:auto
    try {
      const { execSync } = require("child_process");
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
