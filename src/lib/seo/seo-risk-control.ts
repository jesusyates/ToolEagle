/**
 * V156 — Search / publishing risk control (signals → score → slowdown guidance).
 *
 * Risk score 0–100 (higher = riskier). Formula:
 *   risk_score = round( min(100,
 *     28 * volume_spike
 *   + 26 * topic_concentration
 *   + 16 * page_type_concentration
 *   + 18 * slug_pattern_risk
 *   + 12 * template_similarity_risk
 *   ) )
 *
 * Each signal is a strength in [0, 1].
 */

export type PublishingRiskContext = {
  /** Most recent day first: counts of new/changed pages that day (ZH+EN proxy). */
  dailyNewCounts: number[];
  /** Primary topic key (e.g. platform-goal) → count among recent slugs. */
  topicPrimaryCounts: Record<string, number>;
  /** Coarse page buckets. */
  pageTypeCounts: Record<string, number>;
  /** Recent slug sample (newest last or first, analyzer normalizes). */
  slugs: string[];
  /** Title or h1 samples for template-ish repetition. */
  titleSamples: string[];
};

export type SearchRiskSignals = {
  volume_spike: number;
  topic_concentration: number;
  page_type_concentration: number;
  slug_pattern_risk: number;
  template_similarity_risk: number;
};

export type SearchRiskLevel = "low" | "medium" | "high";

export type SearchRiskRecommendedAction =
  | "none"
  | "slowdown"
  | "diversify"
  | "protective_safe_mode";

export type SearchRiskAnalysis = {
  risk_score: number;
  risk_level: SearchRiskLevel;
  signals: SearchRiskSignals;
  recommended_action: SearchRiskRecommendedAction;
  /** Multiply orchestrator batch overrides (0.35–1). */
  batch_multiplier: number;
  /** >1 makes retrieval-rewrite easier (threshold relax). */
  retrieval_ease_multiplier: number;
  affected_topics: string[];
  affected_page_types: string[];
  notes: string[];
};

const WEIGHTS = {
  volume_spike: 28,
  topic_concentration: 26,
  page_type_concentration: 16,
  slug_pattern_risk: 18,
  template_similarity_risk: 12
} as const;

/** Herfindahl–Hirschman on shares; returns [0,1] concentration. */
export function herfindahlConcentration(counts: Record<string, number>): number {
  const vals = Object.values(counts).filter((n) => n > 0);
  const t = vals.reduce((a, b) => a + b, 0);
  if (t <= 0) return 0;
  let h = 0;
  for (const v of vals) {
    const p = v / t;
    h += p * p;
  }
  // Normalize: uniform n buckets → 1/n; map to 0..1 where 1 = max skew single bucket
  const n = vals.length;
  if (n <= 1) return 1;
  const hMin = 1 / n;
  const hMax = 1;
  if (hMax - hMin < 1e-9) return 0;
  return Math.max(0, Math.min(1, (h - hMin) / (hMax - hMin)));
}

export function detectVolumeSpike(context: PublishingRiskContext): number {
  const d = context.dailyNewCounts.filter((x) => Number.isFinite(x) && x >= 0);
  if (d.length < 4) return 0;
  const recent2 = d.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
  const rest = d.slice(2, 7);
  if (rest.length === 0) return 0;
  const base = rest.reduce((a, b) => a + b, 0) / rest.length;
  if (base < 1) {
    if (recent2 >= 8) return 0.6;
    return 0;
  }
  const ratio = recent2 / base;
  if (ratio >= 3) return 1;
  if (ratio >= 2.2) return 0.75;
  if (ratio >= 1.6) return 0.45;
  return 0;
}

export function detectTopicConcentration(context: PublishingRiskContext): number {
  const h = herfindahlConcentration(context.topicPrimaryCounts);
  if (h >= 0.85) return 1;
  if (h >= 0.65) return 0.7;
  if (h >= 0.45) return 0.4;
  return 0;
}

export function detectPageTypeConcentration(context: PublishingRiskContext): number {
  const vals = Object.values(context.pageTypeCounts).filter((x) => x > 0);
  const t = vals.reduce((a, b) => a + b, 0);
  if (t <= 0) return 0;
  const maxShare = Math.max(...vals.map((v) => v / t));
  if (maxShare >= 0.92) return 1;
  if (maxShare >= 0.82) return 0.65;
  if (maxShare >= 0.72) return 0.35;
  return 0;
}

/** First two hyphen segments as cluster (e.g. tiktok-zhangfen). */
export function slugPrimaryPrefix(slug: string): string {
  const parts = String(slug).toLowerCase().split("-").filter(Boolean);
  if (parts.length < 2) return parts[0] || "unknown";
  return `${parts[0]}-${parts[1]}`;
}

export function detectSlugPatternRisk(context: PublishingRiskContext): number {
  const slugs = context.slugs.slice(-400);
  if (slugs.length < 12) return 0;
  const map: Record<string, number> = {};
  for (const s of slugs) {
    const k = slugPrimaryPrefix(s);
    map[k] = (map[k] || 0) + 1;
  }
  const t = slugs.length;
  const max = Math.max(...Object.values(map));
  const share = max / t;
  if (share >= 0.55) return 1;
  if (share >= 0.42) return 0.7;
  if (share >= 0.32) return 0.45;
  return 0;
}

const TEMPLATE_PHRASES = ["终极指南", "完整指南", "最全", "必看", "2026年", "从0到1", "新手必看"];

export function detectTemplateSimilarityRisk(context: PublishingRiskContext): number {
  const titles = context.titleSamples.filter(Boolean).slice(-200);
  if (titles.length < 8) return 0;
  let hit = 0;
  for (const t of titles) {
    if (TEMPLATE_PHRASES.some((p) => t.includes(p))) hit++;
  }
  const r = hit / titles.length;
  if (r >= 0.45) return 1;
  if (r >= 0.32) return 0.65;
  if (r >= 0.22) return 0.35;
  return 0;
}

export function topAffectedTopics(topicPrimaryCounts: Record<string, number>, limit = 8): string[] {
  return Object.entries(topicPrimaryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

export function topAffectedPageTypes(pageTypeCounts: Record<string, number>): string[] {
  return Object.entries(pageTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

export function computeRiskScore(signals: SearchRiskSignals): number {
  const raw =
    WEIGHTS.volume_spike * signals.volume_spike +
    WEIGHTS.topic_concentration * signals.topic_concentration +
    WEIGHTS.page_type_concentration * signals.page_type_concentration +
    WEIGHTS.slug_pattern_risk * signals.slug_pattern_risk +
    WEIGHTS.template_similarity_risk * signals.template_similarity_risk;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function riskLevelFromScore(score: number): SearchRiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function slowdownRecommendation(score: number, level: SearchRiskLevel): SearchRiskRecommendedAction {
  if (score >= 82) return "protective_safe_mode";
  if (score >= 62) return "diversify";
  if (score >= 40) return "slowdown";
  return "none";
}

export function batchMultiplierForRisk(action: SearchRiskRecommendedAction, level: SearchRiskLevel): number {
  if (action === "protective_safe_mode") return 0.42;
  if (action === "diversify") return level === "high" ? 0.55 : 0.68;
  if (action === "slowdown") return 0.82;
  return 1;
}

export function retrievalEaseForRisk(action: SearchRiskRecommendedAction, level: SearchRiskLevel): number {
  if (action === "protective_safe_mode") return 1.22;
  if (action === "diversify") return 1.12;
  if (action === "slowdown") return 1.05;
  return 1;
}

export function analyzePublishingRisk(context: PublishingRiskContext): SearchRiskAnalysis {
  const volume_spike = detectVolumeSpike(context);
  const topic_concentration = detectTopicConcentration(context);
  const page_type_concentration = detectPageTypeConcentration(context);
  const slug_pattern_risk = detectSlugPatternRisk(context);
  const template_similarity_risk = detectTemplateSimilarityRisk(context);

  const signals: SearchRiskSignals = {
    volume_spike,
    topic_concentration,
    page_type_concentration,
    slug_pattern_risk,
    template_similarity_risk
  };

  const risk_score = computeRiskScore(signals);
  const risk_level = riskLevelFromScore(risk_score);
  const recommended_action = slowdownRecommendation(risk_score, risk_level);
  const batch_multiplier = batchMultiplierForRisk(recommended_action, risk_level);
  const retrieval_ease_multiplier = retrievalEaseForRisk(recommended_action, risk_level);

  const affected_topics = topAffectedTopics(context.topicPrimaryCounts);
  const affected_page_types = topAffectedPageTypes(context.pageTypeCounts);

  const notes: string[] = [];
  if (volume_spike >= 0.45) notes.push("volume_spike");
  if (topic_concentration >= 0.45) notes.push("topic_concentration");
  if (page_type_concentration >= 0.35) notes.push("page_type_skew");
  if (slug_pattern_risk >= 0.45) notes.push("slug_cluster_skew");
  if (template_similarity_risk >= 0.35) notes.push("title_template_echo");

  return {
    risk_score,
    risk_level,
    signals,
    recommended_action,
    batch_multiplier,
    retrieval_ease_multiplier,
    affected_topics,
    affected_page_types,
    notes
  };
}
