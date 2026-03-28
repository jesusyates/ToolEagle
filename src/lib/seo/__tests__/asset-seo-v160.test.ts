import {
  aggregateAiCitationMetrics,
  computeV160DominanceAdjustments,
  metricRowFromPublishQueueItem,
  V160_MAX_DOMINANCE_BONUS,
  V160_MAX_WEAK_AI_PENALTY,
  V160_MIN_ROWS,
  type AiCitationMetricRow
} from "../asset-seo-ai-citation-metrics";
import {
  AI_CITATION_DOMINANCE_VERSION,
  buildAssetSeoAiCitationDominanceArtifactFromQueueItems,
  type AiCitationQueueItemLike
} from "../asset-seo-ai-citation-dominance-summary";
import { buildAssetSeoPublishQueue, type PublishQueueCandidate } from "../asset-seo-publish-queue";

function row(
  topic: string,
  lane: "zh" | "en",
  _slug: string,
  quality: number,
  structured: number,
  likely: number
): AiCitationMetricRow {
  return {
    topic_key: topic,
    lane,
    page_type: lane === "zh" ? "zh_search" : "en_topic_registry",
    workflow_id: "tiktok",
    ai_citation_likely: likely,
    ai_answer_quality_score: quality,
    structured_content_ratio: structured
  };
}

describe("V160 aggregateAiCitationMetrics", () => {
  test("computes overall score and topic lists", () => {
    const rows: AiCitationMetricRow[] = [
      row("tiktok growth", "zh", "zh:a", 80, 0.2, 0.7),
      row("tiktok growth", "zh", "zh:b", 78, 0.22, 0.68),
      row("tiktok growth", "zh", "zh:b2", 77, 0.21, 0.69),
      row("weak topic", "zh", "zh:c", 35, 0.05, 0.3),
      row("weak topic", "zh", "zh:c2", 36, 0.05, 0.3),
      row("weak topic", "zh", "zh:c3", 34, 0.05, 0.3),
      ...Array.from({ length: 6 }, (_, i) => row(`filler-${i}`, "en", `en:x${i}`, 60, 0.15, 0.5))
    ];
    const agg = aggregateAiCitationMetrics(rows);
    expect(agg.row_count).toBe(rows.length);
    expect(agg.overall_ai_citation_score).toBeGreaterThan(0);
    expect(agg.top_ai_citable_topics.length).toBeGreaterThan(0);
    expect(agg.weak_ai_citable_topics).toContain("weak topic");
    // Page-type leaders require n >= min_samples_page_type; small fixtures may leave this empty.
    expect(Array.isArray(agg.top_ai_citable_page_types)).toBe(true);
  });

  test("top topic selection orders by composite", () => {
    const rows: AiCitationMetricRow[] = [
      row("alpha", "zh", "zh:1", 90, 0.3, 0.9),
      row("alpha", "zh", "zh:1b", 89, 0.3, 0.88),
      row("alpha", "zh", "zh:1c", 88, 0.29, 0.87),
      row("beta", "zh", "zh:2", 40, 0.08, 0.35),
      ...Array.from({ length: 7 }, (_, i) => row(`z${i}`, "en", `en:${i}`, 55, 0.12, 0.45))
    ];
    const agg = aggregateAiCitationMetrics(rows);
    expect(agg.top_ai_citable_topics[0]).toBe("alpha");
  });
});

describe("V160 computeV160DominanceAdjustments", () => {
  test("skips when row count below minimum", () => {
    const rows: AiCitationMetricRow[] = [row("only", "zh", "zh:1", 70, 0.2, 0.6)];
    const agg = aggregateAiCitationMetrics(rows);
    const adj = computeV160DominanceAdjustments(rows[0], agg, rows.length);
    expect(adj.ai_citation_dominance_bonus).toBe(0);
    expect(adj.weak_ai_citation_penalty).toBe(0);
    expect(rows.length).toBeLessThan(V160_MIN_ROWS);
  });

  test("dominance bonus bounded", () => {
    const rows: AiCitationMetricRow[] = Array.from({ length: 10 }, (_, i) =>
      row(`topic-${i}`, "zh", `zh:t${i}`, 88, 0.25, 0.85)
    );
    const agg = aggregateAiCitationMetrics(rows);
    for (const r of rows) {
      const adj = computeV160DominanceAdjustments(r, agg, rows.length);
      expect(adj.ai_citation_dominance_bonus).toBeGreaterThanOrEqual(0);
      expect(adj.ai_citation_dominance_bonus).toBeLessThanOrEqual(V160_MAX_DOMINANCE_BONUS);
      expect(adj.weak_ai_citation_penalty).toBeGreaterThanOrEqual(0);
      expect(adj.weak_ai_citation_penalty).toBeLessThanOrEqual(V160_MAX_WEAK_AI_PENALTY);
    }
  });

  test("weak cohort with low structure gets penalty", () => {
    const rows: AiCitationMetricRow[] = [
      ...Array.from({ length: 7 }, (_, i) => row(`strong-${i}`, "zh", `zh:s${i}`, 75, 0.2, 0.7)),
      row("sad-topic", "zh", "zh:w1", 40, 0.04, 0.35),
      row("sad-topic", "zh", "zh:w2", 38, 0.05, 0.32),
      row("sad-topic", "zh", "zh:w3", 39, 0.05, 0.33)
    ];
    const agg = aggregateAiCitationMetrics(rows);
    const weakRow = rows.find((r) => r.topic_key === "sad-topic")!;
    const adj = computeV160DominanceAdjustments(weakRow, agg, rows.length);
    expect(adj.weak_ai_citation_penalty).toBeGreaterThan(0);
  });
});

describe("V160 dominance artifact shape", () => {
  test("buildAssetSeoAiCitationDominanceArtifactFromQueueItems", () => {
    const items: AiCitationQueueItemLike[] = [
      {
        topic_key: "tiktok tips",
        lane: "zh",
        id: "zh:fake-a",
        ai_citation_likely: 0.8,
        ai_answer_quality_score: 82,
        structured_content_ratio: 0.22,
        ai_citation_dominance_bonus: 4,
        weak_ai_citation_penalty: 0
      },
      {
        topic_key: "instagram bio",
        lane: "en",
        id: "en:instagram-bio",
        ai_citation_likely: 0.5,
        ai_answer_quality_score: 58,
        structured_content_ratio: 0.14,
        ai_citation_dominance_bonus: 0,
        weak_ai_citation_penalty: 1
      }
    ];
    const art = buildAssetSeoAiCitationDominanceArtifactFromQueueItems(items);
    expect(art.version).toBe(AI_CITATION_DOMINANCE_VERSION);
    expect(art.updatedAt).toBeTruthy();
    expect(typeof art.citation_ready_rate).toBe("number");
    expect(Array.isArray(art.top_ai_citable_topics)).toBe(true);
    expect(Array.isArray(art.emerging_ai_citable_topics)).toBe(true);
    expect(art.min_sample_thresholds).toBeDefined();
    expect(art.established_topic_count).toBeGreaterThanOrEqual(0);
    expect(art.emerging_topic_count).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(art.weak_topics)).toBe(true);
    expect(art.notes.length).toBeGreaterThan(0);
  });

  test("metricRowFromPublishQueueItem infers page_type", () => {
    const m = metricRowFromPublishQueueItem({
      topic_key: "x",
      lane: "zh",
      id: "zh:v63-tiktok-zhangfen-jc-zx",
      ai_citation_likely: 0.5,
      ai_answer_quality_score: 60,
      structured_content_ratio: 0.1
    });
    expect(m.page_type).toBe("zh_search");
    expect(m.workflow_id).toBe("tiktok");
  });
});

describe("V160 publish queue integration", () => {
  test("queue rows include bounded V160 fields", () => {
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
      expect(r.ai_citation_dominance_bonus).toBeGreaterThanOrEqual(0);
      expect(r.ai_citation_dominance_bonus).toBeLessThanOrEqual(V160_MAX_DOMINANCE_BONUS);
      expect(r.weak_ai_citation_penalty).toBeGreaterThanOrEqual(0);
      expect(r.weak_ai_citation_penalty).toBeLessThanOrEqual(V160_MAX_WEAK_AI_PENALTY);
      expect(typeof r.traffic_allocation_bonus).toBe("number");
      expect(r.traffic_allocation_bonus).toBeGreaterThanOrEqual(-3);
      expect(r.traffic_allocation_bonus).toBeLessThanOrEqual(5);
      expect(typeof r.segment_key).toBe("string");
      expect(r.segment_strategy_bonus).toBeGreaterThanOrEqual(-2);
      expect(r.segment_strategy_bonus).toBeLessThanOrEqual(3);
    }
  });
});
