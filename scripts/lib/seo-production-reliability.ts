/**
 * V155 — Filesystem helpers + re-export pure reliability logic from src.
 */

export * from "../../src/lib/seo/seo-production-reliability";

import fs from "fs";
import path from "path";
import type { DailyReportSnapshot } from "../../src/lib/seo/seo-production-reliability";
import { parseProductionHistoryJsonl } from "../../src/lib/seo/seo-production-reliability";
import { isSeoDryRunEnv } from "../../src/lib/seo/seo-sandbox";

export const HISTORY_FILENAME = "seo-production-history.jsonl";
export const DAILY_REPORT_FILENAME = "seo-daily-report.json";
export const PIPELINE_STATE_FILENAME = "seo-pipeline-state.json";

export function generatedArtifactDir(cwd = process.cwd()) {
  if (isSeoDryRunEnv()) return path.join(cwd, "generated", "sandbox");
  return path.join(cwd, "generated");
}

export function historyPath(cwd = process.cwd()) {
  return path.join(generatedArtifactDir(cwd), HISTORY_FILENAME);
}

export function dailyReportPath(cwd = process.cwd()) {
  return path.join(generatedArtifactDir(cwd), DAILY_REPORT_FILENAME);
}

export function pipelineStatePath(cwd = process.cwd()) {
  return path.join(generatedArtifactDir(cwd), PIPELINE_STATE_FILENAME);
}

/** Read last `maxLines` non-empty lines from history (each line = JSON snapshot). */
export function loadRecentDailyReports(cwd = process.cwd(), maxLines = 120): DailyReportSnapshot[] {
  const p = historyPath(cwd);
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf8");
  const lines = raw.split(/\n+/).filter((l) => l.trim());
  const slice = lines.slice(-maxLines).join("\n");
  return parseProductionHistoryJsonl(slice);
}

export function appendProductionHistory(cwd: string, entry: Record<string, unknown>) {
  const p = historyPath(cwd);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(entry) + "\n", "utf8");
}

export function readDailyReportFile(cwd: string): DailyReportSnapshot | null {
  const p = dailyReportPath(cwd);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as DailyReportSnapshot;
  } catch {
    return null;
  }
}

export function dailyReportMtimeMs(cwd: string): number | null {
  const p = dailyReportPath(cwd);
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return null;
  }
}
