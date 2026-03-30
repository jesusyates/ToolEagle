/**
 * V168 — Retrieval optimization plan from telemetry + dataset state (read-only + optional apply via CLI).
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getRetrievalDatasetReadyMin } from "@/lib/seo/retrieval-dataset-build";
import { readRetrievalTelemetryRows } from "@/lib/seo/retrieval-utilization-summary";
import { aggregateRetrievalUsage, topFallbackReason } from "@/lib/seo/retrieval-utilization-metrics";

export const RETRIEVAL_OPTIMIZATION_PLAN_VERSION = "168";

export type RetrievalOptimizationPlanJson = {
  version: string;
  updatedAt: string;
  top_fallback_reason: string | null;
  dataset_row_count: number;
  dataset_threshold: number;
  dataset_not_ready: boolean;
  recommendations: string[];
  env_suggestions: Record<string, string>;
  boost_topics: string[];
  actions_taken: string[];
  notes: string[];
};

function readJson<T>(p: string, fb: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fb;
  }
}

function workflowRowCount(cwd: string): number {
  const wf = readJson<{ item_count?: number; items?: unknown[] } | null>(
    path.join(cwd, "generated", "workflow-assets-retrieval.json"),
    null
  );
  if (!wf) return 0;
  if (typeof wf.item_count === "number") return Math.max(0, wf.item_count);
  return Array.isArray(wf.items) ? wf.items.length : 0;
}

/**
 * Build optimization plan. Does not mutate repo except when `apply` runs dataset build.
 */
export function buildRetrievalOptimizationPlan(
  cwd: string,
  now = new Date(),
  opts?: { apply?: boolean }
): RetrievalOptimizationPlanJson {
  const apply = !!opts?.apply;
  const rows = readRetrievalTelemetryRows(cwd);
  const agg = aggregateRetrievalUsage(rows);
  const top = topFallbackReason(agg.fallback_reason_breakdown);
  const threshold = getRetrievalDatasetReadyMin();
  const dataset_row_count = workflowRowCount(cwd);
  const dataset_not_ready = dataset_row_count < threshold;

  const recommendations: string[] = [];
  const env_suggestions: Record<string, string> = {};
  const actions_taken: string[] = [];
  const boost_topics: string[] = [];
  const notes: string[] = [];

  if (dataset_not_ready) {
    recommendations.push("increase_dataset");
    notes.push(`Dataset rows ${dataset_row_count} < threshold ${threshold}.`);
    if (apply) {
      try {
        execSync("npx tsx scripts/build-retrieval-dataset.ts", { cwd, stdio: "inherit" });
        actions_taken.push("ran_build_retrieval_dataset");
      } catch {
        actions_taken.push("build_retrieval_dataset_failed");
      }
    }
  }

  if (top === "dataset_not_ready" && !dataset_not_ready) {
    recommendations.push("increase_dataset");
    notes.push("Telemetry top fallback dataset_not_ready but row count meets threshold — rebuild dataset or check stale telemetry.");
  }

  if (top === "no_qualified_hits") {
    recommendations.push("lower_threshold");
    env_suggestions.RETRIEVAL_SCORE_THRESHOLD_MULT = "0.93";
    notes.push("Top fallback no_qualified_hits — suggest easing score thresholds up to ~7% (env mult 0.93).");
  }

  if (top === "score_below_threshold") {
    recommendations.push("boost_retrieval_bias");
    env_suggestions.RETRIEVAL_BIAS_EXTRA = "0.02";
    notes.push("Top fallback score_below_threshold — suggest extra bias via RETRIEVAL_BIAS_EXTRA.");
  }

  const weak = agg.weak_retrieval_topics?.[0];
  if (weak && weak.retrieval_fallbacks >= 2) {
    const tag = `boost_topic_${weak.topic_key.slice(0, 48).replace(/\s+/g, "_")}`;
    recommendations.push(tag);
    boost_topics.push(weak.topic_key);
    notes.push(`Weak topic sample: ${weak.topic_key} (hit_rate ${weak.hit_rate}).`);
  }

  if (recommendations.length === 0) {
    recommendations.push("monitor");
    notes.push("No dominant retrieval issue detected from window + dataset snapshot.");
  }

  const uniq = [...new Set(recommendations)];
  const finalRec =
    uniq.length > 1 ? uniq.filter((r) => r !== "monitor") : uniq.length ? uniq : ["monitor"];

  return {
    version: RETRIEVAL_OPTIMIZATION_PLAN_VERSION,
    updatedAt: now.toISOString(),
    top_fallback_reason: top,
    dataset_row_count,
    dataset_threshold: threshold,
    dataset_not_ready,
    recommendations: finalRec.length ? finalRec : ["monitor"],
    env_suggestions,
    boost_topics,
    actions_taken,
    notes
  };
}

export function writeRetrievalOptimizationPlan(cwd: string, plan: RetrievalOptimizationPlanJson): void {
  const p = path.join(cwd, "generated", "retrieval-optimization-plan.json");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(plan, null, 2), "utf8");
}

export function loadRetrievalOptimizationPlan(cwd: string): RetrievalOptimizationPlanJson | null {
  const p = path.join(cwd, "generated", "retrieval-optimization-plan.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as RetrievalOptimizationPlanJson;
  } catch {
    return null;
  }
}

/** Merge only known optimizer keys into env (for child processes). */
export function mergeOptimizerEnvSuggestionsIntoProcessEnv(plan: RetrievalOptimizationPlanJson | null): void {
  if (!plan?.env_suggestions) return;
  const allow = new Set(["RETRIEVAL_SCORE_THRESHOLD_MULT", "RETRIEVAL_BIAS_EXTRA"]);
  for (const [k, v] of Object.entries(plan.env_suggestions)) {
    if (allow.has(k) && v != null && String(v).length) process.env[k] = String(v);
  }
}
