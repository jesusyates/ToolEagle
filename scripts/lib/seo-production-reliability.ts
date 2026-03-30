/**
 * V155 — Filesystem helpers + re-export pure reliability logic from src.
 */

export * from "../../src/lib/seo/seo-production-reliability";

import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const { resolveRepoRoot } = require("./repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

const DEFAULT_REPO_ROOT = resolveRepoRoot();
import type { DailyReportSnapshot } from "../../src/lib/seo/seo-production-reliability";
import { parseProductionHistoryJsonl } from "../../src/lib/seo/seo-production-reliability";
import { isSeoDryRunEnv } from "../../src/lib/seo/seo-sandbox";

export const HISTORY_FILENAME = "seo-production-history.jsonl";
export const DAILY_REPORT_FILENAME = "seo-daily-report.json";
/** V170 — canonical production daily report (daily-engine). */
export const ENGINE_DAILY_REPORT_DIR = "logs";
export const ENGINE_DAILY_REPORT_FILENAME = "daily-report.json";
export const PIPELINE_STATE_FILENAME = "seo-pipeline-state.json";

export function generatedArtifactDir(cwd = DEFAULT_REPO_ROOT) {
  if (isSeoDryRunEnv()) return path.join(cwd, "generated", "sandbox");
  return path.join(cwd, "generated");
}

export function historyPath(cwd = DEFAULT_REPO_ROOT) {
  return path.join(generatedArtifactDir(cwd), HISTORY_FILENAME);
}

export function dailyReportPath(cwd = DEFAULT_REPO_ROOT) {
  const enginePath = path.join(cwd, ENGINE_DAILY_REPORT_DIR, ENGINE_DAILY_REPORT_FILENAME);
  if (fs.existsSync(enginePath)) return enginePath;
  return path.join(generatedArtifactDir(cwd), DAILY_REPORT_FILENAME);
}

export function pipelineStatePath(cwd = DEFAULT_REPO_ROOT) {
  return path.join(generatedArtifactDir(cwd), PIPELINE_STATE_FILENAME);
}

/** Read last `maxLines` non-empty lines from history (each line = JSON snapshot). */
export function loadRecentDailyReports(cwd = DEFAULT_REPO_ROOT, maxLines = 120): DailyReportSnapshot[] {
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
  const enginePath = path.join(cwd, ENGINE_DAILY_REPORT_DIR, ENGINE_DAILY_REPORT_FILENAME);
  const legacyPath = path.join(generatedArtifactDir(cwd), DAILY_REPORT_FILENAME);
  const p = fs.existsSync(enginePath) ? enginePath : legacyPath;
  if (!fs.existsSync(p)) return null;
  try {
    const o = JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, unknown>;
    if (typeof o.generatedAt === "string" && o.updatedAt == null) {
      o.updatedAt = o.generatedAt;
      if (o.date == null && o.generatedAt.length >= 10) o.date = o.generatedAt.slice(0, 10);
    }
    if (o.en_status == null && o.generated_pages_detail != null) {
      const d = o.generated_pages_detail as { en?: number; zh?: number };
      o.en_status = (d?.en ?? 0) > 0 ? "ok" : "partial";
      o.zh_status = (d?.zh ?? 0) > 0 ? "ok" : "partial";
    }
    return o as DailyReportSnapshot;
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
