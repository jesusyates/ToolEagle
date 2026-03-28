/**
 * V155 — Write generated/seo-reliability-summary.json from computed metrics.
 */

import fs from "fs";
import path from "path";
import { buildReliabilityMetrics } from "../../src/lib/seo/seo-production-reliability";

const VERSION = "v155.0";

type Metrics = ReturnType<typeof buildReliabilityMetrics>;

export type ReliabilitySummaryPayload = {
  version: string;
  updatedAt: string;
  reliability_score: number;
  recent_days: number;
  missed_runs: string[];
  missed_run_count: number;
  stale_runs: number;
  partial_runs: number;
  safe_mode_days: number;
  avg_retries: number;
  en_health: string;
  zh_health: string;
  long_running_lanes: string[];
  orchestrator_incomplete_cycle: boolean;
  stale_report_age_ms: number;
  notes: string[];
};

export function buildReliabilitySummaryPayload(
  metrics: Metrics,
  recentDays: number,
  extraNotes: string[] = []
): ReliabilitySummaryPayload {
  return {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    reliability_score: metrics.reliability_score,
    recent_days: recentDays,
    missed_runs: metrics.missedDates,
    missed_run_count: metrics.missed_run_count,
    stale_runs: metrics.stale_report_count,
    partial_runs: metrics.partial_run_count,
    safe_mode_days: metrics.safe_mode_days,
    avg_retries: metrics.avg_retries,
    en_health: metrics.en_health,
    zh_health: metrics.zh_health,
    long_running_lanes: metrics.long_running_lanes,
    orchestrator_incomplete_cycle: metrics.orchestrator_incomplete_cycle,
    stale_report_age_ms: metrics.stale_detail.age_ms,
    notes: [
      ...extraNotes,
      `stale_source:${metrics.stale_detail.source}`,
      metrics.long_running_penalty_applied ? "long_running_penalty" : ""
    ].filter(Boolean)
  };
}

export function writeReliabilitySummary(
  cwd: string,
  payload: ReliabilitySummaryPayload,
  opts?: { useSandbox?: boolean }
) {
  const base = opts?.useSandbox ? path.join(cwd, "generated", "sandbox") : path.join(cwd, "generated");
  const out = path.join(base, "seo-reliability-summary.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(payload, null, 2), "utf8");
}
