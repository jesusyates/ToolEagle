import {
  aggregateRetrievalUsage,
  computeRetrievalFallbackReasons,
  computeTopicRetrievalPerformance,
  topFallbackReason,
  type RetrievalTelemetryRow
} from "@/lib/seo/retrieval-utilization-metrics";

describe("retrieval-utilization-metrics", () => {
  const rows: RetrievalTelemetryRow[] = [
    { event: "retrieval_hit_recorded", keyword: "a", platform: "tiktok" },
    { event: "retrieval_fallback_reason_recorded", keyword: "a", platform: "tiktok", reason: "score_below_threshold" },
    { event: "retrieval_hit_recorded", keyword: "b", platform: "youtube" },
    { event: "retrieval_bias_applied", platform: "tiktok", bias_factor: 0.92 }
  ];

  it("aggregateRetrievalUsage computes window share excluding bias events", () => {
    const agg = aggregateRetrievalUsage(rows);
    expect(agg.retrieval_hits).toBe(2);
    expect(agg.retrieval_fallbacks).toBe(1);
    expect(agg.retrieval_share).toBe(0.667);
    expect(agg.ai_share).toBe(0.333);
  });

  it("computeRetrievalFallbackReasons aggregates taxonomy", () => {
    const br = computeRetrievalFallbackReasons(rows);
    expect(br.score_below_threshold).toBe(1);
    expect(topFallbackReason(br)).toBe("score_below_threshold");
  });

  it("computeTopicRetrievalPerformance groups by keyword", () => {
    const tp = computeTopicRetrievalPerformance(rows);
    const a = tp.find((t) => t.topic_key === "a");
    expect(a?.retrieval_hits).toBe(1);
    expect(a?.retrieval_fallbacks).toBe(1);
    expect(a?.hit_rate).toBe(0.5);
  });
});
