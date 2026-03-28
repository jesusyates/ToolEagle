/**
 * V158 — Revenue intelligence: segment metrics from monetization events + rankings.
 */

import {
  aggregateMonetizationEvents,
  type MonetizationEventRow
} from "./asset-seo-monetization-aggregation";

export type RevenueSegmentMetrics = {
  segment_key: string;
  segment_kind: "topic" | "workflow" | "page_type";
  shown: number;
  clicked: number;
  converted: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
  /** revenue / max(shown, 1) */
  revenue_per_visit: number;
  /** blended engagement-to-monetization proxy, 0..1 */
  monetized_session_rate: number;
  /** mean generations before convert (converting rows only); null if unknown */
  avg_generation_per_user: number | null;
  /** revenue / max(total gen credits attributed, 1) */
  revenue_per_generation: number;
};

export type RevenueIntelligenceOutput = {
  segments: RevenueSegmentMetrics[];
  top_revenue_topics: RevenueSegmentMetrics[];
  top_conversion_pages: RevenueSegmentMetrics[];
  high_intent_segments: RevenueSegmentMetrics[];
  low_value_segments: RevenueSegmentMetrics[];
};

function ratio(n: number, d: number): number {
  return d > 0 ? Number((n / d).toFixed(6)) : 0;
}

/** Blend CVR + CTR into a single 0..1 “monetized attention” proxy. */
export function computeMonetizedSessionRate(cvr: number, ctr: number): number {
  const raw = cvr * 0.65 + ctr * 0.35;
  return Math.max(0, Math.min(1, Number(raw.toFixed(4))));
}

export function enrichSegment(
  segment_key: string,
  segment_kind: RevenueSegmentMetrics["segment_kind"],
  shown: number,
  clicked: number,
  converted: number,
  revenue: number,
  avgGenFromRows: number | null
): RevenueSegmentMetrics {
  const ctr = ratio(clicked, shown);
  const conversion_rate = ratio(converted, shown);
  const revenue_per_visit = ratio(revenue, Math.max(shown, 1));
  const monetized_session_rate = computeMonetizedSessionRate(conversion_rate, ctr);
  const avg_generation_per_user = avgGenFromRows != null ? Number(avgGenFromRows.toFixed(2)) : null;
  const genDenom =
    avgGenFromRows != null && converted > 0 ? Math.max(avgGenFromRows * converted, 1) : Math.max(converted, 1);
  const revenue_per_generation = ratio(revenue, genDenom);
  return {
    segment_key,
    segment_kind,
    shown,
    clicked,
    converted,
    revenue: Number(revenue.toFixed(2)),
    ctr,
    conversion_rate,
    revenue_per_visit,
    monetized_session_rate,
    avg_generation_per_user,
    revenue_per_generation
  };
}

function avgGenerationForTopic(rows: MonetizationEventRow[], topic: string): number | null {
  const conv = rows.filter(
    (r) =>
      String(r.topic || "") === topic &&
      (r.event_name === "upgrade_converted" || r.event_name === "conversion_completed") &&
      typeof r.generation_count_before_conversion === "number"
  );
  if (conv.length === 0) return null;
  const sum = conv.reduce((a, r) => a + Number(r.generation_count_before_conversion ?? 2), 0);
  return sum / conv.length;
}

function avgGenerationForWorkflow(rows: MonetizationEventRow[], workflow_id: string): number | null {
  const conv = rows.filter(
    (r) =>
      String(r.workflow_id || "") === workflow_id &&
      (r.event_name === "upgrade_converted" || r.event_name === "conversion_completed") &&
      typeof r.generation_count_before_conversion === "number"
  );
  if (conv.length === 0) return null;
  const sum = conv.reduce((a, r) => a + Number(r.generation_count_before_conversion ?? 2), 0);
  return sum / conv.length;
}

function avgGenerationForPageType(rows: MonetizationEventRow[], page_type: string): number | null {
  const conv = rows.filter(
    (r) =>
      String(r.page_type || "") === page_type &&
      (r.event_name === "upgrade_converted" || r.event_name === "conversion_completed") &&
      typeof r.generation_count_before_conversion === "number"
  );
  if (conv.length === 0) return null;
  const sum = conv.reduce((a, r) => a + Number(r.generation_count_before_conversion ?? 2), 0);
  return sum / conv.length;
}

/**
 * Full intelligence from raw monetization rows (server ingest / export).
 */
export function analyzePublishingRevenueIntelligence(rows: MonetizationEventRow[]): RevenueIntelligenceOutput {
  const agg = aggregateMonetizationEvents(rows);

  const topicSegs = agg.topics.map((t) =>
    enrichSegment(t.topic, "topic", t.shown, t.clicked, t.converted, t.revenue, avgGenerationForTopic(rows, t.topic))
  );
  const wfSegs = agg.workflows.map((w) =>
    enrichSegment(
      w.workflow_id,
      "workflow",
      w.shown,
      w.clicked,
      w.converted,
      w.revenue,
      avgGenerationForWorkflow(rows, w.workflow_id)
    )
  );
  const pageSegs = (agg.page_types || []).map((p) =>
    enrichSegment(
      p.page_type,
      "page_type",
      p.shown,
      p.clicked,
      p.converted,
      p.revenue,
      avgGenerationForPageType(rows, p.page_type)
    )
  );

  const segments = [...topicSegs, ...wfSegs, ...pageSegs];

  const top_revenue_topics = [...topicSegs].sort((a, b) => b.revenue - a.revenue).slice(0, 20);

  const top_conversion_pages = [...topicSegs, ...pageSegs]
    .filter((s) => s.shown >= 3)
    .sort((a, b) => b.conversion_rate - a.conversion_rate || b.revenue_per_visit - a.revenue_per_visit)
    .slice(0, 20);

  const high_intent_segments = segments.filter(
    (s) => s.shown >= 5 && (s.conversion_rate >= 0.06 || s.monetized_session_rate >= 0.12)
  );

  const low_value_segments = segments
    .filter((s) => s.shown >= 8 && s.revenue_per_visit <= 0.01 && s.conversion_rate < 0.03)
    .sort((a, b) => a.revenue_per_visit - b.revenue_per_visit)
    .slice(0, 25);

  return {
    segments,
    top_revenue_topics,
    top_conversion_pages,
    high_intent_segments,
    low_value_segments
  };
}

/** Alias for V158 spec naming */
export const analyzeRevenueIntelligence = analyzePublishingRevenueIntelligence;

/** Normalize for fuzzy topic match (queue / CTA). */
export function normalizeTopicKey(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map topic_key to best matching segment score 0..1 (revenue_per_visit percentile proxy).
 */
export function topicRevenueScore(topicKey: string, topTopics: RevenueSegmentMetrics[]): number {
  const t = normalizeTopicKey(topicKey);
  if (!t || topTopics.length === 0) return 0;
  let best = 0;
  for (const seg of topTopics) {
    const k = normalizeTopicKey(seg.segment_key);
    if (!k) continue;
    if (t.includes(k) || k.includes(t)) {
      const rpv = seg.revenue_per_visit;
      const cvr = seg.conversion_rate;
      const score = Math.min(1, rpv / 5 + cvr * 4);
      best = Math.max(best, score);
    }
  }
  return Number(best.toFixed(4));
}
