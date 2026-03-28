/**
 * V161 — Durable traffic allocation summary artifact (generated/asset-seo-traffic-allocation.json).
 */

import fs from "fs";
import path from "path";
import { resolveSeoGeneratedDir } from "./seo-sandbox";
import type { AllocationEntry, TrafficAllocationResult } from "./asset-seo-traffic-allocation";
import { TRAFFIC_ALLOCATION_VERSION } from "./asset-seo-traffic-allocation";

export type TopAllocatedTopicRow = { topic_key: string; units: number; score: number; tier: AllocationEntry["tier"] };
export type TopAllocatedWorkflowRow = { workflow_id: string; units: number; score: number; tier: AllocationEntry["tier"] };
export type TopAllocatedPageTypeRow = { page_type: string; units: number; score: number; tier: AllocationEntry["tier"] };

export type AssetSeoTrafficAllocationSummaryArtifact = {
  version: string;
  updatedAt: string;
  total_daily_capacity: number;
  top_allocated_topics: TopAllocatedTopicRow[];
  top_allocated_workflows: TopAllocatedWorkflowRow[];
  top_allocated_page_types: TopAllocatedPageTypeRow[];
  suppressed_segments: TrafficAllocationResult["suppressed_segments"];
  allocation_reasoning: string[];
  notes: string[];
  /** Echo full engine outputs for orchestrator / scripts */
  recommended_zh_batch_scale: number;
  recommended_en_batch_scale: number;
  exploration_quota_assignments: string[];
};

function topFromRecord<T extends string>(
  record: Record<string, AllocationEntry>,
  idKey: T,
  limit: number
): Array<Record<T, string> & { units: number; score: number; tier: AllocationEntry["tier"] }> {
  return Object.entries(record)
    .map(([id, v]) => ({ [idKey]: id, units: v.units, score: v.score, tier: v.tier } as Record<T, string> & { units: number; score: number; tier: AllocationEntry["tier"] }))
    .sort((a, b) => b.units - a.units || b.score - a.score)
    .slice(0, limit);
}

export function buildTrafficAllocationSummaryArtifact(alloc: TrafficAllocationResult): AssetSeoTrafficAllocationSummaryArtifact {
  return {
    version: alloc.version || TRAFFIC_ALLOCATION_VERSION,
    updatedAt: new Date().toISOString(),
    total_daily_capacity: alloc.total_daily_capacity,
    top_allocated_topics: topFromRecord(alloc.topic_allocations, "topic_key", 20) as TopAllocatedTopicRow[],
    top_allocated_workflows: topFromRecord(alloc.workflow_allocations, "workflow_id", 15) as TopAllocatedWorkflowRow[],
    top_allocated_page_types: topFromRecord(alloc.page_type_allocations, "page_type", 8) as TopAllocatedPageTypeRow[],
    suppressed_segments: alloc.suppressed_segments,
    allocation_reasoning: alloc.allocation_reasoning,
    notes: alloc.notes,
    recommended_zh_batch_scale: alloc.recommended_zh_batch_scale,
    recommended_en_batch_scale: alloc.recommended_en_batch_scale,
    exploration_quota_assignments: alloc.exploration_quota_assignments
  };
}

/** Writes generated/asset-seo-traffic-allocation.json. Returns absolute path. */
export function writeAssetSeoTrafficAllocationJson(cwd: string, alloc: TrafficAllocationResult): string {
  const gen = resolveSeoGeneratedDir(cwd);
  fs.mkdirSync(gen, { recursive: true });
  const summary = buildTrafficAllocationSummaryArtifact(alloc);
  const out = path.join(gen, "asset-seo-traffic-allocation.json");
  fs.writeFileSync(out, JSON.stringify(summary, null, 2), "utf8");
  return out;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** Merge V161 fields into existing autopilot summary (after dominance write). */
export function mergeTrafficAllocationIntoAutopilotFile(cwd: string): void {
  const gen = resolveSeoGeneratedDir(cwd);
  const allocPath = path.join(gen, "asset-seo-traffic-allocation.json");
  const apPath = path.join(gen, "asset-seo-autopilot-summary.json");
  const alloc = readJson<AssetSeoTrafficAllocationSummaryArtifact | null>(allocPath, null);
  if (!alloc?.version) return;
  const ap = readJson<Record<string, unknown>>(apPath, {});
  const topTopics = (alloc.top_allocated_topics || []).map((t) => t.topic_key).slice(0, 12);
  const topWf = (alloc.top_allocated_workflows || []).map((w) => w.workflow_id).slice(0, 12);
  const topPt = (alloc.top_allocated_page_types || []).map((p) => p.page_type).slice(0, 8);
  const merged = {
    ...ap,
    top_allocated_topics: topTopics,
    top_allocated_workflows: topWf,
    top_allocated_page_types: topPt,
    suppressed_segment_count: (alloc.suppressed_segments || []).length,
    exploration_quota_count: (alloc.exploration_quota_assignments || []).length
  };
  fs.writeFileSync(apPath, JSON.stringify(merged, null, 2), "utf8");
}
