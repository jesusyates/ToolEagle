/**
 * V162 — Segment strategy artifact + autopilot merge.
 */

import fs from "fs";
import path from "path";
import { resolveSeoGeneratedDir } from "./seo-sandbox";
import type { SegmentStrategyResult } from "./asset-seo-segment-strategy";
import { SEGMENT_STRATEGY_VERSION } from "./asset-seo-segment-strategy";

export type SegmentStrategyRowMeta = {
  topic_key: string;
  strategy: SegmentStrategyResult;
  segment_strategy_bonus: number;
};

export type AssetSeoSegmentStrategyArtifact = {
  version: string;
  updatedAt: string;
  segment_distribution: Record<string, number>;
  top_segments_by_value: Array<{ segment_key: string; value_score: number; count: number }>;
  low_value_segments: string[];
  recommended_biases: {
    page_bias: Record<string, number>;
    cta_style: Record<string, number>;
  };
  segment_bias_counts: {
    prioritized: number;
    deprioritized: number;
    neutral: number;
  };
  notes: string[];
};

export function buildSegmentStrategyArtifactFromRows(rows: SegmentStrategyRowMeta[]): AssetSeoSegmentStrategyArtifact {
  const segment_distribution: Record<string, number> = {};
  const page_bias: Record<string, number> = {};
  const cta_style: Record<string, number> = {};
  let prioritized = 0;
  let deprioritized = 0;
  let neutral = 0;

  const valueBySegment: Record<string, { sum: number; count: number }> = {};

  for (const r of rows) {
    const sk = r.strategy.segment_key;
    segment_distribution[sk] = (segment_distribution[sk] || 0) + 1;
    const pb = r.strategy.recommended_page_bias;
    const cs = r.strategy.recommended_cta_style;
    page_bias[pb] = (page_bias[pb] || 0) + 1;
    cta_style[cs] = (cta_style[cs] || 0) + 1;
    if (r.segment_strategy_bonus > 0) prioritized++;
    else if (r.segment_strategy_bonus < 0) deprioritized++;
    else neutral++;

    const w = r.strategy.recommended_allocation_weight;
    if (!valueBySegment[sk]) valueBySegment[sk] = { sum: 0, count: 0 };
    valueBySegment[sk].sum += w;
    valueBySegment[sk].count += 1;
  }

  const top_segments_by_value = Object.entries(valueBySegment)
    .map(([segment_key, { sum, count }]) => ({
      segment_key,
      value_score: Number(((sum / count) * count).toFixed(3)),
      count
    }))
    .sort((a, b) => b.value_score - a.value_score);

  const low_value_segments = [
    ...new Set(
      rows.filter((r) => r.strategy.recommended_allocation_weight <= 0.97).map((r) => r.strategy.segment_key)
    )
  ];

  return {
    version: SEGMENT_STRATEGY_VERSION,
    updatedAt: new Date().toISOString(),
    segment_distribution,
    top_segments_by_value,
    low_value_segments,
    recommended_biases: { page_bias, cta_style },
    segment_bias_counts: { prioritized, deprioritized, neutral },
    notes: [
      "V162 segment strategy biases queue/CTA/conversion; does not replace V161 or risk controls",
      `rows: ${rows.length}`
    ]
  };
}

export function writeAssetSeoSegmentStrategyJson(cwd: string, artifact: AssetSeoSegmentStrategyArtifact): string {
  const gen = resolveSeoGeneratedDir(cwd);
  fs.mkdirSync(gen, { recursive: true });
  const out = path.join(gen, "asset-seo-segment-strategy.json");
  fs.writeFileSync(out, JSON.stringify(artifact, null, 2), "utf8");
  return out;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function mergeSegmentStrategyIntoAutopilotFile(cwd: string): void {
  const gen = resolveSeoGeneratedDir(cwd);
  const segPath = path.join(gen, "asset-seo-segment-strategy.json");
  const apPath = path.join(gen, "asset-seo-autopilot-summary.json");
  const seg = readJson<AssetSeoSegmentStrategyArtifact | null>(segPath, null);
  if (!seg?.version) return;
  const ap = readJson<Record<string, unknown>>(apPath, {});
  const merged = {
    ...ap,
    top_segments_by_value: (seg.top_segments_by_value || []).map((s) => s.segment_key).slice(0, 12),
    segment_distribution: seg.segment_distribution,
    segment_bias_counts: seg.segment_bias_counts
  };
  fs.writeFileSync(apPath, JSON.stringify(merged, null, 2), "utf8");
}
