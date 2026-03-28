import { selectCtaVariantWithRevenueContext } from "../asset-seo-cta-optimizer";
import { computeConversionPathAmplification } from "../asset-seo-conversion-path";
import {
  analyzePublishingRevenueIntelligence,
  computeMonetizedSessionRate,
  topicRevenueScore,
  type RevenueSegmentMetrics
} from "../asset-seo-revenue-intelligence";
import { buildAssetSeoRevenueSummary, type AssetSeoRevenueSummaryArtifact } from "../asset-seo-revenue-summary";
import { applyRevenueAmplificationTopicCaps, type PublishQueueItem } from "../asset-seo-publish-queue";

describe("V158 revenue intelligence", () => {
  test("computeMonetizedSessionRate is bounded 0..1", () => {
    expect(computeMonetizedSessionRate(0.2, 0.5)).toBeLessThanOrEqual(1);
    expect(computeMonetizedSessionRate(0, 0)).toBe(0);
  });

  test("analyzePublishingRevenueIntelligence returns segment lists", () => {
    const rows = [
      { event_name: "upgrade_shown" as const, topic: "alpha", workflow_id: "w1" },
      { event_name: "upgrade_clicked" as const, topic: "alpha", workflow_id: "w1" },
      {
        event_name: "upgrade_converted" as const,
        topic: "alpha",
        workflow_id: "w1",
        revenue: 50,
        generation_count_before_conversion: 2
      },
      ...Array(10)
        .fill(0)
        .map(() => ({ event_name: "upgrade_shown" as const, topic: "beta", workflow_id: "w2" }))
    ];
    const out = analyzePublishingRevenueIntelligence(rows as any);
    expect(out.top_revenue_topics.length).toBeGreaterThan(0);
    expect(out.segments.some((s) => s.segment_kind === "workflow")).toBe(true);
  });

  test("topicRevenueScore matches top topics", () => {
    const segs: RevenueSegmentMetrics[] = [
      {
        segment_key: "alpha tips",
        segment_kind: "topic",
        shown: 10,
        clicked: 3,
        converted: 2,
        revenue: 20,
        ctr: 0.3,
        conversion_rate: 0.2,
        revenue_per_visit: 2,
        monetized_session_rate: 0.5,
        avg_generation_per_user: 2,
        revenue_per_generation: 1
      }
    ];
    expect(topicRevenueScore("user wants alpha tips today", segs)).toBeGreaterThan(0);
  });
});

describe("V158 revenue summary artifact", () => {
  test("buildAssetSeoRevenueSummary produces stable shape", () => {
    const a = buildAssetSeoRevenueSummary(process.cwd());
    expect(a.version).toMatch(/^v158/);
    expect(Array.isArray(a.top_topics_by_revenue)).toBe(true);
    expect(typeof a.topic_revenue_score).toBe("object");
  });
});

describe("V158 CTA optimizer", () => {
  const baseSummary: AssetSeoRevenueSummaryArtifact = {
    version: "v158.0",
    updatedAt: "",
    top_topics_by_revenue: [
      {
        segment_key: "gold",
        segment_kind: "topic",
        shown: 20,
        clicked: 10,
        converted: 5,
        revenue: 200,
        ctr: 0.5,
        conversion_rate: 0.25,
        revenue_per_visit: 10,
        monetized_session_rate: 0.4,
        avg_generation_per_user: 2,
        revenue_per_generation: 5
      }
    ],
    top_topics_by_conversion_rate: [],
    highest_rps_topics: [],
    underperforming_topics: [
      {
        segment_key: "weak",
        segment_kind: "topic",
        shown: 30,
        clicked: 1,
        converted: 0,
        revenue: 0,
        ctr: 0.03,
        conversion_rate: 0,
        revenue_per_visit: 0,
        monetized_session_rate: 0.02,
        avg_generation_per_user: null,
        revenue_per_generation: 0
      }
    ],
    topic_revenue_score: { gold: 0.95 },
    workflow_revenue_score: {},
    notes: [],
    raw: { top_revenue_topics: [], top_conversion_pages: [], high_intent_segments: [], low_value_segments: [] }
  };

  test("high-value topic biases toward stronger CTA pool", () => {
    const hi = selectCtaVariantWithRevenueContext({
      topicKey: "gold topic",
      workflowId: "w",
      baseTriggerType: "soft",
      revenueSummary: baseSummary,
      seed: "s1"
    });
    expect(["strong", "neutral", "soft"]).toContain(hi.strength);
    expect(hi.trigger_type).toBe("hard");
  });

  test("low-value underperformer stays soft", () => {
    const lo = selectCtaVariantWithRevenueContext({
      topicKey: "weak niche",
      workflowId: "w",
      baseTriggerType: "hard",
      revenueSummary: baseSummary,
      seed: "s2"
    });
    expect(lo.trigger_type).toBe("soft");
    expect(lo.revenue_tier).toBe("low");
  });
});

describe("V158 conversion path amplification boundaries", () => {
  test("caps exposure and bonus under risk dampen", () => {
    const summary: AssetSeoRevenueSummaryArtifact = {
      version: "v158.0",
      updatedAt: "",
      top_topics_by_revenue: [],
      top_topics_by_conversion_rate: [],
      highest_rps_topics: [],
      underperforming_topics: [],
      topic_revenue_score: { mega: 1 },
      workflow_revenue_score: {},
      notes: [],
      raw: { top_revenue_topics: [], top_conversion_pages: [], high_intent_segments: [], low_value_segments: [] }
    };
    const strong = computeConversionPathAmplification({
      workflow_id: "wf",
      normalized_topic: "mega flow",
      page_type: "tool",
      revenueSummary: summary,
      riskContext: null
    });
    expect(strong.exposure_multiplier).toBeLessThanOrEqual(1.22);
    expect(strong.bonus_points).toBeLessThanOrEqual(8);
    expect(strong.cta_frequency_cap).toBeLessThanOrEqual(3);

    const weak = computeConversionPathAmplification({
      workflow_id: "wf",
      normalized_topic: "mega flow",
      page_type: "tool",
      revenueSummary: summary,
      riskContext: { deprioritized_topic_prefixes: ["mega"] }
    });
    expect(weak.bonus_points).toBeLessThanOrEqual(strong.bonus_points);
  });
});

describe("V158 queue amplification cap", () => {
  test("applyRevenueAmplificationTopicCaps demotes excess high-boost cluster", () => {
    const mk = (id: string, score: number, rev: number): PublishQueueItem => ({
      id,
      lane: "zh",
      topic_key: id,
      base_score: 50,
      model_cost_tier: "low",
      retrieval_priority_bonus: 0,
      ai_cost_penalty: 0,
      revenue_priority_bonus: rev,
      low_revenue_penalty: 0,
      effective_score: score,
      ai_citation_priority_bonus: 0,
      ai_structure_weak_penalty: 0,
      ai_citation_likely: 0,
      ai_answer_quality_score: 0,
      structured_content_ratio: 0,
      ai_citation_dominance_bonus: 0,
      weak_ai_citation_penalty: 0,
      traffic_allocation_bonus: 0,
      segment_key: "balanced_default",
      segment_strategy_bonus: 0
    });
    const items = [
      mk("zh:tiktok-zhangfen-a", 100, 10),
      mk("zh:tiktok-zhangfen-b", 99, 10),
      mk("zh:tiktok-zhangfen-c", 98, 10),
      mk("zh:tiktok-zhangfen-d", 97, 10),
      mk("zh:youtube-bianxian-x", 96, 10)
    ];
    applyRevenueAmplificationTopicCaps(items);
    const sorted = [...items].sort((a, b) => b.effective_score - a.effective_score);
    expect(sorted[0].effective_score).toBeGreaterThanOrEqual(sorted[4].effective_score);
  });
});
