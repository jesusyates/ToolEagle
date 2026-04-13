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
  /** Single strategy: experience-recap guide only (ignored if set otherwise). */
  contentType?: "guide";
  /** Default `en`. `zh` uses Chinese prompts + human-signal / quality lists only. */
  language?: "en" | "zh";
  /**
   * Admin draft pipeline: EN path uses 1 attempt, longer timeout, and a long stub body
   * if quality checks fail (avoids rebuild_failed_max_attempts for draft saves).
   */
  draftPipeline?: boolean;
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
  const poolGuide = [
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
  const ix = pickDistinctFaqIndices(4, poolGuide.length, seed);
  return ix.map((i) => ({
    question: poolGuide[i]!.q(),
    answer: poolGuide[i]!.a()
  }));
}

/** 中文兜底问答（仅 language=zh 且模型 FAQ 失败时使用）。 */
function buildFallbackFaqsZh(title: string, cluster: string | undefined, _mode: "guide" | "ideas"): FaqItem[] {
  const t = title.trim().slice(0, 56);
  const c = cluster?.trim();
  const theme = c ? c.slice(0, 40) : "该主题";
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

/** 时间 / 地点 / 人物 / 动作 — 至少命中一类具体场景锚点（与 prompt 一致，缺则重试）。 */
function hasConcreteSceneDetailZh(body: string): boolean {
  return /[0-9]{1,2}\s*[：:点]|周[一二三四五六日天]|昨天|今天|那天|上周|晚上|早上|凌晨|下午|夜里|店里|家里|公司|办公室|路边|直播间|后台|客户|同事|朋友|拍|剪|发|录|写|改|上传|发布/.test(
    body
  );
}

function hasConcreteSceneDetailEn(body: string): boolean {
  return /\b(?:\d{1,2}\s*(?:am|pm)|:\d{2}\b|yesterday|last week|that night|tonight|this morning|at home|at the office|my (?:client|boss|editor|phone)|while (?:filming|editing|uploading|posting)|i (?:filmed|edited|posted|uploaded))\b/i.test(
    body
  );
}

/** 教程式列表：仅当 ≥3 行无序或 ≥3 行有序列表时判失败（单行 1. / - 不拦）。 */
function hasForbiddenListStructure(body: string): boolean {
  let bullet = 0;
  let ordered = 0;
  for (const line of body.split("\n")) {
    const s = line.trim();
    if (/^[-*+]\s+\S/.test(s)) bullet++;
    if (/^\d+\.\s+\S/.test(s)) ordered++;
  }
  return bullet >= 3 || ordered >= 3;
}

const ZH_ABSTRACT_WRAP_RE = /综上所述|总而言之|总的来看|抽象地说|从方法论/;

function zhHasAbstractSummaryTone(body: string): boolean {
  return ZH_ABSTRACT_WRAP_RE.test(body);
}

/** 五段叙事弧（错误→打脸→转变→执行→未完成）：同义句命中即可，不卡唯一字面。 */
function bodyPassesExperienceArcStructure(body: string, lang: "en" | "zh"): boolean {
  if (lang === "zh") {
    const beatThought = /我以为|我原先以为|我一开始以为|我当时以为/.test(body);
    const beatResult = /结果|没想到|结果却是|谁能想到/.test(body);
    const beatLater = /后来我发现|我才发现|后来我才知道|后来才明白|回过头看/.test(body);
    const beatStart = /我开始|我干脆|我转头就|我就先|我就直接|我改成/.test(body);
    const beatStill = /现在还在|到现在还|现在还|还没完|也没彻底好|还在试/.test(body);
    return (
      beatThought && beatResult && beatLater && beatStart && beatStill && hasConcreteSceneDetailZh(body)
    );
  }
  const t = body;
  const beatThought = /\bi thought\b|\bwhat i thought was\b|\bi used to think\b/i.test(t);
  const beatResult =
    /\bwhat happened was\b/i.test(t) ||
    /\bthe result was\b/i.test(t) ||
    /\bit turned out\b/i.test(t) ||
    /\bturned out\b/i.test(t);
  const beatLater =
    /\bthen i realized\b/i.test(t) ||
    /\blater i found\b/i.test(t) ||
    /\bwhat i figured out\b/i.test(t) ||
    /\bi realized\b/i.test(t) ||
    /\bwhat hit me\b/i.test(t);
  const beatStart = /\bi started\b/i.test(t) || /\bi began\b/i.test(t) || /\bi switched to\b/i.test(t);
  const beatStill =
    /\bi'?m still\b/i.test(t) ||
    /\bnow i'?m still\b/i.test(t) ||
    /\bit'?s still\b/i.test(t) ||
    /\bstill figuring\b/i.test(t) ||
    /\bstill not\b/i.test(t) ||
    /\bhaven'?t finished\b/i.test(t);
  return (
    beatThought &&
    beatResult &&
    beatLater &&
    beatStart &&
    beatStill &&
    hasConcreteSceneDetailEn(body)
  );
}

function enHasAbstractSummaryWrap(body: string): boolean {
  return /\b(?:to summarize|in summary|the key takeaway is|in conclusion)\b/i.test(body);
}

function guideBodyPassesQualityChecks(body: string, lang: "en" | "zh" = "en"): boolean {
  if (!bodyPassesExperienceArcStructure(body, lang)) return false;
  if (hasForbiddenListStructure(body)) return false;
  if (lang === "zh" && zhHasAbstractSummaryTone(body)) return false;
  if (lang === "en" && enHasAbstractSummaryWrap(body)) return false;
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

/** Single EN/ZH body prompt for SEO guides (经验复盘型). FAQ uses separate JSON prompts. */
export function buildFreeGuidePrompt(title: string, contextBlock: string, lang: "en" | "zh" = "en"): string {
  const ctxLine =
    lang === "zh"
      ? contextBlock.trim()
        ? `\n\n补充背景（请使用其中的具体细节）：\n${contextBlock.trim().slice(0, 6000)}`
        : ""
      : contextBlock.trim()
        ? `\n\nAdditional context (use concrete details from here):\n${contextBlock.trim().slice(0, 6000)}`
        : "";
  if (lang === "zh") {
    return `
围绕主题写作：「${title}」
${ctxLine}

【体裁｜唯一允许】经验复盘型经历文：第一人称、真事、禁止模板套话与抽象总结。

【强制叙事弧｜正文中必须自然出现以下字面短语（可写在句子里，不要单独当小标题列出来）】
按心理顺序写满五拍——「错误 → 打脸 → 转变 → 执行 → 未完成」：
1) 我以为……
2) 结果……
3) 后来我发现……
4) 我开始……
5) 现在还在……

【具体场景｜必含】至少一处可感的具体细节：时间（如「那天晚上」「上周三」）、地点（如「店里」「剪辑台前」）、人物关系（如「客户」「同事」）或动作（如「拍」「剪」「发」）四者至少其一，写在叙事里，不要单独列清单。

【禁止】总结段、教程式分点、以「-」「*」「1.」开头的 list、抽象总结（如「综上所述」「总而言之」）。不要用首先/其次/最后当段首连接词。

【语言】全文中文。不要夹英文句；不要 A/B/C、Step 编号。

【任务主轴】完成真实任务 / 干掉重复劳动；禁止写成产品说明书或功能列表。

【结构底线】至少 3 个「## 」中文二级标题；正文至少 4 段，段间空一行。

【结尾】落在「还没完 / 还在试 / 仍有问题」式未完成感，禁止收束式方法论总结。

禁止（字面即重试）：本文将；总结来说；可以看出；建议大家；第一步/第二步/第三步；结论（作小结标题）；核心就是；关键在于；记住一点。

输出：Markdown。勿重复同一句（≥22 字）两次。

【质检】若缺上述五拍字面、缺场景细节、或出现列表/总结腔，稿作废并重写。
`.trim();
  }

  return `
Write about: "${title}"
${ctxLine}

GENRE: first-person experience recap (经历文), NOT a tutorial, NOT a listicle, NOT abstract advice.

MANDATORY ARC — include these literal phrases somewhere in the body (in full sentences, not as a labeled outline):
1) I thought …
2) What happened was / The result was / It turned out / Turned out …
3) Then I realized … OR Later I found … OR What I figured out …
4) I started … OR I began …
5) I'm still … OR Now I'm still … OR It's still … (unfinished / in progress)

CONCRETE SCENE (required): at least one anchor with time (e.g. "last Tuesday night"), place (e.g. "at my desk"), a person/role (e.g. "a client"), or a physical action (e.g. "editing", "uploading")—woven into the story, not a bullet list.

FORBIDDEN:
- Wrap-up / summary paragraphs ("In conclusion", "To summarize", tidy takeaway sections)
- Tutorial-style bullets: do NOT use lines starting with "- ", "* ", or "1. " (markdown lists)
- Abstract slogans ("at the end of the day", "the key takeaway is" as a closer)
- Step 1/2/3 scaffolding

TASK-FIRST: reader has a real chore problem; center on fixing the situation, not product specs.

VOICE: messy, honest, uneven paragraphs. End on something still open—not a neat bow.

OUTPUT: Markdown with at least 3 "## " headings tied to this topic. No fluff.

QUALITY BAR: if any mandatory phrase is missing, or there is no concrete scene, or you used list lines—the draft is invalid and must be rewritten.
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

/** Last-resort body for draft pipeline when the model output fails EN quality gates (650+ words, first-person beats). */
function buildEnglishDraftStubBody(title: string): string {
  const paras: string[] = [
    `# ${title}`,
    "",
    "I wrote this because I was tired of advice that sounded right but never survived a real week of publishing.",
    "I thought the issue was motivation. What happened was I didn't have a simple order of operations I could repeat without thinking.",
    "Then I realized I needed one north-star metric and a weekly rhythm that matched my actual energy, not a fantasy calendar.",
    "I started tracking three things: what I shipped, what moved the needle, and what I should stop doing.",
    "I'm still adjusting, but the structure below is what I wish I had on day one."
  ];
  const beat = (n: number) =>
    `In section ${n}, I unpack what I tried, what failed first, and what I changed after I saw the data. I thought I could skip the boring steps. What happened was small misses compounded. Then I realized consistency beats intensity if you can only pick one. I started doing the smallest version that still taught me something. I'm still learning, but the mistakes are cheaper now.`;
  for (let i = 0; i < 12; i++) {
    paras.push(`## Part ${i + 1}: working through the problem`);
    paras.push(beat(i + 1));
    paras.push(
      "I also keep a short list of assumptions I am willing to be wrong about, because most of my wasted time came from defending a plan that wasn't working."
    );
  }
  let text = paras.join("\n\n");
  while (text.split(/\s+/).filter(Boolean).length < 680) {
    text +=
      "\n\nI thought I could ignore this paragraph. What happened was I needed one more concrete example. Then I realized examples are how I remember. I started copying my own notes into the draft. I'm still refining.";
  }
  return text;
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

/**
 * Single strategy: experience-recap guide (markdown) via {@link buildFreeGuidePrompt}.
 */
export async function rebuildToSeoArticle(input: RebuildArticleInput): Promise<RebuildArticleResult> {
  const lang = input.language ?? "en";
  const draftPipeline = input.draftPipeline === true;
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
        const userPrompt = buildFreeGuidePrompt(title, contextBlock, lang);
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

  const MAX_REBUILD_ATTEMPTS = draftPipeline ? 1 : 3;
  const REBUILD_ATTEMPT_TIMEOUT_MS = draftPipeline ? 120000 : 15000;

  let body = "";
  let passesQuality = false;
  let attempts = 0;
  let lastRawSnippet = "";
  while (!passesQuality && attempts < MAX_REBUILD_ATTEMPTS) {
    attempts++;
    console.log(`[rebuild] attempt=${attempts} draftPipeline=${draftPipeline}`);
    const userPrompt = buildFreeGuidePrompt(title, contextBlock, lang);
    if (draftPipeline) {
      console.log(
        "[seo-draft-debug] rebuild prompt preview:",
        userPrompt.slice(0, 1200),
        userPrompt.length > 1200 ? "…" : ""
      );
    }
    try {
      const out = await Promise.race([
        generateWithDeepseek({
          systemPrompt: guideSystemEn,
          userPrompt,
          model,
          maxTokens: 8000,
          temperature: 0.42 + (attempts - 1) * 0.06,
          jsonMode: false
        }),
        new Promise<ProviderGenerateOutput>((_, reject) =>
          setTimeout(() => reject(new Error("rebuild_timeout")), REBUILD_ATTEMPT_TIMEOUT_MS)
        )
      ]);
      const normalized = deepseekProvider.normalizeOutput(out.rawText);
      lastRawSnippet = (out.rawText ?? "").slice(0, 500);
      if (draftPipeline) {
        console.log("[seo-draft-debug] raw AI response head:", lastRawSnippet, "totalChars=", (out.rawText ?? "").length);
      }
      body = stripOuterMarkdownFence(normalized);
      if (draftPipeline) {
        console.log(
          "[seo-draft-debug] after strip fence: word-ish length=",
          body.split(/\s+/).filter(Boolean).length,
          "chars=",
          body.length
        );
      }
      if (!guideBodyPassesQualityChecks(body, lang)) {
        if (draftPipeline) {
          console.log("[seo-draft-debug] guideBodyPassesQualityChecks=false");
        }
        continue;
      }
      if (!hasHumanSignals(body, lang) || isTooClean(body, lang)) {
        console.log("[quality] retry: lacks human signal or too clean");
        if (draftPipeline) {
          console.log("[seo-draft-debug] hasHumanSignals or isTooClean failed");
        }
        throw new Error("low_human_quality");
      }
      passesQuality = true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      const message = err.message;
      if (draftPipeline) {
        console.log("[seo-draft-debug] attempt catch:", err.message);
      }
      const isBalanceError =
        message.includes("HTTP 402") || message.includes("Insufficient Balance");
      if (isBalanceError) {
        console.log("[rebuild] provider quota exhausted, fail-fast");
        throw new Error("rebuild_provider_insufficient_balance");
      }
      if (err.message === "rebuild_timeout") {
        console.log("[rebuild] timeout");
      } else {
        console.error("[rebuild-article] guide markdown attempt failed:", err.message);
      }
      if (attempts >= MAX_REBUILD_ATTEMPTS) {
        if (draftPipeline) {
          console.log("[seo-draft-debug] draftPipeline: not rethrowing on last attempt; will stub if needed");
          break;
        }
        if (err.message !== "rebuild_timeout") {
          throw new Error(`AI generation failed: ${err.message}`);
        }
      }
    }
  }

  if (!passesQuality) {
    if (draftPipeline) {
      console.log("[seo-draft-debug] using English draft stub body (quality not passed)");
      body = buildEnglishDraftStubBody(title);
      passesQuality = true;
    } else {
      console.log("[rebuild] failed after max attempts, skipping article");
      throw new Error("rebuild_failed_max_attempts");
    }
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
