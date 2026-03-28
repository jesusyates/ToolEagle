/**
 * V153 — Asset SEO publish queue scoring: retrieval bonus + AI cost penalty
 * layered on top of base priority. Does not replace quality / scaling / diversity gates (those live in scripts).
 */

import fs from "fs";
import path from "path";
import { slugPrimaryPrefix } from "./seo-risk-control";
import type { AssetSeoRevenueSummaryArtifact } from "./asset-seo-revenue-summary";
import { normalizeTopicKey } from "./asset-seo-revenue-intelligence";
import {
  logAssetSeoAiCitationDominance,
  logAssetSeoRevenueScaling,
  logAssetSeoTrafficAllocation
} from "./asset-seo-telemetry";
import { computeAiCitationQueueSignalsForCandidate } from "./asset-seo-ai-citation-tracking";
import type { ZhKeywordLike } from "./asset-seo-ai-citation-format";
import {
  aggregateAiCitationMetrics,
  computeV160DominanceAdjustments,
  metricRowFromPublishQueueItem
} from "./asset-seo-ai-citation-metrics";
import { writeAssetSeoAiCitationDominanceAndAutopilot } from "./asset-seo-ai-citation-dominance-summary";
import {
  buildTrafficAllocationContext,
  computeTrafficAllocation,
  computeV161TrafficAllocationQueueBonus
} from "./asset-seo-traffic-allocation";
import { mergeTrafficAllocationIntoAutopilotFile, writeAssetSeoTrafficAllocationJson } from "./asset-seo-traffic-allocation-summary";
import {
  buildSegmentStrategy,
  buildSegmentStrategyContextFromQueueRow,
  segmentStrategyQueueBonus
} from "./asset-seo-segment-strategy";
import {
  buildSegmentStrategyArtifactFromRows,
  mergeSegmentStrategyIntoAutopilotFile,
  writeAssetSeoSegmentStrategyJson,
  type SegmentStrategyRowMeta
} from "./asset-seo-segment-strategy-summary";
import { logAssetSeoIntentEscalation, logAssetSeoSegmentStrategy } from "./asset-seo-telemetry";
import { buildIntentEscalationPlan, type IntentEscalationContext } from "./asset-seo-intent-escalation";
import {
  buildIntentEscalationArtifactFromRows,
  mergeIntentEscalationIntoAutopilotFile,
  writeAssetSeoIntentEscalationJson,
  type IntentEscalationRowMeta
} from "./asset-seo-intent-escalation-summary";
import { topicMatchesConversionSignals, topicMatchesHighRevenue } from "./asset-seo-segment-strategy";

export type ModelCostTier = "low" | "medium" | "high";

export type PublishQueueCandidate = {
  id: string;
  lane: "zh" | "en";
  topic_key: string;
  /** 0–100 baseline from product rules / heuristics */
  base_score: number;
  /** Inferred or observed model tier for this lane/topic */
  model_cost_tier?: ModelCostTier;
};

/** Scored row before V159 AI-citation layer (also returned by scorePublishQueueItem). */
export type PublishQueueScoredBase = PublishQueueCandidate & {
  retrieval_priority_bonus: number;
  ai_cost_penalty: number;
  /** V158 — 0..12 before risk dampen; capped per-topic in build */
  revenue_priority_bonus: number;
  /** V158 — 0..5 subtracted from rank */
  low_revenue_penalty: number;
  effective_score: number;
};

export type PublishQueueItem = PublishQueueScoredBase & {
  /** V159 — added to effective_score when citation structure is strong */
  ai_citation_priority_bonus: number;
  /** V159 — subtracted when markdown preview is weakly structured */
  ai_structure_weak_penalty: number;
  /** V159 — 0..1 heuristic */
  ai_citation_likely: number;
  ai_answer_quality_score: number;
  structured_content_ratio: number;
  /** V160 — +0..+8 from top AI-citable topic/page-type/workflow cohorts */
  ai_citation_dominance_bonus: number;
  /** V160 — 0..4 subtracted for weak cohort + low structure */
  weak_ai_citation_penalty: number;
  /** V161 — bounded queue rank adjustment from traffic allocation layer */
  traffic_allocation_bonus: number;
  /** V162 — traffic intent / monetization segment */
  segment_key: string;
  /** V162 — bounded queue adjustment after V161 */
  segment_strategy_bonus: number;
};

const MAX_RETRIEVAL_BONUS = 3;
const MAX_REVENUE_PRIORITY_BONUS = 12;
const MAX_LOW_REVENUE_PENALTY = 5;

function readJson<T>(file: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeAssetRows(raw: unknown): Array<{ topic?: string; normalized_topic?: string; workflow_id?: string }> {
  if (Array.isArray(raw)) return raw as { topic?: string; normalized_topic?: string; workflow_id?: string }[];
  if (raw && typeof raw === "object" && "items" in raw && Array.isArray((raw as { items: unknown }).items)) {
    return (raw as { items: { topic?: string; normalized_topic?: string }[] }).items;
  }
  return [];
}

/**
 * +0..+3 based on overlap between topic_key and high-quality / workflow asset topics.
 */
export function computeRetrievalPriorityBonus(topicKey: string, hqTopics: string[], wfTopics: string[]): number {
  const t = topicKey.toLowerCase();
  let bonus = 0;
  for (const h of hqTopics) {
    if (!h) continue;
    const u = h.toLowerCase();
    if (t.includes(u) || u.includes(t)) bonus += 2;
  }
  bonus = Math.min(MAX_RETRIEVAL_BONUS, bonus);
  if (bonus === 0) {
    for (const w of wfTopics) {
      if (!w) continue;
      const u = w.toLowerCase();
      if (t.includes(u) || u.includes(t)) {
        bonus = Math.min(MAX_RETRIEVAL_BONUS, 2);
        break;
      }
    }
  }
  return Math.min(MAX_RETRIEVAL_BONUS, bonus);
}

/** Higher penalty = more expensive; subtracted from rank so expensive rows sink slightly. */
export function computeAiCostPenalty(tier: ModelCostTier | undefined): number {
  switch (tier) {
    case "high":
      return 4;
    case "medium":
      return 1;
    default:
      return 0;
  }
}

export function queueCandidateTopicPrefix(c: PublishQueueCandidate): string | null {
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

function topicScoreFromSummary(topicKey: string, summary: AssetSeoRevenueSummaryArtifact | null): number {
  if (!summary?.topic_revenue_score) return 0;
  const t = topicKey.toLowerCase().replace(/\s+/g, " ").trim();
  let best = 0;
  for (const [k, v] of Object.entries(summary.topic_revenue_score)) {
    const kk = k.toLowerCase();
    if (!kk) continue;
    if (t.includes(kk) || kk.includes(t.replace(/\s/g, ""))) {
      best = Math.max(best, Number(v) || 0);
    }
  }
  return Math.min(1, best);
}

function workflowScoreFromSummary(workflowHint: string, summary: AssetSeoRevenueSummaryArtifact | null): number {
  if (!summary?.workflow_revenue_score || !workflowHint) return 0;
  const k = workflowHint.toLowerCase();
  return Math.min(1, Number(summary.workflow_revenue_score[k] ?? 0));
}

/**
 * V158 — +0..+12 from revenue summary; damped when V156 risk marks cluster.
 */
export function computeRevenuePriorityBonus(
  c: PublishQueueCandidate,
  summary: AssetSeoRevenueSummaryArtifact | null,
  riskTopicDeprioritize?: Set<string>
): number {
  if (!summary) return 0;
  const hasTopics = Object.keys(summary.topic_revenue_score || {}).length > 0;
  const hasWf = Object.keys(summary.workflow_revenue_score || {}).length > 0;
  if (!hasTopics && !hasWf) return 0;
  let raw = topicScoreFromSummary(c.topic_key, summary);
  const wfHint = c.id.startsWith("en:") ? c.id.slice(3) : "";
  raw = Math.max(raw, workflowScoreFromSummary(wfHint, summary));
  let bonus = Math.round(raw * MAX_REVENUE_PRIORITY_BONUS);
  bonus = Math.min(MAX_REVENUE_PRIORITY_BONUS, Math.max(0, bonus));
  const pref = queueCandidateTopicPrefix(c);
  if (pref && riskTopicDeprioritize?.has(pref.toLowerCase())) {
    bonus = Math.floor(bonus * 0.5);
  }
  return bonus;
}

/** V158 — +0..+5 penalty for underperforming topic match */
export function computeLowRevenuePenalty(topicKey: string, summary: AssetSeoRevenueSummaryArtifact | null): number {
  if (!summary?.underperforming_topics?.length) return 0;
  const t = normalizeTopicKey(topicKey);
  for (const u of summary.underperforming_topics) {
    const k = normalizeTopicKey(u.segment_key);
    if (!k) continue;
    if (t.includes(k) || k.includes(t)) {
      return u.conversion_rate < 0.015 ? MAX_LOW_REVENUE_PENALTY : 3;
    }
  }
  return 0;
}

/**
 * V158 — never over-amplify one slug cluster: keep top 3 high-boost rows, demote rest.
 */
export function applyRevenueAmplificationTopicCaps(items: PublishQueueItem[]): void {
  const high = items.filter((i) => i.revenue_priority_bonus >= 8);
  const byPref = new Map<string, PublishQueueItem[]>();
  for (const i of high) {
    const p = queueCandidateTopicPrefix(i) || "_";
    if (!byPref.has(p)) byPref.set(p, []);
    byPref.get(p)!.push(i);
  }
  for (const [, arr] of byPref) {
    if (arr.length <= 3) continue;
    arr.sort((a, b) => b.effective_score - a.effective_score);
    for (let k = 3; k < arr.length; k++) {
      arr[k].effective_score -= 4;
    }
  }
}

export function scorePublishQueueItem(
  c: PublishQueueCandidate,
  ctx: {
    hqTopics: string[];
    wfTopics: string[];
    highAiTopics: Set<string>;
    /** V156 — lower effective_score for oversaturated slug/topic clusters */
    riskTopicDeprioritize?: Set<string>;
    /** V158 */
    revenueSummary?: AssetSeoRevenueSummaryArtifact | null;
  }
): PublishQueueScoredBase {
  const retrieval_priority_bonus = computeRetrievalPriorityBonus(c.topic_key, ctx.hqTopics, ctx.wfTopics);
  let ai_cost_penalty = computeAiCostPenalty(c.model_cost_tier);
  if (ctx.highAiTopics.has(c.topic_key)) {
    ai_cost_penalty = Math.min(8, ai_cost_penalty + 2);
  }
  let risk_cluster_penalty = 0;
  if (ctx.riskTopicDeprioritize?.size) {
    const pref = queueCandidateTopicPrefix(c);
    if (pref && ctx.riskTopicDeprioritize.has(pref.toLowerCase())) {
      risk_cluster_penalty = 6;
    }
  }
  const revenue_priority_bonus = computeRevenuePriorityBonus(c, ctx.revenueSummary ?? null, ctx.riskTopicDeprioritize);
  const low_revenue_penalty = computeLowRevenuePenalty(c.topic_key, ctx.revenueSummary ?? null);
  const effective_score =
    c.base_score +
    retrieval_priority_bonus -
    ai_cost_penalty -
    risk_cluster_penalty +
    revenue_priority_bonus -
    low_revenue_penalty;
  return {
    ...c,
    retrieval_priority_bonus,
    ai_cost_penalty,
    revenue_priority_bonus,
    low_revenue_penalty,
    effective_score
  };
}

export function buildAssetSeoPublishQueue(candidates: PublishQueueCandidate[], cwd = process.cwd()): PublishQueueItem[] {
  const hqPath = path.join(cwd, "generated", "agent_high_quality_assets.json");
  const wfPath = path.join(cwd, "generated", "workflow-assets-retrieval.json");
  const costPath = path.join(cwd, "generated", "asset-seo-cost-efficiency.json");

  const hqRows = normalizeAssetRows(readJson(hqPath, []));
  const wfRows = normalizeAssetRows(readJson(wfPath, { items: [] }));
  const hqTopics = hqRows.map((r) => r.normalized_topic || r.topic || "").filter(Boolean);
  const wfTopics = wfRows.map((r) => r.normalized_topic || r.topic || "").filter(Boolean);

  const cost = readJson<{ topics_with_high_ai_usage?: string[] }>(costPath, {});
  const highAiTopics = new Set(cost.topics_with_high_ai_usage || []);

  const riskPath = path.join(cwd, "generated", "seo-risk-context.json");
  const riskFile = readJson<{ deprioritized_topic_prefixes?: string[] }>(riskPath, {});
  const riskTopicDeprioritize = new Set(
    (riskFile.deprioritized_topic_prefixes || []).map((s) => String(s).toLowerCase())
  );

  const revPath = path.join(cwd, "generated", "asset-seo-revenue-summary.json");
  const revenueSummary = readJson<AssetSeoRevenueSummaryArtifact | null>(revPath, null);

  const zhKwPath = path.join(cwd, "data", "zh-keywords.json");
  const zhKeywords = readJson<Record<string, ZhKeywordLike>>(zhKwPath, {});

  const ctx = { hqTopics, wfTopics, highAiTopics, riskTopicDeprioritize, revenueSummary };
  const scored = candidates.map((c) => {
    const s = scorePublishQueueItem(c, ctx);
    const sig = computeAiCitationQueueSignalsForCandidate(c, zhKeywords);
    return {
      ...s,
      ai_citation_priority_bonus: sig.bonus,
      ai_structure_weak_penalty: sig.penalty,
      ai_citation_likely: sig.ai_citation_likely,
      ai_answer_quality_score: sig.ai_answer_quality_score,
      structured_content_ratio: sig.structured_content_ratio,
      ai_citation_dominance_bonus: 0,
      weak_ai_citation_penalty: 0,
      traffic_allocation_bonus: 0,
      segment_key: "balanced_default",
      segment_strategy_bonus: 0,
      effective_score: s.effective_score + sig.bonus - sig.penalty
    };
  });

  const metricRows = scored.map(metricRowFromPublishQueueItem);
  const citationAgg = aggregateAiCitationMetrics(metricRows);
  for (let i = 0; i < scored.length; i++) {
    const adj = computeV160DominanceAdjustments(metricRows[i], citationAgg, scored.length);
    scored[i].ai_citation_dominance_bonus = adj.ai_citation_dominance_bonus;
    scored[i].weak_ai_citation_penalty = adj.weak_ai_citation_penalty;
    scored[i].effective_score += adj.ai_citation_dominance_bonus - adj.weak_ai_citation_penalty;
  }

  const topicSample =
    citationAgg.top_ai_citable_topics.length > 0
      ? citationAgg.top_ai_citable_topics.slice(0, 5)
      : citationAgg.emerging_ai_citable_topics.slice(0, 5);
  logAssetSeoAiCitationDominance({
    event: "ai_citation_dominance_computed",
    overall_ai_citation_score: citationAgg.overall_ai_citation_score,
    row_count: citationAgg.row_count,
    top_topics_sample: topicSample,
    weak_topics_sample: citationAgg.weak_ai_citable_topics.slice(0, 5),
    reason: "publish_queue_v160_layer"
  });
  let domBoostLogged = 0;
  let weakLogged = 0;
  for (const row of scored) {
    if (row.ai_citation_dominance_bonus > 0 && domBoostLogged < 8) {
      logAssetSeoAiCitationDominance({
        event: "ai_citable_topic_boosted",
        topic_key: row.topic_key,
        bonus_delta: row.ai_citation_dominance_bonus,
        reason: "ai_citation_dominance_bonus"
      });
      domBoostLogged++;
    }
    if (row.weak_ai_citation_penalty > 0 && weakLogged < 8) {
      logAssetSeoAiCitationDominance({
        event: "weak_ai_topic_suppressed",
        topic_key: row.topic_key,
        penalty_delta: row.weak_ai_citation_penalty,
        reason: "weak_ai_citation_penalty"
      });
      weakLogged++;
    }
  }

  const taCtx = buildTrafficAllocationContext(cwd, candidates);
  const trafficAlloc = computeTrafficAllocation(taCtx);
  writeAssetSeoTrafficAllocationJson(cwd, trafficAlloc);
  logAssetSeoTrafficAllocation({
    event: "traffic_allocation_computed",
    total_daily_capacity: trafficAlloc.total_daily_capacity,
    suppressed_count: trafficAlloc.suppressed_segments.length,
    exploration_quota_count: trafficAlloc.exploration_quota_assignments.length,
    recommended_zh_batch_scale: trafficAlloc.recommended_zh_batch_scale,
    recommended_en_batch_scale: trafficAlloc.recommended_en_batch_scale,
    reason: "publish_queue_v161_layer"
  });

  const explorationSet = new Set(trafficAlloc.exploration_quota_assignments);
  let hiAllocLogged = 0;
  let lowAllocLogged = 0;
  let exploreLogged = 0;
  for (let i = 0; i < scored.length; i++) {
    const bonus = computeV161TrafficAllocationQueueBonus(candidates[i], trafficAlloc);
    scored[i].traffic_allocation_bonus = bonus;
    scored[i].effective_score += bonus;
    const tk = candidates[i].topic_key;
    if (bonus >= 3 && hiAllocLogged < 8) {
      logAssetSeoTrafficAllocation({
        event: "high_value_segment_allocated",
        topic_key: tk,
        allocation_bonus: bonus,
        reason: "traffic_allocation_queue_bonus"
      });
      hiAllocLogged++;
    }
    if (bonus < 0 && lowAllocLogged < 8) {
      logAssetSeoTrafficAllocation({
        event: "low_value_segment_suppressed",
        topic_key: tk,
        allocation_bonus: bonus,
        reason: "traffic_allocation_penalty"
      });
      lowAllocLogged++;
    }
    if (explorationSet.has(tk) && exploreLogged < 8) {
      logAssetSeoTrafficAllocation({
        event: "exploration_quota_assigned",
        topic_key: tk,
        reason: "exploration_quota"
      });
      exploreLogged++;
    }
  }

  const emergingTopicKeys = new Set(citationAgg.emerging_ai_citable_topics);
  const segmentMetas: SegmentStrategyRowMeta[] = [];
  let hiSegLogged = 0;
  let lowSegLogged = 0;
  for (let i = 0; i < scored.length; i++) {
    const stratCtx = buildSegmentStrategyContextFromQueueRow({
      candidate: candidates[i],
      row: scored[i],
      revenueSummary,
      explorationQuota: explorationSet,
      riskTopicDeprioritize,
      emergingTopicKeys
    });
    const strat = buildSegmentStrategy(stratCtx);
    const segBonus = segmentStrategyQueueBonus(strat);
    scored[i].segment_key = strat.segment_key;
    scored[i].segment_strategy_bonus = segBonus;
    scored[i].effective_score += segBonus;
    segmentMetas.push({
      topic_key: candidates[i].topic_key,
      strategy: strat,
      segment_strategy_bonus: segBonus
    });
    if (segBonus > 0 && hiSegLogged < 8) {
      logAssetSeoSegmentStrategy({
        event: "high_value_segment_prioritized",
        segment_key: strat.segment_key,
        topic_key: candidates[i].topic_key,
        queue_bonus_delta: segBonus,
        recommended_allocation_weight: strat.recommended_allocation_weight,
        reason: "publish_queue_v162_layer"
      });
      hiSegLogged++;
    }
    if (segBonus < 0 && lowSegLogged < 8) {
      logAssetSeoSegmentStrategy({
        event: "low_value_segment_deprioritized",
        segment_key: strat.segment_key,
        topic_key: candidates[i].topic_key,
        queue_bonus_delta: segBonus,
        reason: "publish_queue_v162_layer"
      });
      lowSegLogged++;
    }
  }
  const segmentArtifact = buildSegmentStrategyArtifactFromRows(segmentMetas);
  writeAssetSeoSegmentStrategyJson(cwd, segmentArtifact);
  logAssetSeoSegmentStrategy({
    event: "segment_strategy_computed",
    row_count: segmentMetas.length,
    reason: "publish_queue_v162_layer"
  });

  const intentMetas: IntentEscalationRowMeta[] = [];
  for (let i = 0; i < scored.length; i++) {
    const tk = candidates[i].topic_key;
    const ieCtx: IntentEscalationContext = {
      lane: candidates[i].lane,
      topic_key: tk,
      ai_citation_likely: scored[i].ai_citation_likely,
      ai_citation_dominance_bonus: scored[i].ai_citation_dominance_bonus,
      weak_ai_citation_penalty: scored[i].weak_ai_citation_penalty,
      revenue_priority_bonus: scored[i].revenue_priority_bonus,
      low_revenue_penalty: scored[i].low_revenue_penalty,
      monetization_tier:
        scored[i].revenue_priority_bonus >= 8 ? "high" : scored[i].low_revenue_penalty > 0 ? "low" : "medium",
      generation_count: 0,
      lifetime_generation_count: 0,
      value_delivered: false,
      retrieval_used: scored[i].retrieval_priority_bonus > 0,
      entry_source: candidates[i].lane === "zh" ? undefined : "en_registry",
      intent: null,
      high_revenue_signal: topicMatchesHighRevenue(tk, revenueSummary),
      high_conversion_match: topicMatchesConversionSignals(tk, revenueSummary)
    };
    const plan = buildIntentEscalationPlan(ieCtx, 0.44);
    intentMetas.push({ topic_key: tk, plan });
  }
  const intentArtifact = buildIntentEscalationArtifactFromRows(intentMetas);
  writeAssetSeoIntentEscalationJson(cwd, intentArtifact);
  logAssetSeoIntentEscalation({
    event: "intent_state_detected",
    row_count: intentMetas.length,
    reason: "publish_queue_v163_layer"
  });

  applyRevenueAmplificationTopicCaps(scored);

  let boostLogged = 0;
  let suppressLogged = 0;
  for (const row of scored) {
    if (row.revenue_priority_bonus >= 8 && boostLogged < 8) {
      logAssetSeoRevenueScaling({
        event: "high_value_topic_boosted",
        topic_key: row.topic_key,
        bonus_delta: row.revenue_priority_bonus,
        reason: "queue_revenue_bonus"
      });
      boostLogged++;
    }
    if (row.low_revenue_penalty > 0 && suppressLogged < 8) {
      logAssetSeoRevenueScaling({
        event: "low_value_topic_suppressed",
        topic_key: row.topic_key,
        penalty_delta: row.low_revenue_penalty,
        reason: "queue_low_revenue_penalty"
      });
      suppressLogged++;
    }
  }
  if (revenueSummary && (revenueSummary.top_topics_by_revenue?.length ?? 0) > 0) {
    logAssetSeoRevenueScaling({
      event: "revenue_signal_detected",
      reason: "revenue_summary_loaded",
      revenue_score: revenueSummary.top_topics_by_revenue[0]?.revenue
    });
  }

  scored.sort((a, b) => b.effective_score - a.effective_score);
  return scored;
}

export function buildAssetSeoPublishQueueArtifact(cwd = process.cwd()): {
  generated_at: string;
  items: PublishQueueItem[];
} {
  const zhPath = path.join(cwd, "data", "zh-keywords.json");
  const regPath = path.join(cwd, "generated", "topic-registry.json");

  const candidates: PublishQueueCandidate[] = [];

  const zh = readJson<Record<string, { keyword?: string; platform?: string; goal?: string; published?: boolean }>>(
    zhPath,
    {}
  );
  for (const slug of Object.keys(zh)) {
    const row = zh[slug];
    if (!row || row.published === false) continue;
    const topic = row.keyword || slug;
    candidates.push({
      id: `zh:${slug}`,
      lane: "zh",
      topic_key: topic,
      base_score: 50,
      model_cost_tier: "low"
    });
  }

  const reg = readJson<{ topics?: { topicKey: string }[] }>(regPath, {});
  for (const t of reg.topics || []) {
    if (!t?.topicKey) continue;
    candidates.push({
      id: `en:${t.topicKey}`,
      lane: "en",
      topic_key: t.topicKey,
      base_score: 55,
      model_cost_tier: "medium"
    });
  }

  const items = buildAssetSeoPublishQueue(candidates, cwd);
  writeAssetSeoAiCitationDominanceAndAutopilot(cwd, items);
  mergeTrafficAllocationIntoAutopilotFile(cwd);
  mergeSegmentStrategyIntoAutopilotFile(cwd);
  mergeIntentEscalationIntoAutopilotFile(cwd);
  return { generated_at: new Date().toISOString(), items };
}
