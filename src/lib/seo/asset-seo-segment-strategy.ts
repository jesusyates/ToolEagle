/**
 * V162 — Segment-based strategy (intent, content role, monetization bias).
 * Biases queue / CTA / conversion path; does not override V161 allocation, risk, or safety.
 */

import type { AssetSeoRevenueSummaryArtifact } from "./asset-seo-revenue-summary";
import { normalizeTopicKey } from "./asset-seo-revenue-intelligence";
import { slugPrimaryPrefix } from "./seo-risk-control";

export const SEGMENT_STRATEGY_VERSION = "v162.0";

export type SegmentKey =
  | "seo_discovery"
  | "ai_citation_discovery"
  | "high_intent_tool_entry"
  | "repeat_user_monetization"
  | "emerging_topic_exploration"
  | "balanced_default";

export type ContentRole = "discovery" | "authority" | "conversion" | "exploration";

export type MonetizationRole = "light_touch" | "standard" | "growth";

export type CtaStyle = "minimal" | "standard" | "strong";

export type PageBias = "seo_first" | "citation_first" | "tool_entry_first" | "balanced";

export type SegmentStrategyContext = {
  lane: "zh" | "en";
  topic_key: string;
  id?: string;
  ai_citation_likely?: number;
  ai_answer_quality_score?: number;
  structured_content_ratio?: number;
  ai_citation_dominance_bonus?: number;
  weak_ai_citation_penalty?: number;
  revenue_priority_bonus?: number;
  low_revenue_penalty?: number;
  in_exploration_quota?: boolean;
  risk_deprioritize?: boolean;
  high_revenue_signal?: boolean;
  high_conversion_match?: boolean;
  emerging_citation_topic?: boolean;
};

export type SegmentStrategyResult = {
  segment_key: SegmentKey;
  content_role: ContentRole;
  monetization_role: MonetizationRole;
  recommended_cta_style: CtaStyle;
  recommended_page_bias: PageBias;
  /** Advisory 0.92–1.08; combine with V161, never replace it */
  recommended_allocation_weight: number;
};

export const V162_MIN_ALLOCATION_WEIGHT = 0.92;
export const V162_MAX_ALLOCATION_WEIGHT = 1.08;
export const V162_MAX_SEGMENT_QUEUE_BONUS = 3;
export const V162_MIN_SEGMENT_QUEUE_BONUS = -2;

export function topicMatchesConversionSignals(topicKey: string, summary: AssetSeoRevenueSummaryArtifact | null): boolean {
  if (!summary) return false;
  const t = normalizeTopicKey(topicKey) || topicKey.toLowerCase().trim();
  const topConv = summary.raw?.top_conversion_pages || summary.top_topics_by_conversion_rate || [];
  for (const seg of topConv) {
    const label = String(
      (seg as { topic?: string; segment_key?: string }).topic ?? (seg as { segment_key?: string }).segment_key ?? ""
    );
    const nk = normalizeTopicKey(label) || label.toLowerCase();
    if (nk && (t.includes(nk) || nk.includes(t))) return true;
  }
  return false;
}

function topicMatchesEmergingCitation(topicKey: string, emerging: Set<string>): boolean {
  if (emerging.size === 0) return false;
  const t = normalizeTopicKey(topicKey) || topicKey.toLowerCase().trim();
  for (const e of emerging) {
    const nk = normalizeTopicKey(e) || String(e).toLowerCase().trim();
    if (nk && (t.includes(nk) || nk.includes(t))) return true;
  }
  return false;
}

export function topicMatchesHighRevenue(topicKey: string, summary: AssetSeoRevenueSummaryArtifact | null): boolean {
  if (!summary?.top_topics_by_revenue?.length) return false;
  const t = normalizeTopicKey(topicKey) || topicKey.toLowerCase().trim();
  for (const row of summary.top_topics_by_revenue.slice(0, 12)) {
    const r = row as { topic?: string; segment_key?: string };
    const k = normalizeTopicKey(r.segment_key ?? r.topic ?? "") || "";
    if (k && (t.includes(k) || k.includes(t))) return true;
  }
  return false;
}

/** Traffic / intent segment (priority-ordered rules; explicit taxonomy). */
export function classifyTrafficSegment(ctx: SegmentStrategyContext): SegmentKey {
  const cit = ctx.ai_citation_likely ?? 0;
  const dom = ctx.ai_citation_dominance_bonus ?? 0;
  const weakPen = ctx.weak_ai_citation_penalty ?? 0;
  const revB = ctx.revenue_priority_bonus ?? 0;
  const lowPen = ctx.low_revenue_penalty ?? 0;
  const zh = ctx.lane === "zh";
  const en = ctx.lane === "en";

  if (ctx.risk_deprioritize && zh) {
    return "seo_discovery";
  }
  if (ctx.in_exploration_quota || ctx.emerging_citation_topic) {
    return "emerging_topic_exploration";
  }
  if ((ctx.high_revenue_signal || revB >= 8) && ctx.high_conversion_match) {
    return "repeat_user_monetization";
  }
  if (ctx.high_revenue_signal || revB >= 8 || (en && revB >= 6)) {
    return "high_intent_tool_entry";
  }
  if (cit >= 0.52 && dom > 0 && weakPen === 0) {
    return "ai_citation_discovery";
  }
  if (zh && cit < 0.48 && lowPen === 0) {
    return "seo_discovery";
  }
  return "balanced_default";
}

export function classifyContentRole(traffic: SegmentKey): ContentRole {
  switch (traffic) {
    case "seo_discovery":
      return "discovery";
    case "ai_citation_discovery":
      return "authority";
    case "high_intent_tool_entry":
    case "repeat_user_monetization":
      return "conversion";
    case "emerging_topic_exploration":
      return "exploration";
    default:
      return "discovery";
  }
}

export function classifyMonetizationSegment(traffic: SegmentKey, ctx: SegmentStrategyContext): MonetizationRole {
  if (traffic === "repeat_user_monetization" || traffic === "high_intent_tool_entry") return "growth";
  if (traffic === "seo_discovery" || traffic === "emerging_topic_exploration") return "light_touch";
  if (traffic === "ai_citation_discovery") return "standard";
  if ((ctx.low_revenue_penalty ?? 0) > 0) return "light_touch";
  return "standard";
}

function weightAndBiases(
  traffic: SegmentKey,
  monetization: MonetizationRole
): Pick<SegmentStrategyResult, "recommended_allocation_weight" | "recommended_cta_style" | "recommended_page_bias"> {
  let w = 1;
  let cta: CtaStyle = "standard";
  let page: PageBias = "balanced";

  switch (traffic) {
    case "seo_discovery":
      w = 0.97;
      page = "seo_first";
      cta = "minimal";
      break;
    case "ai_citation_discovery":
      w = 1.04;
      page = "citation_first";
      cta = "standard";
      break;
    case "high_intent_tool_entry":
      w = 1.06;
      page = "tool_entry_first";
      cta = "strong";
      break;
    case "repeat_user_monetization":
      w = 1.07;
      page = "tool_entry_first";
      cta = "strong";
      break;
    case "emerging_topic_exploration":
      w = 1.02;
      page = "balanced";
      cta = "minimal";
      break;
    default:
      w = 1;
      page = "balanced";
      cta = monetization === "growth" ? "strong" : "standard";
  }

  if (monetization === "light_touch") {
    cta = cta === "strong" ? "standard" : "minimal";
    w = Math.min(w, 1.03);
  }
  if (monetization === "growth" && traffic !== "seo_discovery") {
    w = Math.max(w, 1.03);
  }

  w = Math.min(V162_MAX_ALLOCATION_WEIGHT, Math.max(V162_MIN_ALLOCATION_WEIGHT, w));
  return {
    recommended_allocation_weight: Number(w.toFixed(3)),
    recommended_cta_style: cta,
    recommended_page_bias: page
  };
}

export function buildSegmentStrategy(ctx: SegmentStrategyContext): SegmentStrategyResult {
  const segment_key = classifyTrafficSegment(ctx);
  const content_role = classifyContentRole(segment_key);
  const monetization_role = classifyMonetizationSegment(segment_key, ctx);
  const { recommended_allocation_weight, recommended_cta_style, recommended_page_bias } = weightAndBiases(
    segment_key,
    monetization_role
  );
  return {
    segment_key,
    content_role,
    monetization_role,
    recommended_cta_style,
    recommended_page_bias,
    recommended_allocation_weight
  };
}

/** Bounded integer adjustment for publish queue (additive after V161). */
export function segmentStrategyQueueBonus(strat: SegmentStrategyResult): number {
  const delta = (strat.recommended_allocation_weight - 1) * 22;
  return Math.round(Math.max(V162_MIN_SEGMENT_QUEUE_BONUS, Math.min(V162_MAX_SEGMENT_QUEUE_BONUS, delta)));
}

function segmentStrategyCandidatePrefix(c: { id: string; lane: "zh" | "en"; topic_key: string }): string | null {
  if (c.lane === "zh" && c.id.startsWith("zh:")) {
    return slugPrimaryPrefix(c.id.slice(3));
  }
  const slugish = c.topic_key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slugish) return null;
  return slugPrimaryPrefix(slugish);
}

export type SegmentStrategyBuildParams = {
  candidate: { id: string; lane: "zh" | "en"; topic_key: string };
  row: Pick<
    PublishQueueItemLike,
    | "ai_citation_likely"
    | "ai_answer_quality_score"
    | "structured_content_ratio"
    | "ai_citation_dominance_bonus"
    | "weak_ai_citation_penalty"
    | "revenue_priority_bonus"
    | "low_revenue_penalty"
  >;
  revenueSummary: AssetSeoRevenueSummaryArtifact | null;
  explorationQuota: Set<string>;
  riskTopicDeprioritize: Set<string>;
  emergingTopicKeys: Set<string>;
};

/** Minimal row shape for V162 (avoid circular type import). */
export type PublishQueueItemLike = {
  ai_citation_likely: number;
  ai_answer_quality_score: number;
  structured_content_ratio: number;
  ai_citation_dominance_bonus: number;
  weak_ai_citation_penalty: number;
  revenue_priority_bonus: number;
  low_revenue_penalty: number;
};

export function buildSegmentStrategyContextFromQueueRow(p: SegmentStrategyBuildParams): SegmentStrategyContext {
  const pref = segmentStrategyCandidatePrefix(p.candidate);
  const risk_deprioritize = !!(pref && p.riskTopicDeprioritize.has(pref.toLowerCase()));
  const topic = p.candidate.topic_key;
  return {
    lane: p.candidate.lane,
    topic_key: topic,
    id: p.candidate.id,
    ai_citation_likely: p.row.ai_citation_likely,
    ai_answer_quality_score: p.row.ai_answer_quality_score,
    structured_content_ratio: p.row.structured_content_ratio,
    ai_citation_dominance_bonus: p.row.ai_citation_dominance_bonus,
    weak_ai_citation_penalty: p.row.weak_ai_citation_penalty,
    revenue_priority_bonus: p.row.revenue_priority_bonus,
    low_revenue_penalty: p.row.low_revenue_penalty,
    in_exploration_quota: p.explorationQuota.has(topic),
    risk_deprioritize,
    high_revenue_signal: topicMatchesHighRevenue(topic, p.revenueSummary),
    high_conversion_match: topicMatchesConversionSignals(topic, p.revenueSummary),
    emerging_citation_topic: topicMatchesEmergingCitation(topic, p.emergingTopicKeys)
  };
}
