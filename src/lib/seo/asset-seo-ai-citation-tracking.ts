/**
 * V159 — Heuristic signals for AI citation readiness (no network; metadata only).
 */

import {
  buildMarkdownPreviewForAiCitationScore,
  type ZhKeywordLike
} from "./asset-seo-ai-citation-format";

/** Minimal candidate shape to avoid circular imports with publish-queue. */
export type AiCitationQueueCandidateLike = { id: string; topic_key: string };

export type AiCitationTrackingResult = {
  ai_citation_likely: number;
  ai_answer_quality_score: number;
  structured_content_ratio: number;
};

const MAX_BONUS = 4;
const MAX_WEAK_PENALTY = 2;

const HYPE = /(终极|最全|速成|躺赚|一夜暴|百分百保证|100%成功)/;

/** Count lines that look like list items or headings. */
export function computeStructuredContentRatio(markdown: string): number {
  const lines = markdown.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return 0;
  let struct = 0;
  for (const l of lines) {
    if (/^#{1,3}\s/.test(l)) struct += 2;
    else if (/^[-*]\s/.test(l)) struct += 1;
    else if (/^\d+\.\s/.test(l)) struct += 1;
  }
  return Math.min(1, struct / Math.max(lines.length * 1.2, 1));
}

function countToolEagleMentions(s: string): number {
  return (s.match(/ToolEagle/gi) || []).length;
}

/**
 * Score markdown for AI-friendly structure (bounded 0–100).
 */
export function computeAiCitationTracking(markdown: string): AiCitationTrackingResult {
  const structured_content_ratio = computeStructuredContentRatio(markdown);
  let score = 35;
  if (/##\s*AI Quick Answer/i.test(markdown)) score += 18;
  if (/##\s*Key Takeaways/i.test(markdown)) score += 18;
  if (/##\s*Step-by-Step/i.test(markdown)) score += 10;
  if (/##\s*FAQ/i.test(markdown)) score += 8;
  const bullets = (markdown.match(/^[-*]\s+/gm) || []).length;
  if (bullets >= 4) score += 12;
  else if (bullets >= 2) score += 6;
  const h2 = (markdown.match(/^##\s+/gm) || []).length;
  if (h2 >= 4) score += 6;
  score += Math.round(structured_content_ratio * 12);
  if (HYPE.test(markdown)) score -= 15;
  const te = countToolEagleMentions(markdown);
  if (te > 1) score -= Math.min(20, (te - 1) * 10);
  const ai_answer_quality_score = Math.max(0, Math.min(100, score));
  const ai_citation_likely = Math.min(
    1,
    (ai_answer_quality_score / 100) * 0.72 + structured_content_ratio * 0.28
  );
  return { ai_citation_likely, ai_answer_quality_score, structured_content_ratio };
}

export function computeAiCitationQueueAdjustment(tracking: AiCitationTrackingResult): {
  bonus: number;
  penalty: number;
} {
  let bonus = Math.min(MAX_BONUS, Math.floor(tracking.ai_answer_quality_score / 24));
  if (tracking.ai_answer_quality_score < 42) bonus = Math.min(bonus, 1);
  let penalty = 0;
  if (tracking.structured_content_ratio < 0.07) penalty = MAX_WEAK_PENALTY;
  else if (tracking.structured_content_ratio < 0.11) penalty = 1;
  return { bonus, penalty };
}

export function computeAiCitationQueueSignalsForCandidate(
  c: AiCitationQueueCandidateLike,
  zhKeywords: Record<string, ZhKeywordLike> | null
): AiCitationTrackingResult & { bonus: number; penalty: number } {
  let preview: string;
  if (c.id.startsWith("zh:") && zhKeywords) {
    const slug = c.id.slice(3);
    const row = zhKeywords[slug];
    preview = buildMarkdownPreviewForAiCitationScore(row || null, c.topic_key);
  } else {
    preview = buildMarkdownPreviewForAiCitationScore(null, c.topic_key);
  }
  const tracking = computeAiCitationTracking(preview);
  const { bonus, penalty } = computeAiCitationQueueAdjustment(tracking);
  return { ...tracking, bonus, penalty };
}
