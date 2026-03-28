import {
  buildSegmentStrategy,
  classifyContentRole,
  classifyMonetizationSegment,
  classifyTrafficSegment,
  segmentStrategyQueueBonus,
  V162_MAX_ALLOCATION_WEIGHT,
  V162_MAX_SEGMENT_QUEUE_BONUS,
  V162_MIN_ALLOCATION_WEIGHT,
  V162_MIN_SEGMENT_QUEUE_BONUS,
  type SegmentStrategyContext
} from "../asset-seo-segment-strategy";
import { buildSegmentStrategyArtifactFromRows } from "../asset-seo-segment-strategy-summary";
import { selectCtaVariantWithRevenueContext } from "../asset-seo-cta-optimizer";
import { computeConversionPathAmplification } from "../asset-seo-conversion-path";
import type { AssetSeoRevenueSummaryArtifact } from "../asset-seo-revenue-summary";
import type { RevenueSegmentMetrics } from "../asset-seo-revenue-intelligence";
import { buildAssetSeoPublishQueue, type PublishQueueCandidate } from "../asset-seo-publish-queue";

describe("V162 classifyTrafficSegment", () => {
  test("risk + zh → seo_discovery", () => {
    expect(
      classifyTrafficSegment({
        lane: "zh",
        topic_key: "x",
        risk_deprioritize: true
      })
    ).toBe("seo_discovery");
  });

  test("exploration quota → emerging_topic_exploration", () => {
    expect(
      classifyTrafficSegment({
        lane: "zh",
        topic_key: "alpha",
        in_exploration_quota: true,
        ai_citation_likely: 0.9
      })
    ).toBe("emerging_topic_exploration");
  });

  test("strong citation + dominance → ai_citation_discovery", () => {
    expect(
      classifyTrafficSegment({
        lane: "zh",
        topic_key: "x",
        ai_citation_likely: 0.6,
        ai_citation_dominance_bonus: 3,
        weak_ai_citation_penalty: 0
      })
    ).toBe("ai_citation_discovery");
  });
});

describe("V162 buildSegmentStrategy", () => {
  test("weights stay bounded", () => {
    const s = buildSegmentStrategy({
      lane: "en",
      topic_key: "tool-topic",
      revenue_priority_bonus: 10,
      high_revenue_signal: true,
      high_conversion_match: true
    });
    expect(s.recommended_allocation_weight).toBeGreaterThanOrEqual(V162_MIN_ALLOCATION_WEIGHT);
    expect(s.recommended_allocation_weight).toBeLessThanOrEqual(V162_MAX_ALLOCATION_WEIGHT);
    expect(classifyContentRole(s.segment_key)).toBeTruthy();
    expect(classifyMonetizationSegment(s.segment_key, {} as SegmentStrategyContext)).toBeTruthy();
  });

  test("queue bonus bounded", () => {
    const hi = buildSegmentStrategy({
      lane: "en",
      topic_key: "t",
      revenue_priority_bonus: 10,
      high_revenue_signal: true
    });
    const lo = buildSegmentStrategy({
      lane: "zh",
      topic_key: "t",
      risk_deprioritize: true
    });
    expect(segmentStrategyQueueBonus(hi)).toBeLessThanOrEqual(V162_MAX_SEGMENT_QUEUE_BONUS);
    expect(segmentStrategyQueueBonus(lo)).toBeGreaterThanOrEqual(V162_MIN_SEGMENT_QUEUE_BONUS);
  });
});

describe("V162 segment strategy artifact", () => {
  test("shape", () => {
    const s = buildSegmentStrategy({ lane: "zh", topic_key: "z", ai_citation_likely: 0.4 });
    const art = buildSegmentStrategyArtifactFromRows([
      { topic_key: "z", strategy: s, segment_strategy_bonus: 1 }
    ]);
    expect(art.version).toMatch(/^v162/);
    expect(art.segment_distribution[s.segment_key]).toBe(1);
    expect(Array.isArray(art.top_segments_by_value)).toBe(true);
    expect(art.segment_bias_counts.prioritized + art.segment_bias_counts.neutral + art.segment_bias_counts.deprioritized).toBe(1);
  });
});

describe("V162 CTA / conversion integration", () => {
  const megaSeg: RevenueSegmentMetrics = {
    segment_key: "mega",
    segment_kind: "topic",
    shown: 200,
    clicked: 50,
    converted: 40,
    revenue: 200,
    ctr: 0.25,
    conversion_rate: 0.2,
    revenue_per_visit: 4.5,
    monetized_session_rate: 0.5,
    avg_generation_per_user: 2,
    revenue_per_generation: 1
  };
  const summary: AssetSeoRevenueSummaryArtifact = {
    version: "v158.0",
    updatedAt: "",
    top_topics_by_revenue: [megaSeg],
    top_topics_by_conversion_rate: [],
    highest_rps_topics: [],
    underperforming_topics: [],
    topic_revenue_score: { mega: 0.9 },
    workflow_revenue_score: {},
    notes: [],
    raw: { top_revenue_topics: [], top_conversion_pages: [], high_intent_segments: [], low_value_segments: [] }
  };

  test("selectCtaVariantWithRevenueContext respects segment minimal style", () => {
    const base = selectCtaVariantWithRevenueContext({
      topicKey: "mega flow",
      baseTriggerType: "hard",
      revenueSummary: summary,
      seed: "s1"
    });
    const seg = buildSegmentStrategy({
      lane: "zh",
      topic_key: "mega flow",
      risk_deprioritize: true
    });
    const biased = selectCtaVariantWithRevenueContext({
      topicKey: "mega flow",
      baseTriggerType: "hard",
      revenueSummary: summary,
      seed: "s1",
      segmentStrategy: {
        segment_key: seg.segment_key,
        recommended_cta_style: seg.recommended_cta_style,
        monetization_role: seg.monetization_role
      }
    });
    expect(biased.trigger_type).toBe("soft");
    expect(base.trigger_type).toBe("hard");
  });

  test("computeConversionPathAmplification applies bounded segment weight", () => {
    const base = computeConversionPathAmplification({
      workflow_id: "tiktok",
      normalized_topic: "mega",
      page_type: "tool",
      revenueSummary: summary,
      riskContext: null
    });
    const biased = computeConversionPathAmplification({
      workflow_id: "tiktok",
      normalized_topic: "mega",
      page_type: "tool",
      revenueSummary: summary,
      riskContext: null,
      segmentStrategy: {
        segment_key: "high_intent_tool_entry",
        recommended_allocation_weight: 1.06,
        recommended_page_bias: "tool_entry_first"
      }
    });
    expect(biased.bonus_points).toBeGreaterThanOrEqual(base.bonus_points);
    expect(biased.exposure_multiplier).toBeGreaterThanOrEqual(base.exposure_multiplier);
    expect(biased.exposure_multiplier).toBeLessThanOrEqual(1.22);
  });
});

describe("V162 publish queue integration", () => {
  test("rows include segment fields", () => {
    const candidates: PublishQueueCandidate[] = [];
    for (let i = 0; i < 10; i++) {
      candidates.push({
        id: `zh:v63-tiktok-zhangfen-x${i}`,
        lane: "zh",
        topic_key: `tiktok 涨粉 ${i}`,
        base_score: 50,
        model_cost_tier: "low"
      });
    }
    const out = buildAssetSeoPublishQueue(candidates, process.cwd());
    expect(out.length).toBe(10);
    for (const r of out) {
      expect(r.segment_key.length).toBeGreaterThan(0);
      expect(r.segment_strategy_bonus).toBeGreaterThanOrEqual(-2);
      expect(r.segment_strategy_bonus).toBeLessThanOrEqual(3);
    }
  });
});
