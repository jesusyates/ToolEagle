import {
  computeTrafficAllocation,
  scoreTopicAllocationOpportunity,
  V161_MAX_TOPIC_UNIT_SHARE,
  V161_TOTAL_DAILY_CAPACITY,
  type TrafficAllocationContext,
  type TrafficAllocationResult
} from "../asset-seo-traffic-allocation";
import {
  buildTrafficAllocationSummaryArtifact,
  type AssetSeoTrafficAllocationSummaryArtifact
} from "../asset-seo-traffic-allocation-summary";

function baseCtx(over: Partial<TrafficAllocationContext> = {}): TrafficAllocationContext {
  return {
    total_daily_capacity: V161_TOTAL_DAILY_CAPACITY,
    revenueSummary: null,
    dominance: null,
    riskDeprioritizePrefixes: new Set(),
    hqTopics: [],
    wfTopics: [],
    uniqueTopicKeys: ["alpha", "beta", "gamma"],
    uniqueWorkflowIds: ["tiktok"],
    uniquePageTypes: ["zh_search"],
    ...over
  };
}

describe("V161 scoreTopicAllocationOpportunity", () => {
  test("risk deprioritize slashes score", () => {
    const ctx = baseCtx({
      riskDeprioritizePrefixes: new Set(["alpha"])
    });
    const a = scoreTopicAllocationOpportunity("alpha", ctx);
    expect(a.risk_component).toBe(-22);
    expect(a.score).toBeLessThan(30);
  });

  test("revenue map lifts revenue_component", () => {
    const ctx = baseCtx({
      revenueSummary: {
        version: "v158.0",
        updatedAt: "",
        top_topics_by_revenue: [],
        top_topics_by_conversion_rate: [],
        highest_rps_topics: [],
        underperforming_topics: [],
        topic_revenue_score: { alpha: 1 },
        workflow_revenue_score: {},
        notes: [],
        raw: { top_revenue_topics: [], top_conversion_pages: [], high_intent_segments: [], low_value_segments: [] }
      }
    });
    const a = scoreTopicAllocationOpportunity("alpha", ctx);
    expect(a.revenue_component).toBe(22);
  });
});

describe("V161 computeTrafficAllocation", () => {
  test("per-topic units respect cap", () => {
    const keys = Array.from({ length: 20 }, (_, i) => `topic-${i}`);
    const ctx = baseCtx({ uniqueTopicKeys: keys });
    const r = computeTrafficAllocation(ctx);
    for (const u of Object.values(r.topic_allocations)) {
      expect(u.units).toBeLessThanOrEqual(V161_MAX_TOPIC_UNIT_SHARE);
    }
  });

  test("many topics split main pool without single-topic hoarding", () => {
    const keys = Array.from({ length: 80 }, (_, i) => `topic-${i}`);
    const ctx = baseCtx({ uniqueTopicKeys: keys });
    const r = computeTrafficAllocation(ctx);
    const unitSum = Object.values(r.topic_allocations).reduce((a, x) => a + x.units, 0);
    const exploration = Math.max(2, Math.round(V161_TOTAL_DAILY_CAPACITY * 0.08));
    const mainPool = V161_TOTAL_DAILY_CAPACITY - exploration;
    expect(unitSum).toBe(mainPool);
    const maxU = Math.max(...Object.values(r.topic_allocations).map((x) => x.units));
    expect(maxU).toBeLessThanOrEqual(V161_MAX_TOPIC_UNIT_SHARE);
    expect(maxU).toBeLessThan(mainPool - 5);
  });

  test("high risk topics suppressed", () => {
    const ctx = baseCtx({
      uniqueTopicKeys: ["safe-topic", "risky-deep-topic"],
      riskDeprioritizePrefixes: new Set(["risky-deep"])
    });
    const r = computeTrafficAllocation(ctx);
    expect(r.suppressed_segments.some((s) => s.segment.includes("risky-deep"))).toBe(true);
    expect(r.topic_allocations["risky-deep-topic"]).toBeUndefined();
  });

  test("exploration quota list is bounded subset of topics", () => {
    const ctx = baseCtx();
    const r = computeTrafficAllocation(ctx);
    expect(Array.isArray(r.exploration_quota_assignments)).toBe(true);
    expect(r.exploration_quota_assignments.length).toBeLessThanOrEqual(12);
    for (const t of r.exploration_quota_assignments) {
      expect(ctx.uniqueTopicKeys).toContain(t);
    }
  });

  test("batch scales stay within V161 clamps", () => {
    const r = computeTrafficAllocation(baseCtx());
    expect(r.recommended_zh_batch_scale).toBeGreaterThanOrEqual(0.88);
    expect(r.recommended_zh_batch_scale).toBeLessThanOrEqual(1.08);
    expect(r.recommended_en_batch_scale).toBeGreaterThanOrEqual(0.88);
    expect(r.recommended_en_batch_scale).toBeLessThanOrEqual(1.08);
  });
});

describe("V161 traffic allocation summary artifact", () => {
  test("buildTrafficAllocationSummaryArtifact shape", () => {
    const alloc: TrafficAllocationResult = {
      version: "v161.0",
      total_daily_capacity: 100,
      topic_allocations: {
        a: { units: 10, score: 80, tier: "high" },
        b: { units: 2, score: 40, tier: "low" }
      },
      workflow_allocations: { tiktok: { units: 5, score: 60, tier: "mid" } },
      page_type_allocations: { zh_search: { units: 8, score: 70, tier: "high" } },
      suppressed_segments: [{ segment: "bad", kind: "topic", reason: "low_composite_score" }],
      exploration_quota_assignments: ["a"],
      allocation_reasoning: ["test"],
      notes: ["n"],
      recommended_zh_batch_scale: 1,
      recommended_en_batch_scale: 1
    };
    const s: AssetSeoTrafficAllocationSummaryArtifact = buildTrafficAllocationSummaryArtifact(alloc);
    expect(s.version).toBe("v161.0");
    expect(s.total_daily_capacity).toBe(100);
    expect(s.top_allocated_topics[0].topic_key).toBe("a");
    expect(s.top_allocated_topics[0].units).toBe(10);
    expect(Array.isArray(s.suppressed_segments)).toBe(true);
    expect(s.exploration_quota_assignments).toEqual(["a"]);
    expect(typeof s.updatedAt).toBe("string");
  });
});
