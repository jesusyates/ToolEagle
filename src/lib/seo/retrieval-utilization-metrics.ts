/**
 * V166 — Aggregate retrieval telemetry rows (JSONL events) for utilization reporting.
 */

export type RetrievalTelemetryEventName =
  | "retrieval_hit_recorded"
  | "retrieval_fallback_reason_recorded"
  | "retrieval_bias_applied";

export type RetrievalTelemetryRow = {
  ts?: string;
  event?: string;
  keyword?: string;
  platform?: string;
  goal?: string;
  reason?: string;
  top_score?: number;
  bias_applied?: boolean;
  bias_factor?: number;
  primary_lane?: string | null;
};

export type TopicRetrievalStats = {
  topic_key: string;
  retrieval_hits: number;
  retrieval_fallbacks: number;
  hit_rate: number;
};

export type RetrievalUtilizationAggregate = {
  /** Window: retrieval_hits / (hits + fallbacks); 0 if no decisions. */
  retrieval_share: number;
  ai_share: number;
  retrieval_hits: number;
  retrieval_fallbacks: number;
  top_retrieval_topics: TopicRetrievalStats[];
  weak_retrieval_topics: TopicRetrievalStats[];
  fallback_reason_breakdown: Record<string, number>;
};

function topicKey(row: RetrievalTelemetryRow): string {
  const k = String(row.keyword || "").trim();
  if (k) return k;
  const p = String(row.platform || "").trim();
  const g = String(row.goal || "").trim();
  return [p, g].filter(Boolean).join(":") || "_unknown";
}

/**
 * Core counts from decision events only (excludes `retrieval_bias_applied`).
 */
export function aggregateRetrievalUsage(rows: RetrievalTelemetryRow[]): RetrievalUtilizationAggregate {
  const decisions = rows.filter(
    (r) =>
      r.event === "retrieval_hit_recorded" || r.event === "retrieval_fallback_reason_recorded"
  );
  const hits = decisions.filter((r) => r.event === "retrieval_hit_recorded");
  const fallbacks = decisions.filter((r) => r.event === "retrieval_fallback_reason_recorded");
  const nHit = hits.length;
  const nFb = fallbacks.length;
  const denom = nHit + nFb;
  const retrieval_share = denom > 0 ? Math.round((nHit / denom) * 1000) / 1000 : 0;
  const ai_share = denom > 0 ? Math.round((nFb / denom) * 1000) / 1000 : 0;

  const byTopic = computeTopicRetrievalPerformance(rows);
  const sortedTopics = [...byTopic].sort((a, b) => b.hit_rate - a.hit_rate);
  const minAttemptsWeak = 3;
  const weak = [...byTopic]
    .filter((t) => t.retrieval_hits + t.retrieval_fallbacks >= minAttemptsWeak)
    .sort((a, b) => a.hit_rate - b.hit_rate)
    .slice(0, 8);
  const top = sortedTopics
    .filter((t) => t.retrieval_hits + t.retrieval_fallbacks >= 2)
    .slice(0, 8);

  return {
    retrieval_share,
    ai_share,
    retrieval_hits: nHit,
    retrieval_fallbacks: nFb,
    top_retrieval_topics: top,
    weak_retrieval_topics: weak,
    fallback_reason_breakdown: computeRetrievalFallbackReasons(rows)
  };
}

export function computeTopicRetrievalPerformance(rows: RetrievalTelemetryRow[]): TopicRetrievalStats[] {
  const map = new Map<string, { hits: number; fb: number }>();
  for (const r of rows) {
    if (r.event !== "retrieval_hit_recorded" && r.event !== "retrieval_fallback_reason_recorded") continue;
    const k = topicKey(r);
    const cur = map.get(k) ?? { hits: 0, fb: 0 };
    if (r.event === "retrieval_hit_recorded") cur.hits += 1;
    else cur.fb += 1;
    map.set(k, cur);
  }
  return [...map.entries()].map(([topic_key, v]) => {
    const t = v.hits + v.fb;
    return {
      topic_key,
      retrieval_hits: v.hits,
      retrieval_fallbacks: v.fb,
      hit_rate: t > 0 ? Math.round((v.hits / t) * 1000) / 1000 : 0
    };
  });
}

export function computeWorkflowRetrievalPerformance(rows: RetrievalTelemetryRow[]): TopicRetrievalStats[] {
  const map = new Map<string, { hits: number; fb: number }>();
  for (const r of rows) {
    if (r.event !== "retrieval_hit_recorded" && r.event !== "retrieval_fallback_reason_recorded") continue;
    const k = String(r.platform || "_unknown").trim() || "_unknown";
    const cur = map.get(k) ?? { hits: 0, fb: 0 };
    if (r.event === "retrieval_hit_recorded") cur.hits += 1;
    else cur.fb += 1;
    map.set(k, cur);
  }
  return [...map.entries()].map(([topic_key, v]) => {
    const t = v.hits + v.fb;
    return {
      topic_key,
      retrieval_hits: v.hits,
      retrieval_fallbacks: v.fb,
      hit_rate: t > 0 ? Math.round((v.hits / t) * 1000) / 1000 : 0
    };
  });
}

export function computeRetrievalFallbackReasons(rows: RetrievalTelemetryRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (r.event !== "retrieval_fallback_reason_recorded") continue;
    const reason = String(r.reason || "unknown").trim() || "unknown";
    out[reason] = (out[reason] ?? 0) + 1;
  }
  return out;
}

export function topFallbackReason(breakdown: Record<string, number>): string | null {
  const entries = Object.entries(breakdown);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
