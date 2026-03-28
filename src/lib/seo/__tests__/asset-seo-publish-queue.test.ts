import {
  buildAssetSeoPublishQueue,
  computeAiCostPenalty,
  computeRevenuePriorityBonus,
  computeRetrievalPriorityBonus,
  scorePublishQueueItem,
  type PublishQueueCandidate
} from "../asset-seo-publish-queue";
import type { AssetSeoRevenueSummaryArtifact } from "../asset-seo-revenue-summary";

describe("asset-seo-publish-queue V153", () => {
  test("computeRetrievalPriorityBonus caps at 3", () => {
    expect(computeRetrievalPriorityBonus("instagram growth tips", ["instagram growth"], [])).toBeLessThanOrEqual(3);
    expect(computeRetrievalPriorityBonus("unrelated", [], [])).toBe(0);
  });

  test("computeAiCostPenalty tiers", () => {
    expect(computeAiCostPenalty("low")).toBe(0);
    expect(computeAiCostPenalty("medium")).toBe(1);
    expect(computeAiCostPenalty("high")).toBe(4);
  });

  test("scorePublishQueueItem applies bonus and penalty", () => {
    const c: PublishQueueCandidate = {
      id: "t1",
      lane: "zh",
      topic_key: "tiktok 涨粉",
      base_score: 40,
      model_cost_tier: "high"
    };
    const ctx = {
      hqTopics: ["tiktok"],
      wfTopics: [],
      highAiTopics: new Set<string>()
    };
    const s = scorePublishQueueItem(c, { ...ctx, revenueSummary: null });
    expect(s.retrieval_priority_bonus).toBeGreaterThanOrEqual(0);
    expect(s.ai_cost_penalty).toBeGreaterThanOrEqual(4);
    expect(s.revenue_priority_bonus).toBe(0);
    expect(s.low_revenue_penalty).toBe(0);
    expect(s.effective_score).toBe(
      c.base_score + s.retrieval_priority_bonus - s.ai_cost_penalty + s.revenue_priority_bonus - s.low_revenue_penalty
    );
  });

  test("V158 revenue bonus respects summary and risk dampen", () => {
    const summary: AssetSeoRevenueSummaryArtifact = {
      version: "v158.0",
      updatedAt: "",
      top_topics_by_revenue: [],
      top_topics_by_conversion_rate: [],
      highest_rps_topics: [],
      underperforming_topics: [],
      topic_revenue_score: { "tiktok": 0.9 },
      workflow_revenue_score: {},
      notes: [],
      raw: { top_revenue_topics: [], top_conversion_pages: [], high_intent_segments: [], low_value_segments: [] }
    };
    const c: PublishQueueCandidate = {
      id: "zh:tiktok-zhangfen-ruhe",
      lane: "zh",
      topic_key: "tiktok 涨粉教程",
      base_score: 50,
      model_cost_tier: "low"
    };
    const high = computeRevenuePriorityBonus(c, summary, new Set());
    expect(high).toBeGreaterThanOrEqual(8);
    const damped = computeRevenuePriorityBonus(c, summary, new Set(["tiktok-zhangfen"]));
    expect(damped).toBeLessThanOrEqual(high);
  });

  test("buildAssetSeoPublishQueue sorts by effective_score", () => {
    const candidates: PublishQueueCandidate[] = [
      { id: "a", lane: "zh", topic_key: "low", base_score: 10, model_cost_tier: "high" },
      { id: "b", lane: "zh", topic_key: "high", base_score: 50, model_cost_tier: "low" }
    ];
    const out = buildAssetSeoPublishQueue(candidates, process.cwd());
    expect(out.length).toBe(2);
    expect(out[0].effective_score).toBeGreaterThanOrEqual(out[1].effective_score);
  });
});
