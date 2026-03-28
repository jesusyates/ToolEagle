import {
  applyRuntimeMonetizationTriggerBias,
  buildRuntimeSegmentStrategy,
  buildRuntimeSegmentStrategyContext
} from "../asset-seo-segment-strategy-runtime";
import { buildSegmentStrategy } from "../asset-seo-segment-strategy";
import { selectCtaVariantWithRevenueContext } from "../asset-seo-cta-optimizer";
import type { AssetSeoRevenueSummaryArtifact } from "../asset-seo-revenue-summary";
import type { RevenueSegmentMetrics } from "../asset-seo-revenue-intelligence";

const emptySummary: AssetSeoRevenueSummaryArtifact = {
  version: "v158.0",
  updatedAt: "",
  top_topics_by_revenue: [],
  top_topics_by_conversion_rate: [],
  highest_rps_topics: [],
  underperforming_topics: [],
  topic_revenue_score: {},
  workflow_revenue_score: {},
  notes: [],
  raw: { top_revenue_topics: [], top_conversion_pages: [], high_intent_segments: [], low_value_segments: [] }
};

function megaSeg(): RevenueSegmentMetrics {
  return {
    segment_key: "mega",
    segment_kind: "topic",
    shown: 100,
    clicked: 20,
    converted: 15,
    revenue: 80,
    ctr: 0.2,
    conversion_rate: 0.15,
    revenue_per_visit: 3.5,
    monetized_session_rate: 0.4,
    avg_generation_per_user: 2,
    revenue_per_generation: 1
  };
}

describe("V162.1 buildRuntimeSegmentStrategyContext", () => {
  test("produces valid context for minimal input", () => {
    const ctx = buildRuntimeSegmentStrategyContext({
      lane: "en",
      topic: "test topic",
      workflow_id: "tiktok",
      monetization_tier: "medium",
      generation_index: 1,
      lifetime_generation_count: 1,
      retrieval_used: false,
      revenue_summary: null
    });
    expect(ctx.lane).toBe("en");
    expect(ctx.topic_key).toBe("test topic");
    expect(ctx.risk_deprioritize).toBe(false);
  });

  test("ai_page + retrieval raises citation signals", () => {
    const a = buildRuntimeSegmentStrategyContext({
      lane: "zh",
      topic: "x",
      workflow_id: "w",
      entry_source: "ai_page",
      intent: "wants_examples",
      monetization_tier: "medium",
      generation_index: 1,
      lifetime_generation_count: 1,
      retrieval_used: true,
      revenue_summary: null
    });
    const b = buildRuntimeSegmentStrategyContext({
      lane: "zh",
      topic: "x",
      workflow_id: "w",
      monetization_tier: "medium",
      generation_index: 1,
      lifetime_generation_count: 1,
      retrieval_used: false,
      revenue_summary: null
    });
    expect((a.ai_citation_likely ?? 0) > (b.ai_citation_likely ?? 0)).toBe(true);
  });
});

describe("V162.1 buildRuntimeSegmentStrategy fallback", () => {
  test("returns strategy object", () => {
    const s = buildRuntimeSegmentStrategy({
      lane: "en",
      topic: "",
      workflow_id: "tiktok",
      monetization_tier: "low",
      generation_index: 1,
      lifetime_generation_count: 0,
      retrieval_used: false,
      revenue_summary: null
    });
    expect(s.segment_key).toBeTruthy();
    expect(s.recommended_cta_style).toMatch(/minimal|standard|strong/);
    expect(s.recommended_allocation_weight).toBeGreaterThanOrEqual(0.92);
    expect(s.recommended_allocation_weight).toBeLessThanOrEqual(1.08);
  });
});

describe("V162.1 applyRuntimeMonetizationTriggerBias", () => {
  test("softens hard trigger for discovery-like segments", () => {
    const strat = buildSegmentStrategy({
      lane: "zh",
      topic_key: "z",
      ai_citation_likely: 0.35,
      low_revenue_penalty: 0
    });
    expect(strat.segment_key).toBe("seo_discovery");
    expect(applyRuntimeMonetizationTriggerBias("hard", strat, { monetization_tier: "medium", generation_index: 1 })).toBe(
      "soft"
    );
  });

  test("does not strengthen on first generation when base soft", () => {
    const strat = buildSegmentStrategy({
      lane: "en",
      topic_key: "high value topic",
      revenue_priority_bonus: 10,
      high_revenue_signal: true,
      high_conversion_match: true,
      ai_citation_likely: 0.4
    });
    const out = applyRuntimeMonetizationTriggerBias("soft", strat, { monetization_tier: "high", generation_index: 1 });
    expect(out).toBe("soft");
  });
});

describe("V162.1 CTA bias with runtime segment", () => {
  test("explicit minimal segmentStrategy forces soft trigger in CTA layer", () => {
    const summary: AssetSeoRevenueSummaryArtifact = {
      ...emptySummary,
      top_topics_by_revenue: [megaSeg()],
      topic_revenue_score: { mega: 0.95 }
    };
    const base = selectCtaVariantWithRevenueContext({
      topicKey: "mega brand",
      baseTriggerType: "hard",
      revenueSummary: summary,
      seed: "s"
    });
    const biased = selectCtaVariantWithRevenueContext({
      topicKey: "mega brand",
      baseTriggerType: "hard",
      revenueSummary: summary,
      seed: "s",
      segmentStrategy: {
        segment_key: "seo_discovery",
        recommended_cta_style: "minimal",
        monetization_role: "light_touch"
      }
    });
    expect(base.trigger_type).toBe("hard");
    expect(biased.trigger_type).toBe("soft");
  });
});
