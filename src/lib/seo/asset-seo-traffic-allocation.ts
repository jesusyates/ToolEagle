/**
 * V161 — Bounded traffic allocation from revenue, conversion, citation dominance, risk, quality, diversity.
 * Guides production capacity; does not replace safety/risk engines.
 */

import fs from "fs";
import path from "path";
import { slugPrimaryPrefix } from "./seo-risk-control";
import { normalizeTopicKey } from "./asset-seo-revenue-intelligence";
import type { AssetSeoRevenueSummaryArtifact } from "./asset-seo-revenue-summary";
import type { AssetSeoAiCitationDominanceArtifact } from "./asset-seo-ai-citation-dominance-summary";

/** Minimal candidate shape (avoid circular import with publish-queue). */
export type TrafficAllocationCandidateLike = { id: string; lane: "zh" | "en"; topic_key: string };

export const TRAFFIC_ALLOCATION_VERSION = "v161.0";

export const V161_TOTAL_DAILY_CAPACITY = 100;
export const V161_EXPLORATION_QUOTA_PERCENT = 0.08;
export const V161_MAX_TOPIC_UNIT_SHARE = 12;
export const V161_MIN_TOPIC_UNITS = 0.35;
export const V161_MAX_QUEUE_ALLOCATION_BONUS = 5;
export const V161_MAX_QUEUE_ALLOCATION_PENALTY = 3;
export const V161_BATCH_SCALE_MIN = 0.88;
export const V161_BATCH_SCALE_MAX = 1.08;

export type TrafficAllocationContext = {
  total_daily_capacity: number;
  revenueSummary: AssetSeoRevenueSummaryArtifact | null;
  dominance: AssetSeoAiCitationDominanceArtifact | null;
  riskDeprioritizePrefixes: Set<string>;
  hqTopics: string[];
  wfTopics: string[];
  uniqueTopicKeys: string[];
  uniqueWorkflowIds: string[];
  uniquePageTypes: string[];
};

export type TopicAllocationScoreBreakdown = {
  topic_key: string;
  score: number;
  revenue_component: number;
  conversion_component: number;
  citation_component: number;
  risk_component: number;
  quality_component: number;
};

export type AllocationEntry = {
  units: number;
  score: number;
  tier: "high" | "mid" | "low" | "exploration";
};

export type SuppressedSegment = {
  segment: string;
  kind: "topic" | "workflow" | "page_type";
  reason: string;
};

export type TrafficAllocationResult = {
  version: string;
  total_daily_capacity: number;
  topic_allocations: Record<string, AllocationEntry>;
  workflow_allocations: Record<string, AllocationEntry>;
  page_type_allocations: Record<string, AllocationEntry>;
  suppressed_segments: SuppressedSegment[];
  exploration_quota_assignments: string[];
  allocation_reasoning: string[];
  notes: string[];
  /** Bounded multiplier for ZH batch (orchestrator / background tick) */
  recommended_zh_batch_scale: number;
  recommended_en_batch_scale: number;
};

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function normalizeAssetRows(raw: unknown): Array<{ topic?: string; normalized_topic?: string }> {
  if (Array.isArray(raw)) return raw as { topic?: string; normalized_topic?: string }[];
  if (raw && typeof raw === "object" && "items" in raw && Array.isArray((raw as { items: unknown }).items)) {
    return (raw as { items: { topic?: string; normalized_topic?: string }[] }).items;
  }
  return [];
}

/** Fuzzy lookup in revenue score map (normalized + substring). */
export function lookupTopicRevenueScore(topicKey: string, map: Record<string, number> | undefined): number {
  if (!map) return 0;
  const t = normalizeTopicKey(topicKey) || topicKey.toLowerCase().trim();
  if (map[topicKey] != null) return Number(map[topicKey]) || 0;
  if (map[t] != null) return Number(map[t]) || 0;
  let best = 0;
  for (const [k, v] of Object.entries(map)) {
    const kk = normalizeTopicKey(k) || k.toLowerCase();
    if (!kk) continue;
    if (t.includes(kk) || kk.includes(t)) best = Math.max(best, Number(v) || 0);
  }
  return Math.min(1, best);
}

function topicRiskPrefix(topicKey: string): string | null {
  const slugish = topicKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slugish) return null;
  return slugPrimaryPrefix(slugish);
}

function inDominanceTopicSet(
  topicKey: string,
  entries: Array<{ topic_key: string } | string>
): boolean {
  const t = normalizeTopicKey(topicKey) || topicKey.toLowerCase().trim();
  for (const e of entries) {
    const k = typeof e === "string" ? e : e.topic_key;
    const nk = normalizeTopicKey(k) || k.toLowerCase().trim();
    if (nk === t) return true;
  }
  return false;
}

/**
 * Explicit bounded formula (0–100 target):
 * base + revenue(0–22) + conversion(0–18) + citation(−14–+18) + risk(−22–0) + quality(0–12)
 */
export function scoreTopicAllocationOpportunity(
  topicKey: string,
  ctx: TrafficAllocationContext
): TopicAllocationScoreBreakdown {
  const t = normalizeTopicKey(topicKey) || topicKey.toLowerCase().trim();
  const revMap = ctx.revenueSummary?.topic_revenue_score;
  const revScalar = lookupTopicRevenueScore(topicKey, revMap);
  const revenue_component = Math.round(revScalar * 22);

  let conversion_component = 0;
  const topConv = ctx.revenueSummary?.raw?.top_conversion_pages || ctx.revenueSummary?.top_topics_by_conversion_rate || [];
  for (const seg of topConv) {
    const label = String((seg as { topic?: string; segment_key?: string }).topic ?? (seg as { segment_key?: string }).segment_key ?? "");
    const nk = normalizeTopicKey(label) || label.toLowerCase();
    if (nk && (t.includes(nk) || nk.includes(t))) {
      conversion_component = 18;
      break;
    }
  }
  if (conversion_component === 0) {
    const segs = ctx.revenueSummary?.top_topics_by_conversion_rate || [];
    for (const seg of segs) {
      const sk = normalizeTopicKey((seg as { segment_key?: string }).segment_key ?? "") || "";
      if (sk && (t.includes(sk) || sk.includes(t))) {
        conversion_component = Math.round(Math.min(1, Number((seg as { conversion_rate?: number }).conversion_rate) || 0) * 14);
        break;
      }
    }
  }

  let citation_component = 0;
  if (ctx.dominance) {
    if (inDominanceTopicSet(topicKey, ctx.dominance.top_ai_citable_topics)) citation_component += 16;
    else if (inDominanceTopicSet(topicKey, ctx.dominance.emerging_ai_citable_topics)) citation_component += 10;
    if (inDominanceTopicSet(topicKey, ctx.dominance.weak_topics)) citation_component -= 14;
  }

  let risk_component = 0;
  const pref = topicRiskPrefix(topicKey);
  if (pref && ctx.riskDeprioritizePrefixes.has(pref.toLowerCase())) {
    risk_component = -22;
  }

  let quality_component = 0;
  for (const h of ctx.hqTopics) {
    const u = h.toLowerCase();
    if (!u) continue;
    if (t.includes(u) || u.includes(t)) quality_component += 4;
  }
  quality_component = Math.min(12, quality_component);

  const base = 38;
  const score = Math.max(0, Math.min(100, base + revenue_component + conversion_component + citation_component + risk_component + quality_component));

  return {
    topic_key: topicKey,
    score,
    revenue_component,
    conversion_component,
    citation_component,
    risk_component,
    quality_component
  };
}

export function scoreWorkflowAllocationOpportunity(workflowId: string, ctx: TrafficAllocationContext): number {
  const w = workflowId.toLowerCase();
  let s = 40;
  const wfMap = ctx.revenueSummary?.workflow_revenue_score;
  if (wfMap?.[workflowId] != null) s += Math.round(Math.min(1, Number(wfMap[workflowId]) || 0) * 28);
  if (ctx.dominance?.top_ai_citable_workflows?.some((x) => x.workflow_id === workflowId)) s += 12;
  if (ctx.dominance?.weak_topics?.length && workflowId === "unknown") s -= 6;
  for (const t of ctx.wfTopics) {
    if (t && w.includes(t.toLowerCase())) s += 6;
  }
  s += ctx.riskDeprioritizePrefixes.size > 8 ? -4 : 0;
  return Math.max(0, Math.min(100, s));
}

export function scorePageTypeAllocationOpportunity(pageType: string, ctx: TrafficAllocationContext): number {
  let s = 45;
  if (ctx.dominance?.top_ai_citable_page_types?.some((p) => p.page_type === pageType)) s += 18;
  if (pageType === "zh_search" && ctx.uniqueTopicKeys.length > 50) s += 8;
  if (ctx.riskDeprioritizePrefixes.size > 10) s -= 10;
  return Math.max(0, Math.min(100, s));
}

function isTopicSuppressed(topicKey: string, breakdown: TopicAllocationScoreBreakdown, ctx: TrafficAllocationContext): boolean {
  if (breakdown.score < 20) return true;
  if (breakdown.risk_component <= -20) return true;
  const under = ctx.revenueSummary?.underperforming_topics || [];
  const t = normalizeTopicKey(topicKey) || topicKey.toLowerCase();
  for (const u of under) {
    const k = normalizeTopicKey(u.segment_key) || "";
    if (k && (t.includes(k) || k.includes(t)) && u.conversion_rate < 0.01) return true;
  }
  return false;
}

/**
 * Distribute integer units with exploration reserve, per-topic cap, and diversity floor.
 */
function distributeTopicUnits(
  scores: TopicAllocationScoreBreakdown[],
  suppressed: Set<string>,
  totalCapacity: number
): { main: Record<string, number>; exploration: string[] } {
  const explorationUnits = Math.max(2, Math.round(totalCapacity * V161_EXPLORATION_QUOTA_PERCENT));
  const mainPool = totalCapacity - explorationUnits;

  const active = scores.filter((s) => !suppressed.has(s.topic_key));
  if (active.length === 0) {
    return { main: {}, exploration: [] };
  }

  let weights = active.map((s) => ({ key: s.topic_key, w: Math.max(0.15, s.score / 100) }));
  const sumW = weights.reduce((a, b) => a + b.w, 0);
  let units: Record<string, number> = {};
  for (const { key, w } of weights) {
    units[key] = (mainPool * w) / sumW;
  }
  for (const k of Object.keys(units)) {
    units[k] = Math.min(V161_MAX_TOPIC_UNIT_SHARE, Math.max(V161_MIN_TOPIC_UNITS, units[k]));
  }
  let total = Object.values(units).reduce((a, b) => a + b, 0);
  const scale = total > 0 ? mainPool / total : 1;
  for (const k of Object.keys(units)) {
    units[k] = Math.max(V161_MIN_TOPIC_UNITS, Math.min(V161_MAX_TOPIC_UNIT_SHARE, units[k] * scale));
  }
  total = Object.values(units).reduce((a, b) => a + b, 0);
  if (total > 0 && Math.abs(total - mainPool) > 0.01) {
    const keys = Object.keys(units);
    const diff = mainPool - total;
    const per = diff / keys.length;
    for (const k of keys) {
      units[k] = Math.max(V161_MIN_TOPIC_UNITS, Math.min(V161_MAX_TOPIC_UNIT_SHARE, units[k] + per));
    }
  }

  const keys = Object.keys(units);
  const scoreByKey = new Map(active.map((s) => [s.topic_key, s.score]));
  const rounded: Record<string, number> = {};
  for (const k of keys) rounded[k] = 0;
  /** Water-fill integer units toward float targets; respects per-topic cap (avoids "last key eats pool"). */
  for (let step = 0; step < mainPool; step++) {
    let best: string | null = null;
    let bestVal = -Infinity;
    for (const k of keys) {
      if (rounded[k] >= V161_MAX_TOPIC_UNIT_SHARE) continue;
      const gap = units[k] - rounded[k];
      const tie = (scoreByKey.get(k) ?? 0) * 1e-6;
      if (gap + tie > bestVal) {
        bestVal = gap + tie;
        best = k;
      }
    }
    if (best == null) break;
    rounded[best]++;
  }

  const emergingOrder = [...scores]
    .filter((s) => !suppressed.has(s.topic_key))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((s) => s.topic_key);
  const exploration: string[] = emergingOrder.slice(0, Math.min(explorationUnits, emergingOrder.length));

  return { main: rounded, exploration };
}

export function computeTrafficAllocation(ctx: TrafficAllocationContext): TrafficAllocationResult {
  const suppressed_segments: SuppressedSegment[] = [];
  const breakdowns: TopicAllocationScoreBreakdown[] = [];
  const suppressed = new Set<string>();

  for (const topic of ctx.uniqueTopicKeys) {
    const b = scoreTopicAllocationOpportunity(topic, ctx);
    breakdowns.push(b);
    if (isTopicSuppressed(topic, b, ctx)) {
      suppressed.add(topic);
      suppressed_segments.push({
        segment: topic,
        kind: "topic",
        reason: b.score < 20 ? "low_composite_score" : b.risk_component <= -20 ? "risk_deprioritize" : "underperforming_revenue"
      });
    }
  }

  const { main, exploration } = distributeTopicUnits(breakdowns, suppressed, ctx.total_daily_capacity);

  const topic_allocations: Record<string, AllocationEntry> = {};
  for (const b of breakdowns) {
    if (suppressed.has(b.topic_key)) continue;
    const u = main[b.topic_key] ?? 0;
    const tier: AllocationEntry["tier"] =
      exploration.includes(b.topic_key) ? "exploration" : u >= 8 ? "high" : u >= 3 ? "mid" : "low";
    topic_allocations[b.topic_key] = { units: u, score: b.score, tier };
  }

  const workflow_allocations: Record<string, AllocationEntry> = {};
  for (const wf of ctx.uniqueWorkflowIds) {
    const sc = scoreWorkflowAllocationOpportunity(wf, ctx);
    workflow_allocations[wf] = { units: Math.round((sc / 100) * 15), score: sc, tier: sc >= 62 ? "high" : sc >= 45 ? "mid" : "low" };
  }

  const page_type_allocations: Record<string, AllocationEntry> = {};
  for (const pt of ctx.uniquePageTypes) {
    const sc = scorePageTypeAllocationOpportunity(pt, ctx);
    page_type_allocations[pt] = { units: Math.round((sc / 100) * 20), score: sc, tier: sc >= 60 ? "high" : "mid" };
  }

  const topicScores = breakdowns.filter((b) => !suppressed.has(b.topic_key)).map((b) => b.score);
  const avgTopic = topicScores.length ? topicScores.reduce((a, b) => a + b, 0) / topicScores.length : 50;
  const recommended_zh_batch_scale = Number(
    Math.min(V161_BATCH_SCALE_MAX, Math.max(V161_BATCH_SCALE_MIN, 0.92 + (avgTopic - 50) / 200)).toFixed(3)
  );
  const recommended_en_batch_scale = Number(
    Math.min(V161_BATCH_SCALE_MAX, Math.max(V161_BATCH_SCALE_MIN, 0.94 + (avgTopic - 50) / 250)).toFixed(3)
  );

  const allocation_reasoning = [
    "topic_score = clamp(0,100, base38 + revenue(0-22) + conversion(0-18) + citation(-14..+18) + risk(-22..0) + quality(0-12))",
    `main_units ≈ ${ctx.total_daily_capacity - Math.round(ctx.total_daily_capacity * V161_EXPLORATION_QUOTA_PERCENT)} with per-topic cap ${V161_MAX_TOPIC_UNIT_SHARE} and floor ${V161_MIN_TOPIC_UNITS}`,
    "exploration_quota_assignments = top emerging-scored non-suppressed topics (bounded count)",
    `recommended_*_batch_scale derived from average active topic score, clamped [${V161_BATCH_SCALE_MIN}, ${V161_BATCH_SCALE_MAX}]`
  ];

  return {
    version: TRAFFIC_ALLOCATION_VERSION,
    total_daily_capacity: ctx.total_daily_capacity,
    topic_allocations,
    workflow_allocations,
    page_type_allocations,
    suppressed_segments,
    exploration_quota_assignments: exploration,
    allocation_reasoning,
    notes: [
      "V161 allocation guides queue bonus and batch scaling; safety/risk engines remain authoritative",
      `suppressed_segments: ${suppressed_segments.length}`
    ],
    recommended_zh_batch_scale,
    recommended_en_batch_scale
  };
}

/** Build context by reading workspace artifacts + queue candidate shapes. */
export function buildTrafficAllocationContext(
  cwd: string,
  candidates: TrafficAllocationCandidateLike[]
): TrafficAllocationContext {
  const revPath = path.join(cwd, "generated", "asset-seo-revenue-summary.json");
  const revenueSummary = readJson<AssetSeoRevenueSummaryArtifact | null>(revPath, null);

  const domPath = path.join(cwd, "generated", "asset-seo-ai-citation-dominance.json");
  const dominance = readJson<AssetSeoAiCitationDominanceArtifact | null>(domPath, null);

  const riskPath = path.join(cwd, "generated", "seo-risk-context.json");
  const riskFile = readJson<{ deprioritized_topic_prefixes?: string[] }>(riskPath, {});
  const riskDeprioritizePrefixes = new Set(
    (riskFile.deprioritized_topic_prefixes || []).map((s) => String(s).toLowerCase())
  );

  const hqPath = path.join(cwd, "generated", "agent_high_quality_assets.json");
  const hqRows = normalizeAssetRows(readJson(hqPath, []));
  const hqTopics = hqRows.map((r) => r.normalized_topic || r.topic || "").filter(Boolean);

  const wfPath = path.join(cwd, "generated", "workflow-assets-retrieval.json");
  const wfRows = normalizeAssetRows(readJson(wfPath, { items: [] }));
  const wfTopics = wfRows.map((r) => r.normalized_topic || r.topic || "").filter(Boolean);

  const uniqueTopicKeys = [...new Set(candidates.map((c) => c.topic_key).filter(Boolean))];
  const uniqueWorkflowIds: string[] = [];
  const uniquePageTypes: string[] = [];
  for (const c of candidates) {
    const pt = c.lane === "zh" ? "zh_search" : "en_topic_registry";
    if (!uniquePageTypes.includes(pt)) uniquePageTypes.push(pt);
    let wf = "unknown";
    if (c.lane === "zh" && c.id.startsWith("zh:")) {
      const slug = c.id.slice(3);
      const m = slug.match(/^v63-(tiktok|youtube|instagram)-/i);
      wf = m ? m[1].toLowerCase() : slug.split("-")[0] || "zh_general";
    } else if (c.lane === "en") wf = "en_topic_registry";
    if (!uniqueWorkflowIds.includes(wf)) uniqueWorkflowIds.push(wf);
  }

  return {
    total_daily_capacity: V161_TOTAL_DAILY_CAPACITY,
    revenueSummary,
    dominance,
    riskDeprioritizePrefixes,
    hqTopics,
    wfTopics,
    uniqueTopicKeys,
    uniqueWorkflowIds,
    uniquePageTypes
  };
}

/** Topic / suppressed segment overlap (symmetric substring + normalized key). */
export function topicAllocationSegmentOverlaps(topicKey: string, suppressedSegment: string, slugPrefix: string | null): boolean {
  const t = normalizeTopicKey(topicKey) || topicKey.toLowerCase().trim();
  const seg = suppressedSegment.toLowerCase();
  const nk = normalizeTopicKey(suppressedSegment) || seg;
  if (t === nk || (nk && (t.includes(nk) || nk.includes(t)))) return true;
  if (slugPrefix) {
    const p = slugPrefix.toLowerCase();
    if (p && (nk.includes(p) || p.includes(nk) || seg.includes(p) || p.includes(seg))) return true;
  }
  return false;
}

/** Queue row adjustment from precomputed allocation (bounded). */
export function computeV161TrafficAllocationQueueBonus(
  candidate: TrafficAllocationCandidateLike,
  alloc: TrafficAllocationResult
): number {
  const tk = candidate.topic_key;
  const pref = allocationCandidateTopicPrefix(candidate);
  if (
    alloc.suppressed_segments.some(
      (s) => s.kind === "topic" && topicAllocationSegmentOverlaps(tk, s.segment, pref)
    )
  ) {
    return -V161_MAX_QUEUE_ALLOCATION_PENALTY;
  }
  const entry = alloc.topic_allocations[tk];
  if (!entry) {
    return 0;
  }
  if (entry.tier === "exploration" || entry.tier === "high") {
    return Math.min(V161_MAX_QUEUE_ALLOCATION_BONUS, 4 + Math.min(1, Math.floor(entry.units / 4)));
  }
  if (entry.tier === "mid") return 3;
  if (entry.units >= 1) return 1;
  return 0;
}

function allocationCandidateTopicPrefix(c: TrafficAllocationCandidateLike): string | null {
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
