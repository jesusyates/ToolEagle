/**
 * V171 / V171.2 — Pure evaluation for SEO surfaces (build script + tests).
 * V171.2: hard suppression triad only for thin/placeholder surfaces (no link_pool_soft).
 */

import type { AnswerTemplate } from "@/config/answers-templates";
import {
  V171_ACTIONABLE_MARKERS,
  V171_HARD_THIN_TOPIC_EXAMPLE_AVG_CHARS,
  V171_MIN_ANSWER_BODY_WORDS,
  V171_MIN_ANSWER_EXAMPLES,
  V171_MIN_ANSWER_TIPS,
  V171_MIN_IDEAS_HUB_BODY_CHARS,
  V171_MIN_PROGRAMMATIC_BODY_CHARS,
  V171_MIN_PROGRAMMATIC_EXAMPLES,
  V171_MIN_TOPIC_EXAMPLE_AVG_CHARS,
  V171_MIN_TOPIC_EXAMPLES,
  V171_NO_EXAMPLES_YET,
  V171_NUMBERED_TIP,
  V171_PLACEHOLDER_MARKERS,
  V171_THIN_ANSWER_MAX_WORDS
} from "@/config/content-quality-v171";

/** V171.2 — all three must be applied together when any hard-thin rule fires. */
export type V171QualityAction = "exclude_sitemap" | "noindex" | "internal_link_exclude";

export type V171PageQuality = {
  path: string;
  pageType: string;
  signals: string[];
  score: number;
  actions: V171QualityAction[];
};

const HARD: V171QualityAction[] = ["exclude_sitemap", "noindex", "internal_link_exclude"];

function applyHard(actions: V171QualityAction[]) {
  for (const a of HARD) {
    if (!actions.includes(a)) actions.push(a);
  }
}

function wordCount(s: string): number {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function duplicateNumberedTips(tips: string[]): boolean {
  const nums = tips.map((t) => (V171_NUMBERED_TIP.exec(t)?.[0] ?? "").trim()).filter(Boolean);
  const set = new Set(nums);
  return nums.length >= 2 && set.size < nums.length;
}

function combinedHasPlaceholder(parts: string[]): boolean {
  return V171_PLACEHOLDER_MARKERS.test(parts.join("\n"));
}

function combinedHasNoExamplesYet(parts: string[]): boolean {
  return V171_NO_EXAMPLES_YET.test(parts.join("\n"));
}

export function evaluateIdeasTopicPage(
  category: string,
  topic: string,
  examples: string[]
): Omit<V171PageQuality, "path"> & { path: string } {
  const path = `/ideas/${category}/${topic}`;
  const signals: string[] = [];
  const actions: V171QualityAction[] = [];
  let score = 100;

  const nonEmpty = examples.map((e) => String(e).trim()).filter(Boolean);
  const blob = [...nonEmpty].join("\n");

  if (combinedHasPlaceholder([blob])) {
    signals.push("placeholder_like");
    score -= 50;
    applyHard(actions);
  }

  if (combinedHasNoExamplesYet([blob])) {
    signals.push("no_examples_copy");
    score -= 50;
    applyHard(actions);
  }

  if (nonEmpty.length < V171_MIN_TOPIC_EXAMPLES) {
    signals.push("too_few_examples");
    score -= 40;
    applyHard(actions);
  }

  const avgLen =
    nonEmpty.length === 0 ? 0 : nonEmpty.reduce((a, t) => a + t.length, 0) / nonEmpty.length;
  if (nonEmpty.length > 0 && avgLen < V171_MIN_TOPIC_EXAMPLE_AVG_CHARS) {
    signals.push("shallow_example_text");
    score -= 25;
  }
  if (nonEmpty.length > 0 && avgLen < V171_HARD_THIN_TOPIC_EXAMPLE_AVG_CHARS) {
    signals.push("very_shallow_examples");
    score -= 20;
    applyHard(actions);
  }

  const totalChars = blob.length;
  if (totalChars > 0 && totalChars < V171_MIN_PROGRAMMATIC_BODY_CHARS) {
    signals.push("thin_topic_body");
    score -= 30;
    applyHard(actions);
  }

  return { path, pageType: "ideas_topic", signals, score: Math.max(0, score), actions: uniqueActions(actions) };
}

export function evaluateAnswerTemplatePage(page: AnswerTemplate): Omit<V171PageQuality, "path"> & { path: string } {
  const path = `/answers/${page.slug}`;
  const signals: string[] = [];
  const actions: V171QualityAction[] = [];
  let score = 100;

  const combined = [
    page.shortAnswer,
    page.tldr,
    ...(page.tips || []),
    ...(page.examples || []),
    ...(page.quickTips || []),
    ...(page.faq || []).flatMap((f) => [f.question, f.answer])
  ];

  const joined = combined.join("\n");

  if (combinedHasPlaceholder(combined)) {
    signals.push("placeholder_like");
    score -= 50;
    applyHard(actions);
  }

  if (combinedHasNoExamplesYet(combined)) {
    signals.push("no_examples_copy");
    score -= 50;
    applyHard(actions);
  }

  const wc =
    wordCount(page.shortAnswer) +
    wordCount(page.tldr) +
    (page.tips || []).reduce((a, t) => a + wordCount(t), 0) +
    (page.examples || []).reduce((a, t) => a + wordCount(t), 0);

  if (wc < V171_THIN_ANSWER_MAX_WORDS) {
    signals.push("thin_answer_body");
    score -= 45;
    applyHard(actions);
  } else if (wc < V171_MIN_ANSWER_BODY_WORDS) {
    signals.push("below_quality_floor");
    score -= 22;
  }

  if (joined.length < V171_MIN_PROGRAMMATIC_BODY_CHARS && wc < V171_MIN_ANSWER_BODY_WORDS) {
    signals.push("thin_answer_chars");
    score -= 25;
    applyHard(actions);
  } else if (joined.length < V171_MIN_PROGRAMMATIC_BODY_CHARS) {
    signals.push("thin_answer_chars");
    score -= 15;
  }

  const ex = (page.examples || []).filter((e) => String(e).trim().length >= 10);
  if (ex.length < V171_MIN_ANSWER_EXAMPLES) {
    signals.push("insufficient_examples");
    score -= 20;
    if (wc < V171_MIN_ANSWER_BODY_WORDS) {
      applyHard(actions);
    }
  }

  if ((page.tips || []).length < V171_MIN_ANSWER_TIPS) {
    signals.push("too_few_tips");
    score -= 12;
  }

  if (!V171_ACTIONABLE_MARKERS.test(joined)) {
    signals.push("missing_actionable_method");
    score -= 10;
  }

  if (duplicateNumberedTips(page.tips || [])) {
    signals.push("duplicate_or_broken_numbering");
    score -= 8;
  }

  return { path, pageType: "answer", signals, score: Math.max(0, score), actions: uniqueActions(actions) };
}

export function evaluateProgrammaticListPage(
  path: string,
  pageType: string,
  examples: string[],
  bodyParts: string[]
): V171PageQuality {
  const signals: string[] = [];
  const actions: V171QualityAction[] = [];
  let score = 100;

  const nonEmpty = examples.map((e) => String(e).trim()).filter(Boolean);
  const blob = [...nonEmpty, ...bodyParts.map((b) => String(b).trim())].join("\n");

  if (combinedHasPlaceholder([blob])) {
    signals.push("placeholder_like");
    score -= 50;
    applyHard(actions);
  }

  if (combinedHasNoExamplesYet([blob])) {
    signals.push("no_examples_copy");
    score -= 50;
    applyHard(actions);
  }

  if (nonEmpty.length < V171_MIN_PROGRAMMATIC_EXAMPLES) {
    signals.push("too_few_examples");
    score -= 40;
    applyHard(actions);
  }

  if (blob.length < V171_MIN_PROGRAMMATIC_BODY_CHARS) {
    signals.push("thin_body");
    score -= 35;
    applyHard(actions);
  }

  return { path, pageType, signals, score: Math.max(0, score), actions: uniqueActions(actions) };
}

function uniqueActions(a: V171QualityAction[]): V171QualityAction[] {
  return [...new Set(a)];
}

export function evaluateIdeasTopicHubPage(slug: string, title: string, intro: string): V171PageQuality {
  const path = `/ideas/${slug}`;
  const signals: string[] = [];
  const actions: V171QualityAction[] = [];
  let score = 100;
  const blob = `${title}\n${intro}`;

  if (combinedHasPlaceholder([blob])) {
    signals.push("placeholder_like");
    score -= 50;
    applyHard(actions);
  }
  if (combinedHasNoExamplesYet([blob])) {
    signals.push("no_examples_copy");
    score -= 50;
    applyHard(actions);
  }
  if (blob.trim().length < V171_MIN_IDEAS_HUB_BODY_CHARS) {
    signals.push("thin_ideas_hub");
    score -= 40;
    applyHard(actions);
  }

  return { path, pageType: "ideas_topic_hub", signals, score: Math.max(0, score), actions: uniqueActions(actions) };
}
