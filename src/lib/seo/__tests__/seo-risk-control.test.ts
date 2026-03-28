import {
  analyzePublishingRisk,
  batchMultiplierForRisk,
  computeRiskScore,
  detectPageTypeConcentration,
  detectSlugPatternRisk,
  detectTopicConcentration,
  detectVolumeSpike,
  riskLevelFromScore,
  slowdownRecommendation,
  type PublishingRiskContext,
  type SearchRiskSignals
} from "../seo-risk-control";

function ctx(partial: Partial<PublishingRiskContext>): PublishingRiskContext {
  return {
    dailyNewCounts: [],
    topicPrimaryCounts: {},
    pageTypeCounts: {},
    slugs: [],
    titleSamples: [],
    ...partial
  };
}

describe("V156 seo-risk-control", () => {
  test("detectVolumeSpike spikes when recent 2-day avg >> prior baseline", () => {
    const high = ctx({ dailyNewCounts: [50, 48, 5, 6, 5, 7, 6] });
    expect(detectVolumeSpike(high)).toBeGreaterThanOrEqual(0.75);
    const low = ctx({ dailyNewCounts: [6, 5, 5, 6, 5, 7, 6] });
    expect(detectVolumeSpike(low)).toBe(0);
  });

  test("detectVolumeSpike returns 0 when history too short", () => {
    expect(detectVolumeSpike(ctx({ dailyNewCounts: [10, 20, 30] }))).toBe(0);
  });

  test("detectTopicConcentration rises with skewed platform-goal counts", () => {
    const skewed = ctx({
      topicPrimaryCounts: { "tiktok-zhangfen": 90, "youtube-bianxian": 2 }
    });
    expect(detectTopicConcentration(skewed)).toBeGreaterThanOrEqual(0.7);
    const spread = ctx({
      topicPrimaryCounts: { a: 10, b: 10, c: 10, d: 10, e: 10 }
    });
    expect(detectTopicConcentration(spread)).toBeLessThan(0.45);
  });

  test("detectPageTypeConcentration flags one dominant bucket", () => {
    const one = ctx({ pageTypeCounts: { zh_keyword: 950, en_blog_mdx: 30 } });
    expect(detectPageTypeConcentration(one)).toBeGreaterThanOrEqual(0.65);
    const bal = ctx({ pageTypeCounts: { zh_keyword: 500, en_blog_mdx: 480 } });
    expect(detectPageTypeConcentration(bal)).toBe(0);
  });

  test("detectSlugPatternRisk flags repeated slug prefix cluster", () => {
    const slugs = Array(40).fill("tiktok-zhangfen-ruhe");
    expect(detectSlugPatternRisk(ctx({ slugs }))).toBeGreaterThanOrEqual(0.7);
    const mixed = [
      ...Array(8).fill("tiktok-zhangfen-ruhe"),
      ...Array(8).fill("youtube-bianxian-fangfa"),
      ...Array(8).fill("instagram-yinliu-zenme"),
      ...Array(8).fill("tiktok-bianxian-2026"),
      ...Array(8).fill("youtube-zhangfen-jiqiao")
    ];
    expect(detectSlugPatternRisk(ctx({ slugs: mixed }))).toBe(0);
  });

  test("computeRiskScore matches weighted formula", () => {
    const signals: SearchRiskSignals = {
      volume_spike: 1,
      topic_concentration: 0,
      page_type_concentration: 0,
      slug_pattern_risk: 0,
      template_similarity_risk: 0
    };
    expect(computeRiskScore(signals)).toBe(28);
    const all: SearchRiskSignals = {
      volume_spike: 1,
      topic_concentration: 1,
      page_type_concentration: 1,
      slug_pattern_risk: 1,
      template_similarity_risk: 1
    };
    expect(computeRiskScore(all)).toBe(100);
  });

  test("riskLevelFromScore thresholds", () => {
    expect(riskLevelFromScore(30)).toBe("low");
    expect(riskLevelFromScore(45)).toBe("medium");
    expect(riskLevelFromScore(75)).toBe("high");
  });

  test("slowdownRecommendation and batchMultiplierForRisk", () => {
    expect(slowdownRecommendation(30, "low")).toBe("none");
    expect(batchMultiplierForRisk("none", "low")).toBe(1);

    expect(slowdownRecommendation(45, "medium")).toBe("slowdown");
    expect(batchMultiplierForRisk("slowdown", "medium")).toBe(0.82);

    expect(slowdownRecommendation(65, "medium")).toBe("diversify");
    expect(batchMultiplierForRisk("diversify", "medium")).toBe(0.68);
    expect(batchMultiplierForRisk("diversify", "high")).toBe(0.55);

    expect(slowdownRecommendation(85, "high")).toBe("protective_safe_mode");
    expect(batchMultiplierForRisk("protective_safe_mode", "high")).toBe(0.42);
  });

  test("analyzePublishingRisk returns coherent structure", () => {
    const a = analyzePublishingRisk(
      ctx({
        dailyNewCounts: [40, 38, 5, 6, 5],
        topicPrimaryCounts: { "tiktok-zhangfen": 100 },
        pageTypeCounts: { zh_keyword: 900, en_blog_mdx: 20 },
        slugs: Array(30).fill("tiktok-zhangfen-x"),
        titleSamples: Array(20).fill("终极指南 2026年 新手必看")
      })
    );
    expect(a.risk_score).toBeGreaterThanOrEqual(40);
    expect(["low", "medium", "high"]).toContain(a.risk_level);
    expect(a.signals).toHaveProperty("volume_spike");
    expect(a.batch_multiplier).toBeLessThanOrEqual(1);
    expect(a.retrieval_ease_multiplier).toBeGreaterThanOrEqual(1);
  });
});
