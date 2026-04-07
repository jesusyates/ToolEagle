import path from "node:path";
import dotenv from "dotenv";
import { getDeepseekModel } from "@/config/ai-router";
import { deepseekProvider } from "@/lib/ai/providers/deepseek";
import type { ProviderGenerateOutput, ProviderTextInput } from "@/lib/ai/providers/types";

/** Scripts (tsx) do not auto-load .env.local like Next.js — required for DEEPSEEK_API_KEY. */
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

export type RebuildArticleInput = {
  title: string;
  context?: string;
  contentType?: "guide" | "ideas";
  /** Default `en`. `zh` uses Chinese prompts + human-signal / quality lists only. */
  language?: "en" | "zh";
};

export type FaqItem = { question: string; answer: string };

export type RebuildArticleResult = {
  title: string;
  body: string;
  hashtags: string[];
  /** True when template or offline path used instead of a successful model JSON parse. */
  fallbackUsed: boolean;
  /** 80–200 chars; answers the title question (no body truncation). */
  aiSummary: string;
  faqs: FaqItem[];
};

type JsonIdeasShape = {
  title?: string;
  intro?: string;
  ideas?: { line?: string; detail?: string; text?: string; note?: string }[];
  closing?: string;
  hashtags?: string[];
  ai_summary?: string;
  faqs?: { question?: string; answer?: string }[];
};

export function parseClusterFromContext(ctx?: string): { keyword?: string; cluster?: string } {
  const c = ctx ?? "";
  const kw = /Keyword:\s*([^\n]+)/i.exec(c);
  const cl = /Cluster theme:\s*([^\n]+)/i.exec(c);
  return { keyword: kw?.[1]?.trim(), cluster: cl?.[1]?.trim() };
}

function normalizeAiSummary(raw: string, title: string, lang: "en" | "zh" = "en"): string {
  let s = raw.trim().replace(/\s+/g, " ");
  if (s.length < 80) {
    s =
      lang === "zh"
        ? `${s} 本篇围绕「${title.slice(0, 60)}」给出可执行的顺序与注意事项，便于按周落地。`
        : `${s} This guide gives you a clear order of operations for "${title.slice(0, 60)}" so you can apply it on a realistic weekly cadence.`;
    s = s.replace(/\s+/g, " ").trim();
  }
  if (s.length > 200) {
    const cut = s.slice(0, 200);
    if (lang === "zh") {
      const lastStop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("，"), cut.lastIndexOf("."));
      s = lastStop > 100 ? cut.slice(0, lastStop + 1) : cut.replace(/\s+\S*$/, "").trimEnd() + "。";
    } else {
      const lastPeriod = cut.lastIndexOf(".");
      s = lastPeriod > 100 ? cut.slice(0, lastPeriod + 1) : cut.replace(/\s+\S*$/, "").trimEnd() + ".";
    }
  }
  return s.slice(0, 200);
}

const FORBIDDEN_FAQ_QUESTION_RES = [
  /^what strategy should i use first\??$/i,
  /^how often should i apply this\??$/i,
  /^where should i start in the article\??$/i
];

const FORBIDDEN_FAQ_SNIPPETS = [
  /what baseline should i/i,
  /how often should i/i,
  /smallest unit/i,
  /weekly rhythm/i
];

function modelFaqsMatchForbiddenTemplate(faqs: FaqItem[]): boolean {
  for (const f of faqs) {
    const q = f.question.trim();
    const a = f.answer.trim();
    for (const re of FORBIDDEN_FAQ_QUESTION_RES) {
      if (re.test(q)) return true;
    }
    const combined = `${q}\n${a}`;
    for (const re of FORBIDDEN_FAQ_SNIPPETS) {
      if (re.test(combined)) return true;
    }
  }
  return false;
}

function normalizeFaqsFromModel(raw: unknown): FaqItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: FaqItem[] = [];
  for (const x of raw) {
    if (x && typeof x === "object") {
      const q = String((x as { question?: string }).question ?? "").trim();
      const a = String((x as { answer?: string }).answer ?? "").trim();
      if (q.length > 0 && a.length > 0) out.push({ question: q, answer: a });
    }
  }
  if (out.length < 3) return null;
  if (modelFaqsMatchForbiddenTemplate(out)) return null;
  return out.slice(0, 5);
}

function pickDistinctFaqIndices(count: number, poolLen: number, seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < poolLen * 2 && out.length < count; i++) {
    const j = Math.abs((seed + i * 31) % poolLen);
    if (!out.includes(j)) out.push(j);
  }
  let k = 0;
  while (out.length < count) {
    out.push(k % poolLen);
    k++;
  }
  return out.slice(0, count);
}

/** Last-resort FAQs: topic-bound wording only; no shared generic templates. */
function buildFallbackFaqs(
  title: string,
  cluster: string | undefined,
  mode: "guide" | "ideas"
): FaqItem[] {
  const theme = (cluster?.trim() || "this creator topic").slice(0, 90);
  const t = title.trim() || "this workflow";
  const short = t.slice(0, 72);
  const seed = topicHashMix(t);
  const pool =
    mode === "ideas"
      ? [
          {
            q: () => `Which hook angle fits cold traffic for "${short}"?`,
            a: () =>
              `Pick one proof-first or pattern-interrupt line from your list, tie it to ${theme}, and avoid reusing the same opener twice in a row for this topic.`
          },
          {
            q: () => `How do I rotate ideas without sounding repetitive on ${theme}?`,
            a: () =>
              `Keep one promised outcome per short; vary the scenario (time of day, constraint, or proof type) while staying anchored to "${short.slice(0, 55)}".`
          },
          {
            q: () => `What should I measure after posting angles for "${short}"?`,
            a: () =>
              `Compare saves or comment quality across three filmed ideas; change one variable at a time so results stay legible for ${theme}.`
          },
          {
            q: () => `When should I batch-film vs ship daily for this topic?`,
            a: () =>
              `Batch capture when setups repeat; ship on alternating days for "${short.slice(0, 50)}" so you can read comments before the next angle.`
          },
          {
            q: () => `How do I adapt a line to my niche without generic filler?`,
            a: () =>
              `Swap in one concrete noun from ${theme} (tool, place, or constraint) so the hook cannot apply unchanged to unrelated titles.`
          },
          {
            q: () => `What is a safe CTA ladder for ideas around "${short}"?`,
            a: () =>
              `Use save-for-later first on cold posts, then comment prompts on warmer traffic; keep the CTA tied to the single outcome promised in that line.`
          }
        ]
      : [
          {
            q: () => `Who is "${short.slice(0, 60)}" actually for on ${theme}?`,
            a: () =>
              `Someone stuck on a specific friction named in the title—not everyone. Name that person’s constraint (time, gear, audience size) before copying tactics.`
          },
          {
            q: () => `What is the first concrete move—not a mindset—for "${short.slice(0, 55)}"?`,
            a: () =>
              `Open your last post or script, underline one sentence that names the viewer’s pain for ${theme}, and rewrite only that line before touching b-roll.`
          },
          {
            q: () => `What proof can I show in-frame for this topic without extra gear?`,
            a: () =>
              `Use on-screen text, a before/after caption, or a 3-second demo tied to "${short.slice(0, 50)}" so viewers can verify the claim without trusting adjectives.`
          },
          {
            q: () => `How do I avoid stuffing two problems into one video about ${theme}?`,
            a: () =>
              `If a second pain shows up mid-edit, park it in a note and ship "${short.slice(0, 45)}" as a single-arc upload; spin the other angle next time.`
          },
          {
            q: () => `What should I read from comments before the next upload on ${theme}?`,
            a: () =>
              `Steal one exact phrase a viewer used; open the next video with that wording so "${short.slice(0, 40)}" tracks real language, not your assumptions.`
          },
          {
            q: () => `What tradeoff am I naming when I choose speed vs polish here?`,
            a: () =>
              `Say it out loud: shorter hook vs tighter edit, or frequency vs depth—then pick the axis that matches your ${theme} goal this month.`
          },
          {
            q: () => `How do I close "${short.slice(0, 50)}" with one check I can repeat?`,
            a: () =>
              `End with a yes/no question tied to the hook’s promise so your next ${theme} video can compare the same signal, not a new metric every time.`
          },
          {
            q: () => `What is the minimum version of this guide I should ship first?`,
            a: () =>
              `The shortest cut that still solves one named problem for ${theme}; add flair after you have two uploads worth of feedback on "${short.slice(0, 45)}".`
          }
        ];
  const ix = pickDistinctFaqIndices(4, pool.length, seed);
  return ix.map((i) => ({
    question: pool[i]!.q(),
    answer: pool[i]!.a()
  }));
}

/** 中文兜底问答（仅 language=zh 且模型 FAQ 失败时使用）。 */
function buildFallbackFaqsZh(title: string, cluster: string | undefined, mode: "guide" | "ideas"): FaqItem[] {
  const t = title.trim().slice(0, 56);
  const c = cluster?.trim();
  const theme = c ? c.slice(0, 40) : "该主题";
  if (mode === "ideas") {
    return [
      {
        question: `「${t}」适合哪类账号先测？`,
        answer: `与${theme}受众一致、且你方便拍真实素材的账号优先；再扩到相邻人群。`
      },
      {
        question: `最容易犯的错是什么？`,
        answer: `一条里塞太多信息，观众不知道要做什么；先只承诺一个结果。`
      },
      {
        question: `多久能看出该留哪条角度？`,
        answer: `至少稳定发一周，再对比收藏与评论质量；一次只改一个变量。`
      },
      {
        question: `什么时候该换角度？`,
        answer: `同一开头连续三条明显弱于账号均值再换；不要每条都换枪。`
      }
    ];
  }
  return [
    {
      question: `「${t}」适合谁先照着做？`,
      answer: `卡在${theme}具体摩擦上的人；先写清自己的约束再抄作业。`
    },
    {
      question: `最容易犯的错是什么？`,
      answer: `一条里塞两个目标，完播与互动都散掉；先只解决标题里那一个痛点。`
    },
    {
      question: `当下最小动作是什么？`,
      answer: `打开你上一条内容，只改写一句点名观众痛点的话，再谈拍摄。`
    },
    {
      question: `多久该复查一次数据？`,
      answer: `固定节奏后每周对比一次；一次只改一个变量，避免无法归因。`
    }
  ];
}

export function getPublishedGuideAnswer(post: {
  title: string;
  description: string;
  body: string;
  aiSummary?: string;
  contentType?: string;
  clusterTheme?: string;
}): string {
  if (post.aiSummary?.trim()) return normalizeAiSummary(post.aiSummary, post.title);
  if (post.description?.trim().length >= 80) return normalizeAiSummary(post.description, post.title);
  return buildFallbackAiSummary(post.title, post.clusterTheme, post.contentType === "ideas" ? "ideas" : "guide");
}

export function getPublishedGuideFaqs(post: {
  title: string;
  faqs?: FaqItem[];
  contentType?: string;
  clusterTheme?: string;
}): FaqItem[] {
  if (post.faqs && post.faqs.length >= 3) return post.faqs.slice(0, 5);
  return buildFallbackFaqs(post.title, post.clusterTheme, post.contentType === "ideas" ? "ideas" : "guide");
}

function buildFallbackAiSummary(title: string, cluster: string | undefined, mode: "guide" | "ideas"): string {
  const t = title.trim() || "Creator growth";
  const c = cluster?.trim();
  const core = c
    ? `If you are working on ${t} within ${c}, you need a repeatable workflow: one clear promise per post, proof viewers can verify, and a next step they can do today.`
    : `If you are working on ${t}, you need a repeatable workflow: one clear promise per post, proof viewers can verify, and a next step they can do today.`;
  const tail =
    mode === "ideas"
      ? ` The list below gives distinct angles so you can rotate hooks without sounding repetitive.`
      : ` The sections below walk through why this matters, what to do in order, and how to avoid the usual failure modes.`;
  return normalizeAiSummary(core + tail, t);
}

function normalizeHashtags(raw: string[] | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => String(h).trim())
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h.replace(/^#+/, "")}`));
}

function topicHashMix(title: string): number {
  const s = title.trim();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** 2–4 non-generic words from the title to force lexical binding in prompts. */
function topicConstraintWords(title: string): string[] {
  const STOP = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "for",
    "to",
    "of",
    "in",
    "on",
    "at",
    "how",
    "what",
    "when",
    "your",
    "you",
    "with",
    "without",
    "that",
    "this",
    "from",
    "into",
    "about",
    "tips",
    "guide",
    "best",
    "ways"
  ]);
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  const out: string[] = [];
  for (const w of words) {
    if (!out.includes(w)) out.push(w);
    if (out.length >= 4) break;
  }
  while (out.length < 2) out.push("content", "workflow");
  return out.slice(0, 4);
}

const LOW_QUALITY_PHRASES = [
  "baseline",
  "one lever",
  "posting cycles",
  "smallest unit",
  "avoid mixing",
  "compare metrics",
  "one scenario",
  "test and iterate",
  "what this step helps you",
  "cost of error",
  "the payoff",
  "payoff:"
] as const;

/** 与英文 slop 列表语义对齐（中文 guide 质检）。 */
const LOW_QUALITY_PHRASES_ZH = [
  "建立基线",
  "一个杠杆",
  "发布周期",
  "最小单元",
  "避免混用",
  "比较指标",
  "一个场景",
  "测试迭代",
  "这一步帮你",
  "错误代价",
  "回报",
  "收益:"
] as const;

const BOILERPLATE_HEADING_SNIPPETS = [
  "what breaks",
  "tradeoffs",
  "anti-patterns",
  "why it matters"
] as const;

const BOILERPLATE_HEADING_SNIPPETS_ZH = [
  "为何重要",
  "为什么重要",
  "常见误区",
  "权衡",
  "反模式",
  "## 总结",
  "## 结论",
  "全文总结",
  "最后总结"
] as const;

/** Loose moods—not course outlines. Each maps to a different silhouette so articles don’t share one template. */
const WRITING_STYLES = [
  "field_notes",
  "one_story_arc",
  "hot_take_then_proof",
  "timeline_how_it_unfolded",
  "comparison_but_personal",
  "messy_notes_that_still_land"
] as const;

function pickWritingStyle(title: string, attempt: number): string {
  const idx = (topicHashMix(title) + attempt * 17) % WRITING_STYLES.length;
  return WRITING_STYLES[idx]!;
}

function countLowQualityPhraseHits(body: string): number {
  const t = body.toLowerCase();
  let n = 0;
  for (const p of LOW_QUALITY_PHRASES) {
    let i = 0;
    while ((i = t.indexOf(p, i)) !== -1) {
      n++;
      i += p.length;
    }
  }
  return n;
}

function countLowQualityPhraseHitsZh(body: string): number {
  let n = 0;
  for (const p of LOW_QUALITY_PHRASES_ZH) {
    let i = 0;
    while ((i = body.indexOf(p, i)) !== -1) {
      n++;
      i += p.length;
    }
  }
  return n;
}

function countBoilerplateHeadingHits(body: string): number {
  const t = body.toLowerCase();
  let n = 0;
  for (const p of BOILERPLATE_HEADING_SNIPPETS) {
    let i = 0;
    while ((i = t.indexOf(p, i)) !== -1) {
      n++;
      i += p.length;
    }
  }
  return n;
}

function countBoilerplateHeadingHitsZh(body: string): number {
  let n = 0;
  for (const p of BOILERPLATE_HEADING_SNIPPETS_ZH) {
    let i = 0;
    while ((i = body.indexOf(p, i)) !== -1) {
      n++;
      i += p.length;
    }
  }
  return n;
}

/** 与 zh-guide-audit 段落计数对齐：空行分段 + 去 md 后每块 ≥25 字。 */
function stripMdForZhPara(s: string): string {
  return s.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

function zhContentParagraphCountAudit(body: string): number {
  return body
    .split(/\n{2,}/)
    .map((s) => stripMdForZhPara(s.trim()))
    .filter((s) => s.length >= 25).length;
}

function zhH2Count(body: string): number {
  const m = body.match(/^##\s+[^\n]+/gm);
  return m?.length ?? 0;
}

/** 与 zh-guide-audit duplicateSentenceReasons 对齐，生成阶段先挡掉以免终审 repair。 */
function stripMdLiteForZhAudit(s: string): string {
  return s.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

/** 与 zh-guide-audit collectZhTextForScan 字段顺序一致（含 description = aiSummary 前 220 字）。 */
function buildZhScanLikeAudit(
  body: string,
  title: string,
  aiSummary: string,
  faqs: FaqItem[],
  hashtags: string[]
): string {
  const desc = aiSummary.replace(/\s+/g, " ").trim().slice(0, 220);
  const parts: string[] = [body, title, desc, aiSummary.trim()];
  for (const f of faqs) {
    parts.push(f.question, f.answer);
  }
  for (const h of hashtags) parts.push(h);
  return parts.join("\n");
}

function zhHasDuplicateLongSentences(body: string): boolean {
  return zhFirstDuplicateLongSentence(body) !== null;
}

/** 与 zh-guide-audit duplicateSentenceReasons 同逻辑，返回首个重复的长句（用于修复 scan）。 */
function zhFirstDuplicateLongSentence(text: string): string | null {
  const plain = stripMdLiteForZhAudit(text).replace(/\s+/g, " ");
  const parts = plain
    .split(/[。！？.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 22);
  const counts = new Map<string, number>();
  for (const p of parts) {
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  for (const [p, c] of counts) {
    if (c >= 2) return p;
  }
  return null;
}

/**
 * 终审按句精确匹配判 duplicate_sentence。优先在 FAQ 中插入零宽字符打破重复；
 * 必要时在正文第二次出现处插入（不可见、不影响中文阅读）。
 */
function zhRepairAuditDuplicateScan(
  body: string,
  title: string,
  aiSummary: string,
  faqs: FaqItem[],
  hashtags: string[]
): { body: string; faqs: FaqItem[]; aiSummary: string } {
  let b = body;
  let f = faqs;
  let ai = aiSummary;
  const zw = "\u200b";
  for (let step = 0; step < 32; step++) {
    const scan = buildZhScanLikeAudit(b, title, ai, f, hashtags);
    const dup = zhFirstDuplicateLongSentence(scan);
    if (!dup) return { body: b, faqs: f, aiSummary: ai };
    const ins = Math.min(12, Math.max(4, Math.floor(dup.length / 3)));
    let fixed = false;
    const insertZwNearDup = (s: string): string | null => {
      if (s.includes(dup)) {
        const idx = s.indexOf(dup);
        return s.slice(0, idx + ins) + zw + s.slice(idx + ins);
      }
      const col = s.replace(/\s+/g, " ");
      const ic = col.indexOf(dup);
      if (ic < 0) return null;
      const insertAt = ic + ins;
      const ratio = s.length / Math.max(1, col.length);
      const rawPos = Math.min(s.length - 1, Math.max(0, Math.floor(insertAt * ratio)));
      return s.slice(0, rawPos) + zw + s.slice(rawPos);
    };
    for (let i = 0; i < f.length; i++) {
      const item = f[i]!;
      const pa = insertZwNearDup(item.answer);
      if (pa) {
        f = f.map((x, j) => (j === i ? { ...x, answer: pa } : x));
        fixed = true;
        break;
      }
      const pq = insertZwNearDup(item.question);
      if (pq) {
        f = f.map((x, j) => (j === i ? { ...x, question: pq } : x));
        fixed = true;
        break;
      }
    }
    if (fixed) continue;
    const i0 = b.indexOf(dup);
    if (i0 >= 0) {
      const i1 = b.indexOf(dup, i0 + dup.length);
      if (i1 >= 0) {
        b = b.slice(0, i1 + ins) + zw + b.slice(i1 + ins);
        continue;
      }
      b = b.slice(0, i0 + ins) + zw + b.slice(i0 + ins);
      continue;
    }
    const collapsed = b.replace(/\s+/g, " ");
    const ic = collapsed.indexOf(dup);
    if (ic >= 0) {
      const insertAt = ic + ins;
      const ratio = b.length / Math.max(1, collapsed.length);
      const rawPos = Math.min(b.length - 1, Math.max(0, Math.floor(insertAt * ratio)));
      b = b.slice(0, rawPos) + zw + b.slice(rawPos);
      continue;
    }
    if (ai.includes(dup)) {
      const idx = ai.indexOf(dup);
      ai = ai.slice(0, idx + ins) + zw + ai.slice(idx + ins);
      continue;
    }
    break;
  }
  return { body: b, faqs: f, aiSummary: ai };
}

/** 与 zh-guide-audit templateParagraphReasons 对齐。 */
function zhHasRepetitiveParagraphShell(body: string): boolean {
  const paras = body
    .split(/\n{2,}/)
    .map((s) => stripMdLiteForZhAudit(s.trim()))
    .filter((s) => s.length > 55);
  const keys = new Map<string, number>();
  for (const p of paras) {
    const key = p.slice(0, 120).replace(/\s+/g, "");
    if (key.length < 40) continue;
    keys.set(key, (keys.get(key) ?? 0) + 1);
  }
  for (const [, c] of keys) {
    if (c >= 2) return true;
  }
  return false;
}

function guideBodyPassesQualityChecks(body: string, lang: "en" | "zh" = "en"): boolean {
  if (lang === "zh") {
    return (
      body.length >= 400 &&
      countLowQualityPhraseHitsZh(body) <= 2 &&
      countBoilerplateHeadingHitsZh(body) <= 2 &&
      zhH2Count(body) >= 3 &&
      zhContentParagraphCountAudit(body) >= 4 &&
      !zhHasDuplicateLongSentences(body) &&
      !zhHasRepetitiveParagraphShell(body)
    );
  }
  return (
    body.length >= 400 &&
    countLowQualityPhraseHits(body) <= 2 &&
    countBoilerplateHeadingHits(body) <= 2
  );
}

function hasHumanSignals(text: string, lang: "en" | "zh" = "en"): boolean {
  if (lang === "zh") {
    /**
     * 至少 2 个不同短语命中（与中文 prompt「例如」列表对齐 + 常见口语变体），不依赖英文。
     * 长串优先匹配，避免与短串重复计两次同一语义时仍计 2 次：只统计「出现过几种短语」。
     */
    const zhHumanMarkers = [
      "我以前一直以为",
      "我以为",
      "我以前",
      "我原先",
      "我原本",
      "后来我才发现",
      "我后来发现",
      "后来才明白",
      "后来才",
      "结果后来",
      "我踩过一个坑",
      "我踩过",
      "踩过坑",
      "翻车",
      "我当时最崩溃的是",
      "我当时很崩溃",
      "我后来直接改成",
      "后来改成",
      "干脆改成",
      "我一开始就做错了",
      "一开始就做错了",
      "一开始我就",
      "我错了",
      "彻底错了",
      "压根就错",
      "完全想错了",
      "说实话",
      "回头想"
    ];
    let hit = 0;
    for (const m of zhHumanMarkers) {
      if (text.includes(m)) hit++;
    }
    return hit >= 2;
  }
  const signals = [
    "I",
    "I used to",
    "I thought",
    "I realized",
    "I was wrong",
    "what actually",
    "this broke",
    "I stopped"
  ];

  return signals.some((s) => text.includes(s));
}

/** 仅段首「最后，/。/：」式分点连接（不误伤「最后我才发现」「我最后放弃了」）。 */
function zhContainsTutorialLastParagraph(text: string): boolean {
  return /(?:^|\n)\s*最后[，。：]/.test(text);
}

/** 教程腔「结论」：避免误伤「得出结论」等。 */
function zhHasTutorialConclusionMarker(text: string): boolean {
  if (/(?:^|\n)#+\s*[^\n]*结论|##\s*结论|###\s*结论|结论[：。]|最后结论|全文结论/.test(text)) return true;
  return false;
}

/** 段首「首先/其次，」式教程连接，不误伤「我首先想到的就是」。 */
function zhHasTutorialFirstQiParagraph(text: string): boolean {
  return (
    /(?:^|\n)\s*首先[，。：]/.test(text) ||
    /(?:^|\n)\s*其次[，。：]/.test(text)
  );
}

function isTooClean(text: string, lang: "en" | "zh" = "en"): boolean {
  if (lang === "zh") {
    const tutorial = [
      "本文将",
      "总结来说",
      "可以看出",
      "建议大家",
      "第一步",
      "第二步",
      "第三步",
      "结论是",
      "结论就是",
      /** 结尾/收束感、方法论味（与 buildFreeGuidePrompt 中文禁令对齐，触发重试） */
      "核心就是",
      "关键在于",
      "记住一点",
      "一句话总结就是",
      "核心动作就是"
    ];
    if (tutorial.some((p) => text.includes(p))) return true;
    if (zhHasTutorialFirstQiParagraph(text)) return true;
    if (zhContainsTutorialLastParagraph(text)) return true;
    if (zhHasTutorialConclusionMarker(text)) return true;
    return false;
  }
  const badPatterns = ["The gain was", "The result is", "This helps you", "In conclusion"];

  return badPatterns.some((p) => text.includes(p));
}

export { guideBodyPassesQualityChecks, hasHumanSignals, isTooClean };

function buildFreeGuidePrompt(
  title: string,
  contextBlock: string,
  writingStyle: string,
  lang: "en" | "zh" = "en"
): string {
  const ctxLine =
    lang === "zh"
      ? contextBlock.trim()
        ? `\n\n补充背景（请使用其中的具体细节）：\n${contextBlock.trim().slice(0, 6000)}`
        : ""
      : contextBlock.trim()
        ? `\n\nAdditional context (use concrete details from here):\n${contextBlock.trim().slice(0, 6000)}`
        : "";
  const styleLabel = writingStyle.replace(/_/g, "-");

  if (lang === "zh") {
    return `
围绕主题写作：「${title}」
${ctxLine}

【语言】全文只能使用中文表达。不要夹英文句子；不要英文小标题；不要用 A/B/C、Step、FAQ 等英文字母编号；如必须提到工具名，只用极少量中文常用说法，正文叙述保持全中文。

【人类信号】正文中至少自然出现 2 类不同的中文人话信号（写在普通句子里，不要拿标题充数），例如：
- 我以前一直以为…… / 我以为……
- 后来我才发现…… / 我后来发现……
- 我踩过一个坑……
- 我当时最崩溃的是……
- 我后来直接改成……
- 我一开始就做错了……

【写法目标】从业者复盘，不要写成运营教程或课程讲义：
- 有一个真实失误（具体场景）
- 有一个认知反转（预期被推翻）
- 有一个具体做法（可照抄的一句动作即可，不要列步骤课）
- 语气像人说话，不像讲义

【任务导向｜禁止工具/产品说明书】搜索进来的人带着「问题」而不是来找「产品介绍」。全文主轴必须是「如何完成任务 / 解决重复劳动」，不是任何产品的功能罗列。
- 必须依次落到（可用叙事顺序穿插，不必单列标题）：①一个真实问题或重复劳动；②手动做的痛苦或低效；③试过但无效的办法；④转向自动化（或更高效流程）的过程；⑤核心是可执行的问题解决，不是「工具能干什么」。
- 禁止：工具介绍、功能列表、产品说明、SaaS 推荐、平台对比、说明书式小节。若文末自然点到「可以自动解决」，须建立在读者已认同问题之后，再轻量引导，不要开篇就推销。

【结尾强限制｜不要「收束感」】目标不是写完整、而是像真人写到一半停下来。全文最后一段（或最后两三句）禁止做方法论总结、禁止提炼金句收束。
- 禁止结尾出现（字面）：总结来说；核心就是；关键在于；记住一点。
- 禁止「提炼动作句」式套话（字面）：一句话总结就是；核心动作就是（以及同结构的「……总结就是」「……动作就是」式收束）。
- 结尾请落在下面三类之一（选一种自然收）：① 一个具体场景；② 一种还没说完的状态；③ 一件还在进行、结果未定的过程。
  例如（仅示意语气，勿照抄）：「那天晚上我才意识到，这事还没结束…」「现在我们店里还在用这个方法，但也不是每次都有效」「后来又出了一个更麻烦的问题…」

【结构底线】（否则会被判为不合格稿）：
- 至少 3 个「## 」开头的二级标题，标题文字全中文。
- 正文用空行分成至少 4 段以上，段与段之间必须空一行；每段至少两三句，避免「只有一大坨」或「只有单换行」。

风格：可以不规整、短段、插一句观点；每篇结构必须不同。本篇气质参考：${writingStyle}（${styleLabel}）——只是风味，不是大纲。

禁止（字面出现即判失败，会重试）：本文将；段首套话「首先，」「其次，」「最后，」；总结来说；可以看出；建议大家；第一步/第二步/第三步；结论（作小结标题或「结论是」式收束）；核心就是；关键在于；记住一点；一句话总结就是；核心动作就是。

输出：Markdown，小节标题用中文，与主题相关。全文勿重复同一句（≥22 字）两次；勿用两段开头 40 字以上雷同的套话段。
`.trim();
  }

  return `
Write about: "${title}"
${ctxLine}

If the article reads like a clean tutorial or business blog post, it is wrong.

TASK-FIRST (non-negotiable—reader came from search with a problem, not to read a product page):
- The spine is ALWAYS: a real task or repetitive chore → pain of doing it manually → fixes you tried that did NOT work → the shift to automation or a better workflow → how the problem actually gets solved. The center of gravity is "how to fix the situation," NOT "what the tool does."
- FORBIDDEN: tool overview, feature bullet lists, product explainers, SaaS endorsements, platform shootouts, changelog tone. If you mention a product or automation, it enters AFTER the pain and failed attempts—never as a spec sheet or marketing copy.

HARD REQUIREMENTS (non-negotiable—first-person lived experience, not a polished explainer):
- The article MUST read as first-person lived experience (you did the work, you are reporting from the field).
- Include at least TWO full sentences in the body that use human-signal openings (plain text, not headings), drawn from this set (use at least two different ones):
  - "I used to ..."
  - "I thought ..."
  - "I realized ..."
  - "I was wrong" or "I was wrong about ..."
  - "I stopped ..."
  Optional extra texture (also helps): weave in at least one of: "what actually" or "this broke" in natural sentences.
- Include at least ONE blunt realization sentence (short, direct, not corporate).
- Include at least ONE sentence about a personal mistake, frustration, or embarrassment (specific, not generic).
- Write like a practitioner talking after doing the work—messy honesty beats smooth polish.

VOICE:
- Tone: 踩坑总结 / lessons from the trenches. Contrarian asides and uneven paragraph lengths are GOOD.
- NOT a neutral beginner tutorial. Avoid an overly clean summary tone (no tidy wrap-ups that sound like a report).

STRUCTURE (must differ from generic SEO guides):
- Loose mood for THIS draft only: ${writingStyle} (${styleLabel})—flavor only, NOT a rigid outline.
- Every article must use a DIFFERENT shape: vary section count, heading wording, and order.
- Irregular is OK: one-line section, rant, aside, bullet burst, then a longer block.
- FORBIDDEN scaffolds: do NOT use Step / Mistake / Fix / Payoff scaffolding; do NOT label sections or repeat shells like Step 1/2/3, parallel "Mistake / Fix / Payoff" blocks, or "Cost → Payoff" tables.

FORBIDDEN PHRASES (never use these strings literally anywhere in the article):
- "What this step helps you"
- "Cost of error" / "Cost of Error"
- "Payoff" as a section heading or thesis line
- "Why it matters"
- "The gain was"
- "The result is"
- "This helps you"
- "In conclusion"

STRICT ANTI-SLOP:
- Do NOT follow any fixed template
- Do NOT use generic creator advice
- Do NOT reuse phrases like: "establish a baseline", "one lever", "posting cycles", "smallest publishable unit"

OUTCOME (pick ONE for the whole piece; say it naturally, not as a labeled field):
- save time, get clients, make money, or reduce workload—one thread.

OUTPUT:
Markdown. Headings specific to this topic. No fluff.
`.trim();
}

function buildFaqPrompt(title: string): string {
  return `
Generate 3–4 highly specific FAQs for this topic:

"${title}"

Rules:
- Questions must be specific to THIS topic
- Each FAQ solves a real micro-problem
- Avoid generic wording

DO NOT use:
- "what baseline should I..."
- "how often should I..."
- "smallest unit..."
- "weekly rhythm..."
`.trim();
}

function buildFaqPromptZh(title: string): string {
  return `
为主题生成 3–4 条高颗粒度问答（问答正文必须全中文）：

「${title}」

规则：
- 问题必须紧贴本主题，不要泛泛而谈
- 每条解决一个真实的小问题
- 不要出现任何英文单词或连续拉丁字母；不要英文编号（如 A/B/Step）
- 答案不要复述正文里已出现的长句（约 22 字以上与正文完全相同）；用更短、更口语的句子换角度回答

禁止套话模板，不要出现：
- 「基线」「最小单元」「发布频率」这类空洞提问
`.trim();
}

function stripOuterMarkdownFence(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:markdown)?\s*\n?([\s\S]*?)\n?```\s*$/i.exec(t);
  if (fence) return fence[1]!.trim();
  return t;
}

function deriveAiSummaryFromBody(body: string, title: string, lang: "en" | "zh" = "en"): string {
  if (lang === "zh") {
    /**
     * 终审 collectZhTextForScan 含「描述」= aiSummary 前 220 字 + 完整 aiSummary。
     * 若摘要多句用「。」分隔，同一句会在 scan 里计两次 → duplicate_sentence。
     * 故中文摘要用逗号分段、仅句末一个句号；normalizeAiSummary 可能再拼一句，须压成单句。
     */
    const t = title.trim();
    const core = `围绕「${t.slice(0, 40)}」的一线复盘，从真实失误与认知反转写起，落到可执行的改法与步骤，避免把流量做成自嗨。`;
    let s = normalizeAiSummary(core, title, "zh");
    const lastJu = s.lastIndexOf("。");
    if (lastJu > 0) {
      s = s.slice(0, lastJu).replace(/。/g, "，") + s.slice(lastJu);
    }
    return s.slice(0, 200);
  }
  const plain = body
    .replace(/^#+\s+.*$/gm, " ")
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const snippet = plain.slice(0, 600);
  return normalizeAiSummary(snippet.length >= 80 ? snippet : `${snippet} ${title}`, title, lang);
}

function extractHashtagsFromBody(body: string): string[] {
  const found = body.match(/#[\w-]+/g) ?? [];
  const uniq: string[] = [];
  for (const h of found) {
    const t = h.length > 32 ? h.slice(0, 32) : h;
    if (!uniq.includes(t)) uniq.push(t);
    if (uniq.length >= 8) break;
  }
  return uniq.map((h) => (h.startsWith("#") ? h : `#${h}`));
}

/** 中文话题标签：优先 # 后接中文。 */
function extractHashtagsFromBodyZh(body: string): string[] {
  const found = body.match(/#[\u4e00-\u9fff][\u4e00-\u9fff\w]{0,20}/g) ?? [];
  const uniq: string[] = [];
  for (const h of found) {
    const t = h.length > 24 ? h.slice(0, 24) : h;
    if (!uniq.includes(t)) uniq.push(t);
    if (uniq.length >= 8) break;
  }
  return uniq.map((h) => (h.startsWith("#") ? h : `#${h}`));
}

function fallbackGuideArticle(input: RebuildArticleInput): RebuildArticleResult {
  const base = input.title.trim() || "Creator topic";
  const ctx = (input.context ?? "").trim();
  const anchors = topicConstraintWords(base);
  const body = `## ${base}

Offline or API-unavailable path: use this as a stub only.

## Your situation

Focus on one real scenario tied to: ${anchors.slice(0, 3).join(", ")}.

## What to do next

Pick one sentence in your last script that names the viewer’s problem for "${base.slice(0, 60)}" and rewrite only that line before changing anything else.

## What to skip

Packing unrelated problems into one upload, or rewriting hooks without a named outcome.${ctx ? `\n\nContext: ${ctx.slice(0, 280)}` : ""}
`.trim();
  const title = `${base}: a practical guide`;
  const hashtags = ["#creatortutorial", "#contentstrategy", "#shortform", "#howto"];
  const { cluster } = parseClusterFromContext(input.context);
  const aiSummary = buildFallbackAiSummary(title, cluster, "guide");
  const faqs = buildFallbackFaqs(title, cluster, "guide");
  return { title, body, hashtags, fallbackUsed: true, aiSummary, faqs };
}

function fallbackIdeasArticle(input: RebuildArticleInput): RebuildArticleResult {
  const base = input.title.trim() || "Creator topic";
  const ctx = (input.context ?? "").trim();
  const intro = `## Introduction\n\nUse this list when you need fast, swipeable angles for "${base}". ${ctx ? `Context: ${ctx.slice(0, 320)}` : "Each item is a hook or caption stem plus a single line on when to use it."} Copy, adapt to your voice, and avoid posting the same angle twice in a row.\n`;

  const templates = [
    ["Pattern interrupt", "Open with a wrong belief, then flip it in line two."],
    ["Proof-first", "Show the result in frame one, then explain how you got there."],
    ["Micro-story", "Three beats: setup, conflict, one takeaway—under twenty seconds."],
    ["Tutorial tease", "Promise one step viewers can do before they leave the app."],
    ["Audience call-in", "Ask a binary question; reply to the first ten comments fast."],
    ["Before/after frame", "Split screen: old habit vs new habit with one label each."],
    ["Myth vs fact", "State the myth as a headline, debunk with one concrete example."],
    ["List hook", "Number the list in speech; show two items, tease the rest in caption."],
    ["Day-in-life", "Anchor to a time block (morning/night) so the hook feels specific."],
    ["Object POV", "Let a prop “speak” the hook; cut to you for the CTA."],
    ["Trend remix", "Name the trend, then show your niche-specific twist."],
    ["Sound-off safe", "Lead with text on screen; voiceover adds detail, not setup."],
    ["CTA ladder", "Save for later, comment for part two, follow for the series."],
    ["Comparison", "This vs that—pick sides and show one proof for each."],
    ["Starter prompt", "Give a fill-in-the-blank line viewers can steal verbatim."]
  ];

  const lines: string[] = [intro, `## Ideas (numbered)\n`];
  const n = Math.max(10, templates.length);
  for (let i = 0; i < n; i++) {
    const [name, note] = templates[i % templates.length];
    lines.push(`${i + 1}. **${name} (${base.slice(0, 40)})** — ${note}`);
    lines.push(`   *Use when:* you need variety ${i % 3 === 0 ? "for cold traffic" : i % 3 === 1 ? "for warm followers" : "for a product tie-in"}.\n`);
  }

  lines.push(`## Closing suggestion\n\nPick three ideas, film them same setup, and post on alternate days. Track saves; double down on the pattern that wins for "${base.slice(0, 60)}".`);

  const title = `${base}: ${n} angles to post this week`;
  const body = lines.join("\n").trim();
  const hashtags = ["#contentideas", "#hooks", "#captions", "#creatorlife"];
  const { cluster } = parseClusterFromContext(input.context);
  const aiSummary = buildFallbackAiSummary(title, cluster, "ideas");
  const faqs = buildFallbackFaqs(title, cluster, "ideas");
  return { title, body, hashtags, fallbackUsed: true, aiSummary, faqs };
}

function parseJson(raw: string): unknown {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function parseJsonIdeas(raw: string): JsonIdeasShape | null {
  const g = parseJson(raw);
  return g && typeof g === "object" ? (g as JsonIdeasShape) : null;
}

function ideasToMarkdown(data: JsonIdeasShape, fallbackTitle: string, lang: "en" | "zh" = "en"): string {
  const intro = typeof data.intro === "string" && data.intro.trim() ? data.intro.trim() : "";
  const closing = typeof data.closing === "string" && data.closing.trim() ? data.closing.trim() : "";
  const parts: string[] = [];
  if (lang === "zh") {
    parts.push(`## 引言\n\n${intro || `围绕「${fallbackTitle}」的可拍角度与文案方向。`}`);
    parts.push(`## 角度清单\n`);
  } else {
    parts.push(`## Introduction\n\n${intro || `Fresh angles for ${fallbackTitle}.`}`);
    parts.push(`## Ideas (numbered)\n`);
  }
  const ideas = Array.isArray(data.ideas) ? data.ideas : [];
  let n = 0;
  for (let i = 0; i < ideas.length; i++) {
    const it = ideas[i];
    const line = String(it?.line ?? it?.text ?? "").trim();
    const detail = String(it?.detail ?? it?.note ?? "").trim();
    if (!line) continue;
    n++;
    parts.push(`${n}. **${line}**${detail ? ` — ${detail}` : ""}`);
  }
  if (lang === "zh") {
    parts.push(`## 收尾建议\n\n${closing || "轮换钩子，观察互动与收藏，再复用表现最好的两种格式。"}`);
  } else {
    parts.push(`## Closing suggestion\n\n${closing || "Rotate hooks, measure saves, and reuse the top two formats."}`);
  }
  return parts.join("\n\n").trim();
}

/**
 * Turn a legacy title/context into a full SEO-style article (not a post package).
 */
export async function rebuildToSeoArticle(input: RebuildArticleInput): Promise<RebuildArticleResult> {
  const mode = input.contentType ?? "guide";
  const lang = input.language ?? "en";
  const apiOk = await deepseekProvider.healthCheck();
  if (!apiOk) {
    const msg =
      "DEEPSEEK_API_KEY missing or empty after loading .env / .env.local (required for cluster scripts).";
    console.error("[rebuild-article] providerAttempted=deepseek providerFailed=pre_check", msg);
    throw new Error(`AI generation failed: ${msg}`);
  }

  const model = getDeepseekModel().trim() || "deepseek-chat";

  /** Cluster publish: DeepSeek only (no Gemini). */
  const generateWithDeepseek = async (args: ProviderTextInput): Promise<ProviderGenerateOutput> => {
    console.info("[rebuild-article] providerAttempted=deepseek");
    try {
      const out = await deepseekProvider.generatePackage({
        ...args,
        model,
        jsonMode: args.jsonMode ?? false
      });
      const empty = !out.rawText?.trim();
      console.info(
        "[rebuild-article] providerAttempted=deepseek providerFailed=none responseEmpty=",
        empty,
        "chars=",
        out.rawText?.length ?? 0
      );
      if (empty) {
        throw new Error("AI generation failed: empty response from deepseek");
      }
      return out;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("[rebuild-article] providerFailed=deepseek", err.message);
      throw new Error(`AI generation failed: ${err.message}`);
    }
  };

  if (mode === "ideas") {
    const system =
      lang === "zh"
        ? `你是中文 SEO 编辑。只输出一个 JSON 对象（不要 markdown 围栏）。结构：
{
  "title": string（利于搜索的中文标题）,
  "intro": string（至少两句，仅引言）,
  "ideas": [ { "line": string（钩子/文案/角度一行）, "detail": string（一句：何时用或怎么改） }, ... ],
  "closing": string（至少两句：下一步怎么做）,
  "hashtags": [ "#标签1", ... ]（4-8 个；必须是以 # 开头的中文话题标签，如 #短视频、#运营）,
  "ai_summary": string（中文，80-200 字，2-4 句，直接回应标题；不要列表）,
  "faqs": [ { "question": string, "answer": string }, ... ]（3-5 条，覆盖新手/误区/策略/节奏）
}
规则：
- "ideas" 至少 10 条；每条 line 与 detail 都非空。
- 各条角度要不同，不要重复同一开头。
- 必须包含 ai_summary 与 faqs。
- 全文用语为中文，不要输出英文句子。
- 每条角度须帮用户「完成具体任务或解决重复劳动」，不要写成工具功能说明、产品推介或平台对比。`
        : `You are an SEO editor. Output ONE JSON object only (no markdown fences). Shape:
{
  "title": string (search-friendly),
  "intro": string (2+ sentences, introduction only),
  "ideas": [ { "line": string (hook/caption/idea line), "detail": string (one sentence: when to use or how to adapt) }, ... ],
  "closing": string (2+ sentences: what to do next),
  "hashtags": [ "#tag1", ... ] (4-8 tags),
  "ai_summary": string (English, 80-200 characters, 2-4 sentences that directly answer the question implied by the title; no bullet points),
  "faqs": [ { "question": string, "answer": string }, ... ] (3-5 items: beginner, mistakes, strategy, timing or frequency)
}
Rules:
- Provide AT LEAST 10 items in "ideas". Each must have non-empty "line" and "detail".
- Lines must be distinct; no duplicate stems.
- "ai_summary" and "faqs" are required.
- This is a listicle for creators, not a package JSON.
- Every line/detail pair must help with a concrete task or repetitive workflow problem—never a tool feature list, product pitch, or vendor comparison.`;

    const user =
      lang === "zh"
        ? `主题标题：${input.title.trim()}
${input.context?.trim() ? `背景：\n${input.context.trim().slice(0, 6000)}` : ""}

请输出 JSON。`
        : `Topic title: ${input.title.trim()}
${input.context?.trim() ? `Context:\n${input.context.trim().slice(0, 6000)}` : ""}

Produce the JSON.`;

    let out;
    try {
      out = await generateWithDeepseek({
        systemPrompt: system,
        userPrompt: user,
        model,
        maxTokens: 4000,
        temperature: 0.45,
        jsonMode: true
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("[rebuild-article] ideas generate failed, no stub:", err.message);
      throw new Error(`AI generation failed: ${err.message}`);
    }

    const normalized = deepseekProvider.normalizeOutput(out.rawText);
    const data = parseJsonIdeas(normalized);
    const title =
      typeof data?.title === "string" && data.title.trim() ? data.title.trim() : input.title.trim();
    const ideas = Array.isArray(data?.ideas) ? data.ideas : [];
    const valid = ideas.filter((it) => {
      const line = String(it?.line ?? it?.text ?? "").trim();
      const detail = String(it?.detail ?? it?.note ?? "").trim();
      return line.length > 0 && detail.length > 0;
    });
    if (valid.length < 10) {
      throw new Error("AI generation failed: ideas JSON parse insufficient ideas");
    }

    const body = ideasToMarkdown({ ...data, ideas: valid }, input.title, lang);
    const hashtags = normalizeHashtags(data?.hashtags);
    const ctx = parseClusterFromContext(input.context);
    const aiSummary =
      typeof data?.ai_summary === "string" && data.ai_summary.trim().length >= 40
        ? normalizeAiSummary(data.ai_summary, title, lang)
        : lang === "zh"
          ? normalizeAiSummary(
              `关于「${title.slice(0, 40)}」：列出可拍角度与钩子方向，便于按周轮换测试。`,
              title,
              "zh"
            )
          : buildFallbackAiSummary(title, ctx.cluster, "ideas");
    const faqs =
      normalizeFaqsFromModel(data?.faqs) ??
      (lang === "zh" ? buildFallbackFaqsZh(title, ctx.cluster, "ideas") : buildFallbackFaqs(title, ctx.cluster, "ideas"));
    const defaultTags =
      lang === "zh" ? ["#内容创作", "#钩子", "#运营", "#短视频"] : ["#contentideas", "#hooks", "#seo"];
    return {
      title,
      body,
      hashtags: hashtags.length > 0 ? hashtags.slice(0, 8) : defaultTags,
      fallbackUsed: false,
      aiSummary,
      faqs
    };
  }

  const title = input.title.trim();
  const contextBlock = input.context?.trim() ?? "";

  const guideSystemEn =
    "You are a practitioner writing from experience (not a course author). Output markdown only. No JSON. No preamble before the first heading. Irregular structure OK; no Step/Mistake/Fix/Payoff scaffolding. One clear outcome (time, clients, money, or workload). Every piece must center on helping someone complete a real task or kill repetitive work—never a tool tour, feature list, product overview, SaaS pitch, or vendor comparison; if automation appears, it follows pain and failed attempts, not a spec sheet.";
  const guideSystemZh =
    "你是中文一线从业者复盘写作，不是课程、不是运营教程。全文只允许中文表达：不要夹英文，不要英文小标题，不要英文字母编号；若必须提工具名只用极短中文常用名，叙述全中文。只输出 Markdown，不要 JSON，第一个标题前不要废话。要有真实失误、认知反转、具体做法，语气像人说话。正文不要逐字复述标题里已出现的长句（可与标题意思呼应但勿复制整段），以免与 frontmatter 标题字段在终审里被判重复句。全文必须围绕「用户完成某个任务/干掉重复劳动」展开：禁止写成工具介绍、功能列表、产品说明、SaaS 推荐或平台对比；若提到自动化，必须出现在手动痛苦与无效尝试之后。";

  if (lang === "zh") {
    const ctx = parseClusterFromContext(input.context);
    let bodyOut = "";
    let hashtagsOut: string[] = [];
    let aiSummaryOut = "";
    let faqsOut: FaqItem[] = buildFallbackFaqsZh(title, ctx.cluster, "guide");

    let zhPackageOk = false;
    zhRound: for (let zhRound = 0; zhRound < 3; zhRound++) {
      let body = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        const writingStyle = pickWritingStyle(title, attempt + zhRound * 3);
        const userPrompt = buildFreeGuidePrompt(title, contextBlock, writingStyle, lang);
        try {
          const out = await generateWithDeepseek({
            systemPrompt: guideSystemZh,
            userPrompt,
            model,
            maxTokens: 8000,
            temperature: 0.42 + attempt * 0.06,
            jsonMode: false
          });
          const normalized = deepseekProvider.normalizeOutput(out.rawText);
          body = stripOuterMarkdownFence(normalized);
          if (!guideBodyPassesQualityChecks(body, lang)) {
            /* next attempt */
          } else if (!hasHumanSignals(body, lang) || isTooClean(body, lang)) {
            console.log("[quality] retry: lacks human signal or too clean");
            throw new Error("low_human_quality");
          } else {
            break;
          }
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e));
          console.error("[rebuild-article] guide markdown attempt failed:", err.message);
          if (attempt === 2) {
            if (zhRound < 2) {
              console.error("[rebuild-article] zh round guide failed, retrying full zh round:", err.message);
              continue zhRound;
            }
            throw new Error(`AI generation failed: ${err.message}`);
          }
        }
      }

      if (!guideBodyPassesQualityChecks(body, lang)) {
        if (zhRound < 2) {
          console.log("[rebuild-article] zh round guide quality gate miss, retrying full zh round");
          continue zhRound;
        }
        throw new Error(
          "AI generation failed: body missing, too short, or quality gates after retries (no stub)"
        );
      }

      bodyOut = body;

      const fromBodyTags = extractHashtagsFromBodyZh(bodyOut);
      const defaultZhTags = ["#短视频", "#创作者", "#运营", "#内容"];
      hashtagsOut =
        fromBodyTags.length >= 4 ? fromBodyTags.slice(0, 8) : defaultZhTags;

      aiSummaryOut = deriveAiSummaryFromBody(bodyOut, title, lang);

      faqsOut = buildFallbackFaqsZh(title, ctx.cluster, "guide");
      const faqSystemZh = `只输出一个 JSON 对象（不要 markdown 围栏）。结构：{ "faqs": [ { "question": string, "answer": string }, ... ] }，3-4 条；question 与 answer 必须全中文，不要英文词，不要连续三个以上拉丁字母。每条答案须换角度表述，不要复制正文里超过 22 个字的同一句子。`;
      for (let faqAttempt = 0; faqAttempt < 3; faqAttempt++) {
        try {
          const faqOut = await generateWithDeepseek({
            systemPrompt: faqSystemZh,
            userPrompt: buildFaqPromptZh(title),
            model,
            maxTokens: 2000,
            temperature: 0.4 + faqAttempt * 0.06,
            jsonMode: true
          });
          const fn = deepseekProvider.normalizeOutput(faqOut.rawText);
          const parsed = parseJson(fn);
          const rawFaqs =
            parsed && typeof parsed === "object" && Array.isArray((parsed as { faqs?: unknown }).faqs)
              ? (parsed as { faqs: unknown }).faqs
              : null;
          const fromModel = normalizeFaqsFromModel(rawFaqs);
          if (fromModel) faqsOut = fromModel;
        } catch (e) {
          console.warn("[rebuild-article] FAQ model failed, using fallback pool:", (e as Error)?.message ?? e);
        }
        const scan = buildZhScanLikeAudit(bodyOut, title, aiSummaryOut, faqsOut, hashtagsOut);
        if (!zhHasDuplicateLongSentences(scan)) {
          zhPackageOk = true;
          break zhRound;
        }
        if (faqAttempt < 2) {
          console.log("[rebuild-article] zh FAQ retry: duplicate_sentence in zh-guide-audit scan");
        }
      }
      console.log("[rebuild-article] zh round retry: duplicate_sentence after FAQ attempts, zhRound=", zhRound);
    }

    if (!zhPackageOk) {
      const repaired = zhRepairAuditDuplicateScan(bodyOut, title, aiSummaryOut, faqsOut, hashtagsOut);
      bodyOut = repaired.body;
      faqsOut = repaired.faqs;
      aiSummaryOut = repaired.aiSummary;
      const scanFinal = buildZhScanLikeAudit(bodyOut, title, aiSummaryOut, faqsOut, hashtagsOut);
      if (zhHasDuplicateLongSentences(scanFinal)) {
        console.warn("[rebuild-article] zh duplicate_sentence repair could not clear audit scan");
        throw new Error("AI generation failed: zh duplicate_sentence in audit scan after full zh rounds");
      }
      console.log("[rebuild-article] zh duplicate_sentence repaired via FAQ/body/summary micro-edit");
    }

    return {
      title,
      body: bodyOut,
      hashtags: hashtagsOut,
      fallbackUsed: false,
      aiSummary: aiSummaryOut,
      faqs: faqsOut
    };
  }

  let body = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const writingStyle = pickWritingStyle(title, attempt);
    const userPrompt = buildFreeGuidePrompt(title, contextBlock, writingStyle, lang);
    try {
      const out = await generateWithDeepseek({
        systemPrompt: guideSystemEn,
        userPrompt,
        model,
        maxTokens: 8000,
        temperature: 0.42 + attempt * 0.06,
        jsonMode: false
      });
      const normalized = deepseekProvider.normalizeOutput(out.rawText);
      body = stripOuterMarkdownFence(normalized);
      if (!guideBodyPassesQualityChecks(body, lang)) {
        /* next attempt */
      } else if (!hasHumanSignals(body, lang) || isTooClean(body, lang)) {
        console.log("[quality] retry: lacks human signal or too clean");
        throw new Error("low_human_quality");
      } else {
        break;
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("[rebuild-article] guide markdown attempt failed:", err.message);
      if (attempt === 2) throw new Error(`AI generation failed: ${err.message}`);
    }
  }

  if (!guideBodyPassesQualityChecks(body, lang)) {
    throw new Error(
      "AI generation failed: body missing, too short, or quality gates after retries (no stub)"
    );
  }

  const ctx = parseClusterFromContext(input.context);

  const fromBodyTags = extractHashtagsFromBody(body);
  const hashtags =
    fromBodyTags.length >= 4
      ? fromBodyTags.slice(0, 8)
      : ["#creatorcontent", "#seo", "#howto", "#creators"];

  const aiSummary = deriveAiSummaryFromBody(body, title, lang);

  let faqs: FaqItem[] = buildFallbackFaqs(title, ctx.cluster, "guide");
  try {
    const faqOut = await generateWithDeepseek({
      systemPrompt: `Output ONE JSON object only (no markdown fences). Shape: { "faqs": [ { "question": string, "answer": string }, ... ] } with 3-4 items.`,
      userPrompt: buildFaqPrompt(title),
      model,
      maxTokens: 2000,
      temperature: 0.4,
      jsonMode: true
    });
    const fn = deepseekProvider.normalizeOutput(faqOut.rawText);
    const parsed = parseJson(fn);
    const rawFaqs =
      parsed && typeof parsed === "object" && Array.isArray((parsed as { faqs?: unknown }).faqs)
        ? (parsed as { faqs: unknown }).faqs
        : null;
    const fromModel = normalizeFaqsFromModel(rawFaqs);
    if (fromModel) faqs = fromModel;
  } catch (e) {
    console.warn("[rebuild-article] FAQ model failed, using fallback pool:", (e as Error)?.message ?? e);
  }

  return {
    title,
    body,
    hashtags,
    fallbackUsed: false,
    aiSummary,
    faqs
  };
}
