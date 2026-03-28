/**
 * V160 / V160.1 — Aggregate AI citation readiness from queue/page signals (no external APIs).
 */

import { normalizeTopicKey } from "./asset-seo-revenue-intelligence";

export type AiCitationMetricRow = {
  topic_key: string;
  page_type: string;
  workflow_id: string;
  lane: string;
  ai_citation_likely: number;
  ai_answer_quality_score: number;
  structured_content_ratio: number;
};

/** V160.1 — raw composite + confidence-weighted adjusted score for ranking. */
export type CitationPerfBucket = {
  n: number;
  mean_ai_citation_likely: number;
  mean_ai_answer_quality_score: number;
  mean_structured_content_ratio: number;
  /** Raw 0–100 blend (same as pre-V160.1 composite) */
  composite: number;
  /** min(1, n / min_samples_*) for this dimension */
  confidence_weight: number;
  /** composite * confidence_weight — used so tiny n cannot win rankings */
  adjusted_composite: number;
};

export type AiCitationMinSampleThresholds = {
  min_samples_topic: number;
  min_samples_page_type: number;
  min_samples_workflow: number;
};

export const DEFAULT_CITATION_MIN_SAMPLES: AiCitationMinSampleThresholds = {
  /** Topic-level dominance / queue bonus requires at least this many queue rows per topic key */
  min_samples_topic: 3,
  /** Page-type cohort bonus leader must have aggregate count ≥ this */
  min_samples_page_type: 12,
  /** Workflow cohort bonus leader must have aggregate count ≥ this */
  min_samples_workflow: 25
};

export type AiCitationAggregateResult = {
  overall_ai_citation_score: number;
  topic_performance: Record<string, CitationPerfBucket & { topic_key: string }>;
  page_type_performance: Record<string, CitationPerfBucket & { page_type: string }>;
  workflow_performance: Record<string, CitationPerfBucket & { workflow_id: string }>;
  /** Established only: n ≥ min_samples_topic, ranked by adjusted_composite */
  top_ai_citable_topics: string[];
  /** Low-n but high raw composite — visible, not used for full queue bonus */
  emerging_ai_citable_topics: string[];
  weak_ai_citable_topics: string[];
  /** Leaders with sufficient sample for stacking bonuses */
  top_ai_citable_page_types: string[];
  top_ai_citable_workflows: string[];
  bonus_eligible_page_type: string | null;
  bonus_eligible_workflow: string | null;
  row_count: number;
  min_sample_thresholds: AiCitationMinSampleThresholds;
  confidence_weight_notes: string[];
};

export const V160_MIN_ROWS = 8;
export const V160_TOPIC_TOP_N = 12;
export const V160_TOPIC_EMERGING_N = 15;
export const V160_TOPIC_WEAK_N = 12;
export const V160_MAX_DOMINANCE_BONUS = 8;
export const V160_MAX_WEAK_AI_PENALTY = 4;
/** Pages at/above this quality count toward citation_ready_rate */
export const CITATION_READY_QUALITY_THRESHOLD = 52;

export function citationConfidenceWeight(n: number, minSamples: number): number {
  if (n <= 0 || minSamples <= 0) return 0;
  return Math.min(1, n / minSamples);
}

function mean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function compositeScore(likely: number, quality: number, structured: number): number {
  return Math.round(likely * 28 + quality * 0.62 + structured * 100 * 0.1);
}

function accumulate(
  target: Map<string, { likely: number[]; quality: number[]; structured: number[]; label: string; labelKey: "topic_key" | "page_type" | "workflow_id" }>,
  key: string,
  label: string,
  labelKey: "topic_key" | "page_type" | "workflow_id",
  row: AiCitationMetricRow
) {
  if (!target.has(key)) {
    target.set(key, { likely: [], quality: [], structured: [], label, labelKey });
  }
  const b = target.get(key)!;
  b.likely.push(row.ai_citation_likely);
  b.quality.push(row.ai_answer_quality_score);
  b.structured.push(row.structured_content_ratio);
}

function finalizeTopicPerf(
  b: { likely: number[]; quality: number[]; structured: number[]; label: string },
  thresholds: AiCitationMinSampleThresholds
): CitationPerfBucket & { topic_key: string } {
  const meanLikely = mean(b.likely);
  const meanQuality = mean(b.quality);
  const meanStructured = mean(b.structured);
  const comp = compositeScore(meanLikely, meanQuality, meanStructured);
  const n = b.likely.length;
  const w = citationConfidenceWeight(n, thresholds.min_samples_topic);
  return {
    topic_key: b.label,
    n,
    mean_ai_citation_likely: Number(meanLikely.toFixed(4)),
    mean_ai_answer_quality_score: Number(meanQuality.toFixed(2)),
    mean_structured_content_ratio: Number(meanStructured.toFixed(4)),
    composite: comp,
    confidence_weight: Number(w.toFixed(4)),
    adjusted_composite: Math.round(comp * w)
  };
}

function finalizePageTypePerf(
  b: { likely: number[]; quality: number[]; structured: number[]; label: string },
  thresholds: AiCitationMinSampleThresholds
): CitationPerfBucket & { page_type: string } {
  const meanLikely = mean(b.likely);
  const meanQuality = mean(b.quality);
  const meanStructured = mean(b.structured);
  const comp = compositeScore(meanLikely, meanQuality, meanStructured);
  const n = b.likely.length;
  const w = citationConfidenceWeight(n, thresholds.min_samples_page_type);
  return {
    page_type: b.label,
    n,
    mean_ai_citation_likely: Number(meanLikely.toFixed(4)),
    mean_ai_answer_quality_score: Number(meanQuality.toFixed(2)),
    mean_structured_content_ratio: Number(meanStructured.toFixed(4)),
    composite: comp,
    confidence_weight: Number(w.toFixed(4)),
    adjusted_composite: Math.round(comp * w)
  };
}

function finalizeWorkflowPerf(
  b: { likely: number[]; quality: number[]; structured: number[]; label: string },
  thresholds: AiCitationMinSampleThresholds
): CitationPerfBucket & { workflow_id: string } {
  const meanLikely = mean(b.likely);
  const meanQuality = mean(b.quality);
  const meanStructured = mean(b.structured);
  const comp = compositeScore(meanLikely, meanQuality, meanStructured);
  const n = b.likely.length;
  const w = citationConfidenceWeight(n, thresholds.min_samples_workflow);
  return {
    workflow_id: b.label,
    n,
    mean_ai_citation_likely: Number(meanLikely.toFixed(4)),
    mean_ai_answer_quality_score: Number(meanQuality.toFixed(2)),
    mean_structured_content_ratio: Number(meanStructured.toFixed(4)),
    composite: comp,
    confidence_weight: Number(w.toFixed(4)),
    adjusted_composite: Math.round(comp * w)
  };
}

/** Infer page type / workflow from publish-queue id (V159 signals already on row). */
export function metricRowFromPublishQueueItem(item: {
  topic_key: string;
  lane: "zh" | "en";
  id: string;
  ai_citation_likely: number;
  ai_answer_quality_score: number;
  structured_content_ratio: number;
}): AiCitationMetricRow {
  const page_type = item.lane === "zh" ? "zh_search" : "en_topic_registry";
  let workflow_id = "unknown";
  if (item.lane === "zh" && item.id.startsWith("zh:")) {
    const slug = item.id.slice(3);
    const m = slug.match(/^v63-(tiktok|youtube|instagram)-/i);
    if (m) workflow_id = m[1].toLowerCase();
    else {
      const head = slug.split("-")[0];
      workflow_id = head && head.length <= 24 ? head : "zh_general";
    }
  } else if (item.lane === "en") {
    workflow_id = "en_topic_registry";
  }
  return {
    topic_key: item.topic_key,
    page_type,
    workflow_id,
    lane: item.lane,
    ai_citation_likely: Number(item.ai_citation_likely ?? 0),
    ai_answer_quality_score: Number(item.ai_answer_quality_score ?? 0),
    structured_content_ratio: Number(item.structured_content_ratio ?? 0)
  };
}

export function computeTopicAiCitationPerformance(
  rows: AiCitationMetricRow[],
  thresholds: AiCitationMinSampleThresholds = DEFAULT_CITATION_MIN_SAMPLES
): Record<string, CitationPerfBucket & { topic_key: string }> {
  const map = new Map<
    string,
    { likely: number[]; quality: number[]; structured: number[]; label: string; labelKey: "topic_key" | "page_type" | "workflow_id" }
  >();
  for (const r of rows) {
    const k = normalizeTopicKey(r.topic_key) || r.topic_key.toLowerCase().trim();
    accumulate(map, k, k, "topic_key", r);
  }
  const out: Record<string, CitationPerfBucket & { topic_key: string }> = {};
  for (const [k, b] of map) {
    out[k] = finalizeTopicPerf(b, thresholds);
  }
  return out;
}

export function computePageTypeAiCitationPerformance(
  rows: AiCitationMetricRow[],
  thresholds: AiCitationMinSampleThresholds = DEFAULT_CITATION_MIN_SAMPLES
): Record<string, CitationPerfBucket & { page_type: string }> {
  const map = new Map<
    string,
    { likely: number[]; quality: number[]; structured: number[]; label: string; labelKey: "topic_key" | "page_type" | "workflow_id" }
  >();
  for (const r of rows) {
    accumulate(map, r.page_type, r.page_type, "page_type", r);
  }
  const out: Record<string, CitationPerfBucket & { page_type: string }> = {};
  for (const [k, b] of map) {
    out[k] = finalizePageTypePerf(b, thresholds);
  }
  return out;
}

export function computeWorkflowAiCitationPerformance(
  rows: AiCitationMetricRow[],
  thresholds: AiCitationMinSampleThresholds = DEFAULT_CITATION_MIN_SAMPLES
): Record<string, CitationPerfBucket & { workflow_id: string }> {
  const map = new Map<
    string,
    { likely: number[]; quality: number[]; structured: number[]; label: string; labelKey: "topic_key" | "page_type" | "workflow_id" }
  >();
  for (const r of rows) {
    accumulate(map, r.workflow_id, r.workflow_id, "workflow_id", r);
  }
  const out: Record<string, CitationPerfBucket & { workflow_id: string }> = {};
  for (const [k, b] of map) {
    out[k] = finalizeWorkflowPerf(b, thresholds);
  }
  return out;
}

const CONFIDENCE_NOTES = [
  "confidence_weight = min(1, n / min_samples_*) per dimension (topic / page_type / workflow)",
  "adjusted_composite = round(composite * confidence_weight); rankings use adjusted_composite so n=1 cannot lead",
  "top_ai_citable_topics = topics with n >= min_samples_topic, sorted by adjusted_composite",
  "emerging_ai_citable_topics = topics with n < min_samples_topic, sorted by raw composite (promising, reduced queue bonus)"
];

/**
 * Full aggregation: topic / page_type / workflow performance + established vs emerging lists.
 */
export function aggregateAiCitationMetrics(
  rows: AiCitationMetricRow[],
  thresholds: AiCitationMinSampleThresholds = DEFAULT_CITATION_MIN_SAMPLES
): AiCitationAggregateResult {
  const topic_performance = computeTopicAiCitationPerformance(rows, thresholds);
  const page_type_performance = computePageTypeAiCitationPerformance(rows, thresholds);
  const workflow_performance = computeWorkflowAiCitationPerformance(rows, thresholds);

  const overall_ai_citation_score =
    rows.length === 0
      ? 0
      : Math.round(
          rows.reduce((s, r) => s + compositeScore(r.ai_citation_likely, r.ai_answer_quality_score, r.structured_content_ratio), 0) /
            rows.length
        );

  const topicVals = Object.values(topic_performance);
  const establishedTopics = topicVals
    .filter((t) => t.n >= thresholds.min_samples_topic)
    .sort((a, b) => b.adjusted_composite - a.adjusted_composite);
  const top_ai_citable_topics = establishedTopics.slice(0, V160_TOPIC_TOP_N).map((t) => t.topic_key);

  const emergingTopics = topicVals
    .filter((t) => t.n >= 1 && t.n < thresholds.min_samples_topic)
    .sort((a, b) => b.composite - a.composite);
  const emerging_ai_citable_topics = emergingTopics.slice(0, V160_TOPIC_EMERGING_N).map((t) => t.topic_key);

  const weakCandidates = topicVals
    .filter((t) => t.n >= thresholds.min_samples_topic && t.mean_ai_answer_quality_score < 48)
    .sort((a, b) => a.adjusted_composite - b.adjusted_composite)
    .slice(-V160_TOPIC_WEAK_N);
  const weak_ai_citable_topics = weakCandidates.map((t) => t.topic_key);

  const pageEstablished = Object.values(page_type_performance)
    .filter((p) => p.n >= thresholds.min_samples_page_type)
    .sort((a, b) => b.adjusted_composite - a.adjusted_composite);
  const top_ai_citable_page_types = pageEstablished.slice(0, 3).map((p) => p.page_type);
  const bonus_eligible_page_type = pageEstablished[0]?.page_type ?? null;

  const wfEstablished = Object.values(workflow_performance)
    .filter((w) => w.n >= thresholds.min_samples_workflow)
    .sort((a, b) => b.adjusted_composite - a.adjusted_composite);
  const top_ai_citable_workflows = wfEstablished.slice(0, 3).map((w) => w.workflow_id);
  const bonus_eligible_workflow = wfEstablished[0]?.workflow_id ?? null;

  return {
    overall_ai_citation_score,
    topic_performance,
    page_type_performance,
    workflow_performance,
    top_ai_citable_topics,
    emerging_ai_citable_topics,
    weak_ai_citable_topics,
    top_ai_citable_page_types,
    top_ai_citable_workflows,
    bonus_eligible_page_type,
    bonus_eligible_workflow,
    row_count: rows.length,
    min_sample_thresholds: thresholds,
    confidence_weight_notes: CONFIDENCE_NOTES
  };
}

const establishedTopicSet = (agg: AiCitationAggregateResult) =>
  new Set(agg.top_ai_citable_topics.map((t) => normalizeTopicKey(t) || t));
const emergingTopicSet = (agg: AiCitationAggregateResult) =>
  new Set(agg.emerging_ai_citable_topics.map((t) => normalizeTopicKey(t) || t));
const weakTopicSet = (agg: AiCitationAggregateResult) =>
  new Set(agg.weak_ai_citable_topics.map((t) => normalizeTopicKey(t) || t));

function fuzzyTopicMatch(
  tk: string,
  list: string[],
  minLen: number
): boolean {
  for (const top of list) {
    const nt = normalizeTopicKey(top) || top;
    if (nt.length >= minLen && (tk.includes(nt) || nt.includes(tk))) return true;
  }
  return false;
}

/**
 * V160.1 — Established topics get full stacking; emerging get reduced bonus; weak penalty bounded.
 */
export function computeV160DominanceAdjustments(
  row: AiCitationMetricRow,
  agg: AiCitationAggregateResult,
  totalRows: number
): { ai_citation_dominance_bonus: number; weak_ai_citation_penalty: number } {
  if (totalRows < V160_MIN_ROWS) {
    return { ai_citation_dominance_bonus: 0, weak_ai_citation_penalty: 0 };
  }

  const tk = normalizeTopicKey(row.topic_key) || row.topic_key.toLowerCase().trim();
  let ai_citation_dominance_bonus = 0;

  const estSet = establishedTopicSet(agg);
  const emgSet = emergingTopicSet(agg);

  if (estSet.has(tk)) {
    ai_citation_dominance_bonus += 4;
  } else if (fuzzyTopicMatch(tk, agg.top_ai_citable_topics, 6)) {
    ai_citation_dominance_bonus += 3;
  } else if (emgSet.has(tk)) {
    ai_citation_dominance_bonus += 2;
  } else if (fuzzyTopicMatch(tk, agg.emerging_ai_citable_topics, 6)) {
    ai_citation_dominance_bonus += 1;
  }

  const establishedTier = ai_citation_dominance_bonus >= 3;
  if (establishedTier) {
    if (agg.bonus_eligible_page_type && agg.bonus_eligible_page_type === row.page_type) {
      ai_citation_dominance_bonus += 2;
    }
    if (agg.bonus_eligible_workflow && agg.bonus_eligible_workflow === row.workflow_id) {
      ai_citation_dominance_bonus += 2;
    }
  }

  ai_citation_dominance_bonus = Math.min(V160_MAX_DOMINANCE_BONUS, ai_citation_dominance_bonus);

  let weak_ai_citation_penalty = 0;
  if (weakTopicSet(agg).has(tk)) {
    if (row.structured_content_ratio < 0.1) weak_ai_citation_penalty = 4;
    else if (row.structured_content_ratio < 0.14) weak_ai_citation_penalty = 2;
    else weak_ai_citation_penalty = 1;
  } else {
    for (const w of agg.weak_ai_citable_topics) {
      const nw = normalizeTopicKey(w) || w;
      if (nw.length >= 4 && (tk.includes(nw) || nw.includes(tk))) {
        if (row.structured_content_ratio < 0.11) weak_ai_citation_penalty = 3;
        else weak_ai_citation_penalty = 1;
        break;
      }
    }
  }

  weak_ai_citation_penalty = Math.min(V160_MAX_WEAK_AI_PENALTY, weak_ai_citation_penalty);

  return { ai_citation_dominance_bonus, weak_ai_citation_penalty };
}
