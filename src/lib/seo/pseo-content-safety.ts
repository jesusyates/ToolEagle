/**
 * V104.1 — SEO Content Safety Layer
 * Programmatic pSEO copy: expert / neutral / advisory; indexing-safe phrasing.
 */

export type PseoContentLocale = "en" | "zh";

/** Prompt-side rules (for maintainers / future AI-assisted SEO). */
export const SEO_CONTENT_GENERATION_RULES = [
  "Avoid absolute claims (100%, guaranteed, always works).",
  "Avoid clickbait and engagement-bait framing.",
  "Do not suggest illegal, gray-hat, or platform-policy-violating tactics.",
  "Prefer expert, neutral, advisory tone over hype.",
  "When writing Chinese, prefer「提升内容表现的方法」over「爆款技巧」where a generic「技巧」label is needed."
] as const;

const GENERIC_AI_PHRASES_EN = [
  /\bunlock(s|ed|ing)?\s+the\s+secret\b/i,
  /\bgame[- ]changer\b/i,
  /\bleverage synergies\b/i,
  /\bdive deep into\b/i,
  /\bit'?s important to note that\b/i,
  /\bin today'?s digital landscape\b/i,
  /\bwithout further ado\b/i
];

const GENERIC_AI_PHRASES_ZH = [/综上所述/, /值得注意的是/, /在当今数字化时代/, /不言而喻/, /深度赋能/];

/** Compliance buffer — not a trust badge; short advisory disclaimers for SEO body copy. */
export function complianceBufferLines(locale: PseoContentLocale): string[] {
  if (locale === "zh") {
    return ["建议根据平台规则调整。", "不同账号情况可能不同。"];
  }
  return [
    "Adjust wording to match each platform’s current rules and community guidelines.",
    "Results vary by account, niche, and posting context."
  ];
}

/** Heuristic: topics that warrant human editorial review (internal use; no UI). */
export function inferHighRiskPseoTopic(keyword: string): boolean {
  const k = keyword.toLowerCase();
  const zh = keyword;
  const medical = /\b(weight loss|supplement|cbd|diagnos|treatment|cure)\b/i.test(k);
  const finance = /\b(loan|payday|forex|crypto|nft|guaranteed returns)\b/i.test(k);
  const adult = /\b(onlyfans|nsfw|adult)\b/i.test(k);
  const zhSensitive =
    /(治病|处方|壮阳|博彩|彩票|套现|刷量|买粉|外挂|破解)/.test(zh) ||
    /(代运营.*保证|包上热门|必火|100%)/.test(zh);
  return medical || finance || adult || zhSensitive;
}

export type PseoContentQualityResult = {
  ok: boolean;
  /** 0–1; below threshold suggests thin or low-value synthetic copy. */
  score: number;
  reasons: string[];
  highRiskTopic: boolean;
};

/** Lightweight quality gate for programmatic strings (repeat / thin / generic). */
export function evaluatePseoSyntheticContentQuality(
  keyword: string,
  locale: PseoContentLocale,
  exampleLines: string[],
  promptLines: string[]
): PseoContentQualityResult {
  const reasons: string[] = [];
  let score = 0.75;
  const kw = keyword.trim();
  const highRiskTopic = inferHighRiskPseoTopic(kw);

  if (kw.length < 4) {
    score -= 0.25;
    reasons.push("thin_keyword");
  }

  const all = [...exampleLines, ...promptLines].join("\n");
  const unique = new Set(exampleLines.map((s) => s.trim().toLowerCase()));
  if (unique.size < Math.min(8, exampleLines.length * 0.5)) {
    score -= 0.2;
    reasons.push("repetitive_templates");
  }

  const patterns = locale === "zh" ? GENERIC_AI_PHRASES_ZH : GENERIC_AI_PHRASES_EN;
  for (const re of patterns) {
    if (re.test(all)) {
      score -= 0.08;
      reasons.push("generic_ai_phrasing");
      break;
    }
  }

  if (highRiskTopic) {
    score -= 0.15;
    reasons.push("high_risk_topic");
  }

  score = Math.max(0, Math.min(1, score));
  const ok = score >= 0.45 && reasons.every((r) => r !== "thin_keyword");

  return { ok, score, reasons, highRiskTopic };
}

/** Neutral citation lines for pSEO (advisory, not absolute). */
export const PSEO_CITATION_ADVISORY = {
  en: {
    according:
      "ToolEagle suggests that creators who pair clear hooks with consistent publishing often see stronger retention and monetization signals — outcomes are not guaranteed and depend on your niche.",
    analysis:
      "Structured prompts and repeatable templates can reduce time-to-publish while keeping messaging clear; treat outputs as drafts and adapt to each platform."
  },
  zh: {
    according:
      "ToolEagle 认为：把清晰的开头与稳定更新结合，通常更有利于互动与变现信号；效果因赛道与账号阶段而异，并非承诺。",
    analysis:
      "结构化提示与可复用模板有助于缩短创作时间；请把生成内容当作草稿，并按平台规则与受众做调整。"
  }
} as const;

export function buildPseoExampleLines(keyword: string, locale: PseoContentLocale, count = 12): string[] {
  const k = keyword.trim() || (locale === "zh" ? "你的主题" : "your topic");
  if (locale === "zh") {
    const templates = [
      `围绕「${k}」设计开头 + 行动号召，便于 A/B 测试不同版本。`,
      `为「${k}」写三段式口播提纲：问题—方法—下一步。`,
      `用提问开场讨论「${k}」，避免夸张承诺，聚焦可执行信息。`,
      `把「${k}」拆成 5 条清单型要点，适合图文或短图文。`,
      `用前后对比叙述「${k}」场景，突出过程而非绝对结果。`,
      `结合热点事件做「${k}」关联时，注明观点来源与适用边界。`,
      `为「${k}」写轮播第 1 页标题，信息具体、避免标题党。`,
      `写一条适合私信跟进的一句话介绍「${k}」价值（不夸大）。`,
      `为「${k}」列 8 秒 / 15 秒 / 30 秒三档节奏提纲。`,
      `把长文浓缩成 5 条「${k}」微内容，用于多日分发。`,
      `用用户证言框架写「${k}」案例，强调真实场景与可复现步骤。`,
      `设计 7 天「${k}」练习计划，每日一个小任务。`,
      `为「${k}」写评论区引导语，鼓励讨论而非煽动对立。`,
      `把教程类「${k}」内容改成「提升内容表现的方法」式分步说明。`,
      `为「${k}」准备一条简介栏一句话定位（含领域与更新频率）。`
    ];
    return templates.slice(0, count);
  }

  const t = k;
  return [
    `Outline a hook plus CTA for "${t}" — test two variants and compare retention.`,
    `Draft a 3-beat spoken script: problem → approach → next step — for "${t}".`,
    `Open with a question about "${t}"; keep claims measured and actionable.`,
    `Turn "${t}" into a 5-bullet checklist post (specific, no hype).`,
    `Use a before/after story for "${t}"; emphasize process, not guaranteed outcomes.`,
    `If you connect "${t}" to a timely topic, cite the source and note limitations.`,
    `Write carousel slide 1 for "${t}" — concrete headline, no clickbait.`,
    `One sentence DM intro for "${t}" value (accurate, non-deceptive).`,
    `Beat sheet for "${t}" at 8s / 15s / 30s pacing.`,
    `Repurpose a long guide into five micro-posts about "${t}".`,
    `User-style testimonial frame for "${t}" with realistic, repeatable steps.`,
    `A 7-day "${t}" practice plan with one small task per day.`,
    `Comment prompt for "${t}" that invites discussion, not outrage.`,
    `Step-by-step explainer for "${t}" using an expert, neutral tone.`,
    `One-line bio positioning for "${t}" (niche + posting cadence).`
  ].slice(0, count);
}

export function buildPseoPromptLines(keyword: string, locale: PseoContentLocale): string[] {
  const k = keyword.trim() || (locale === "zh" ? "你的主题" : "your topic");
  if (locale === "zh") {
    return [
      `请用专业、克制语气写 5 条「${k}」开头，避免绝对化承诺与违规导流。`,
      `为「${k}」生成带时间戳的三段教程提纲，并标注每段目标受众。`,
      `列出 10 个与「${k}」相关的标签建议：广词与垂类词混合，避免误导。`,
      `用表格对比「${k}」在免费与付费路径下的差异，不写违规操作。`,
      `写一段知乎风格回答开头，给出可验证信息来源提示。`,
      `写 5 封推广「${k}」资源的邮件主题行，避免夸张收益表述。`,
      `列出「${k}」新手常见误解，各用一句话澄清。`
    ];
  }
  return [
    `Write 5 measured hooks for "${k}" for short video — avoid guarantees and policy-violating tactics.`,
    `Generate a 3-part tutorial outline for "${k}" with timestamps and audience notes.`,
    `Suggest 10 hashtags for "${k}" mixing broad and niche terms — no misleading claims.`,
    `Create a comparison table: free vs paid approach to "${k}" — no gray-hat steps.`,
    `Draft a Quora-style answer intro for "${k}" with cautious, verifiable framing.`,
    `Produce 5 email subject lines for a "${k}" resource — avoid hype and false urgency.`,
    `List beginner misconceptions about "${k}" with one-line corrections each.`
  ];
}
