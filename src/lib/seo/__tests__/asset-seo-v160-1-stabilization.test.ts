import { spawnSync } from "child_process";
import path from "path";
import {
  aggregateAiCitationMetrics,
  citationConfidenceWeight,
  computeV160DominanceAdjustments,
  DEFAULT_CITATION_MIN_SAMPLES,
  type AiCitationMetricRow
} from "../asset-seo-ai-citation-metrics";
import { buildAssetSeoAiCitationDominanceArtifactFromQueueItems, AI_CITATION_DOMINANCE_VERSION } from "../asset-seo-ai-citation-dominance-summary";

function r(topic: string, lane: "zh" | "en", q: number, s: number, l: number): AiCitationMetricRow {
  return {
    topic_key: topic,
    lane,
    page_type: lane === "zh" ? "zh_search" : "en_topic_registry",
    workflow_id: "tiktok",
    ai_citation_likely: l,
    ai_answer_quality_score: q,
    structured_content_ratio: s
  };
}

describe("V160.1 sample thresholds + confidence", () => {
  test("n=1 topic is not in established top list", () => {
    const rows: AiCitationMetricRow[] = [
      r("lonely-winner", "zh", 99, 0.4, 0.95),
      ...Array.from({ length: 8 }, (_, i) => r(`bulk-${i}`, "zh", 50, 0.1, 0.4))
    ];
    const agg = aggregateAiCitationMetrics(rows, DEFAULT_CITATION_MIN_SAMPLES);
    expect(agg.top_ai_citable_topics).not.toContain("lonely-winner");
    expect(agg.emerging_ai_citable_topics).toContain("lonely-winner");
  });

  test("confidence_weight is capped at 1", () => {
    expect(citationConfidenceWeight(100, 3)).toBe(1);
    expect(citationConfidenceWeight(1, 3)).toBeCloseTo(1 / 3, 5);
  });

  test("established vs emerging split counts", () => {
    const rows: AiCitationMetricRow[] = [
      r("est", "zh", 70, 0.2, 0.6),
      r("est", "zh", 71, 0.2, 0.6),
      r("est", "zh", 72, 0.2, 0.6),
      r("emg", "zh", 80, 0.3, 0.7),
      ...Array.from({ length: 6 }, (_, i) => r(`pad-${i}`, "en", 55, 0.12, 0.45))
    ];
    const art = buildAssetSeoAiCitationDominanceArtifactFromQueueItems(
      rows.map((row) => ({
        topic_key: row.topic_key,
        lane: row.lane as "zh" | "en",
        id: row.lane === "zh" ? `zh:${row.topic_key}` : `en:${row.topic_key}`,
        ai_citation_likely: row.ai_citation_likely,
        ai_answer_quality_score: row.ai_answer_quality_score,
        structured_content_ratio: row.structured_content_ratio
      }))
    );
    expect(art.version).toBe(AI_CITATION_DOMINANCE_VERSION);
    expect(art.min_sample_thresholds.min_samples_topic).toBe(DEFAULT_CITATION_MIN_SAMPLES.min_samples_topic);
    expect(art.confidence_weight_notes.length).toBeGreaterThan(0);
    expect(art.established_topic_count).toBeGreaterThanOrEqual(1);
    expect(art.emerging_topic_count).toBeGreaterThanOrEqual(1);
    expect(art.top_ai_citable_topics.some((t) => t.topic_key === "est")).toBe(true);
    expect(art.emerging_ai_citable_topics.some((t) => t.topic_key === "emg")).toBe(true);
  });

  test("emerging match yields lower bonus than established", () => {
    const rows: AiCitationMetricRow[] = [
      r("big", "zh", 90, 0.25, 0.8),
      r("big", "zh", 88, 0.25, 0.8),
      r("big", "zh", 87, 0.25, 0.8),
      r("solo", "zh", 92, 0.3, 0.85),
      ...Array.from({ length: 6 }, (_, i) => r(`z${i}`, "en", 50, 0.1, 0.4))
    ];
    const agg = aggregateAiCitationMetrics(rows, DEFAULT_CITATION_MIN_SAMPLES);
    const estRow = rows.find((x) => x.topic_key === "big")!;
    const emgRow = rows.find((x) => x.topic_key === "solo")!;
    const estAdj = computeV160DominanceAdjustments(estRow, agg, rows.length);
    const emgAdj = computeV160DominanceAdjustments(emgRow, agg, rows.length);
    expect(estAdj.ai_citation_dominance_bonus).toBeGreaterThanOrEqual(emgAdj.ai_citation_dominance_bonus);
  });
});

describe("V160.1 repository typecheck", () => {
  test("tsc --noEmit exits 0", () => {
    const root = process.cwd();
    const tscCli = path.join(root, "node_modules", "typescript", "bin", "tsc");
    const res = spawnSync(process.execPath, [tscCli, "--noEmit"], {
      cwd: root,
      encoding: "utf8",
      env: process.env
    });
    if (res.status !== 0) {
      // eslint-disable-next-line no-console
      console.error(res.stdout || "", res.stderr || "", res.error || "");
    }
    expect(res.status).toBe(0);
  }, 120000);
});
