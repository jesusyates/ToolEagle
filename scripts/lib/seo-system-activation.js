/**
 * V163.1 — Production heartbeat, alerts, real metrics, critical state (activation layer).
 * Does not modify V156/V160/V161/V162 modules.
 */

const fs = require("fs");
const path = require("path");

const HEARTBEAT = "seo-run-heartbeat.json";
const ALERTS = "seo-alerts.json";
const CRITICAL = "seo-critical-state.json";
const REAL_METRICS = "seo-real-metrics.json";
const DAILY_REPORT = "seo-daily-report.json";
const GAP_HOURS = 24;

function genDir(cwd) {
  return path.join(cwd, "generated");
}

function heartbeatPath(cwd, mode) {
  if (mode === "dry_run") return path.join(genDir(cwd), "sandbox", HEARTBEAT);
  return path.join(genDir(cwd), HEARTBEAT);
}

/**
 * @param {string} cwd
 * @param {{ success: boolean; zh_generated?: number; en_generated?: number; stop_reason: string; run_mode?: string }} p
 */
function writeRunHeartbeat(cwd, p) {
  const mode = p.run_mode === "dry_run" ? "dry_run" : "live";
  const outPath = heartbeatPath(cwd, mode);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const payload = {
    last_run_at: new Date().toISOString(),
    success: !!p.success,
    zh_generated: Number(p.zh_generated ?? 0),
    en_generated: Number(p.en_generated ?? 0),
    stop_reason: String(p.stop_reason || "unknown"),
    run_mode: mode
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

function readRunHeartbeat(cwd, mode = "live") {
  const outPath = heartbeatPath(cwd, mode);
  try {
    return JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Merge alerts by type (new replaces old of same type).
 * @param {string} cwd
 * @param {Array<Record<string, unknown>>} newAlerts
 */
function mergeSeoAlerts(cwd, newAlerts) {
  const p = path.join(genDir(cwd), ALERTS);
  let existing = { alerts: [] };
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    if (Array.isArray(j.alerts)) existing = j;
  } catch {
    // fresh
  }
  const incomingTypes = new Set(newAlerts.map((a) => a.type));
  const kept = (existing.alerts || []).filter((a) => !incomingTypes.has(a.type));
  const now = new Date().toISOString();
  const merged = [
    ...kept,
    ...newAlerts.map((a) => ({ ...a, recorded_at: now }))
  ];
  const out = { updatedAt: now, alerts: merged };
  fs.mkdirSync(genDir(cwd), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(out, null, 2), "utf8");
  return out;
}

/**
 * If last live heartbeat older than 24h, record missed_run.
 * @param {string} cwd
 */
function detectRunGapAndAlert(cwd) {
  const hb = readRunHeartbeat(cwd, "live");
  if (!hb || !hb.last_run_at) {
    mergeSeoAlerts(cwd, [
      { type: "missed_run", hours_since_last_run: null, detail: "no_heartbeat_file" }
    ]);
    return { gap: true, hours: null };
  }
  const ms = Date.now() - new Date(hb.last_run_at).getTime();
  const hours = ms / 3600000;
  if (hours > GAP_HOURS) {
    mergeSeoAlerts(cwd, [
      {
        type: "missed_run",
        hours_since_last_run: Math.round(hours * 10) / 10
      }
    ]);
    return { gap: true, hours };
  }
  return { gap: false, hours };
}

function recordLlmMissingAlert(cwd) {
  mergeSeoAlerts(cwd, [{ type: "llm_missing" }]);
}

function readAlertsFile(cwd) {
  const p = path.join(genDir(cwd), ALERTS);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return { alerts: [] };
  }
}

function readDailyReportQuick(cwd) {
  const p = path.join(genDir(cwd), DAILY_REPORT);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Critical: llm_missing, missed_run, or repeated degraded (last 3 heartbeats / reports heuristic: 2+ degraded in file notes).
 */
/**
 * Call once per orchestrator completion only (not from watchdog/status).
 * @param {string} cwd
 */
function recordDegradedStreakFromReport(cwd) {
  const report = readDailyReportQuick(cwd);
  const degradedStreakPath = path.join(genDir(cwd), "seo-degraded-streak.json");
  let streak = { count: 0, last_notes: [] };
  try {
    streak = JSON.parse(fs.readFileSync(degradedStreakPath, "utf8"));
  } catch {
    // none
  }
  if (report && report.safety_status === "degraded") {
    streak.count = (streak.count || 0) + 1;
    streak.last_at = new Date().toISOString();
    streak.last_notes = report.notes || [];
  } else if (report && report.safety_status === "normal") {
    streak.count = 0;
  }
  fs.mkdirSync(genDir(cwd), { recursive: true });
  fs.writeFileSync(degradedStreakPath, JSON.stringify(streak, null, 2), "utf8");
}

function evaluateAndWriteCriticalState(cwd) {
  const { alerts } = readAlertsFile(cwd);
  const types = new Set((alerts || []).map((a) => a.type));
  const hb = readRunHeartbeat(cwd, "live");

  let critical = false;
  const reasons = [];

  if (types.has("llm_missing")) {
    critical = true;
    reasons.push("llm_missing");
  }
  if (types.has("missed_run")) {
    critical = true;
    reasons.push("missed_run");
  }

  const degradedStreakPath = path.join(genDir(cwd), "seo-degraded-streak.json");
  let streak = { count: 0 };
  try {
    streak = JSON.parse(fs.readFileSync(degradedStreakPath, "utf8"));
  } catch {
    // none
  }
  if (streak.count >= 3) {
    critical = true;
    reasons.push("repeated_degraded");
  }

  const outPath = path.join(genDir(cwd), CRITICAL);
  const payload = {
    updatedAt: new Date().toISOString(),
    critical,
    reasons,
    last_heartbeat_success: hb ? hb.success : null,
    last_heartbeat_at: hb ? hb.last_run_at : null
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

  if (critical) {
    console.error("\n[SEO SYSTEM NOT RUNNING CORRECTLY]\n", JSON.stringify(payload, null, 2), "\n");
  }

  return payload;
}

/**
 * @param {string} cwd
 * @param {{ daily_zh: number; daily_en: number; retrieval_share: number; avg_cost_per_page: number; run_success: boolean }} slice
 */
function updateRealMetrics(cwd, slice) {
  const p = path.join(genDir(cwd), REAL_METRICS);
  let prev = {
    last_7_day_runs: [],
    run_success_rate: 0
  };
  try {
    prev = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    // fresh
  }
  const day = new Date().toISOString().slice(0, 10);
  const runs = Array.isArray(prev.last_7_day_runs) ? [...prev.last_7_day_runs] : [];
  runs.push({
    date: day,
    success: slice.run_success,
    zh_generated: slice.daily_zh,
    en_generated: slice.daily_en,
    stop_reason: slice.stop_reason || ""
  });
  while (runs.length > 7) runs.shift();
  const ok = runs.filter((r) => r.success).length;
  const rate = runs.length ? ok / runs.length : 0;

  const out = {
    updatedAt: new Date().toISOString(),
    daily_generated_pages: slice.daily_zh + slice.daily_en,
    retrieval_share: Number(slice.retrieval_share ?? 0),
    avg_cost_per_page: Number(slice.avg_cost_per_page ?? 0),
    run_success_rate: Math.round(rate * 1000) / 1000,
    last_7_day_runs: runs
  };
  fs.mkdirSync(genDir(cwd), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(out, null, 2), "utf8");
  return out;
}

function hasAnyLlmApiKey() {
  return !!(
    process.env.OPENAI_API_KEY ||
    process.env.GLM_API_KEY ||
    process.env.ZHIPU_API_KEY
  );
}

/** Clear missed_run alert after a successful live cycle (gap closed). */
function clearMissedRunAlertOnSuccess(cwd) {
  const { alerts } = readAlertsFile(cwd);
  const filtered = (alerts || []).filter((a) => a.type !== "missed_run");
  if (filtered.length === (alerts || []).length) return;
  const p = path.join(genDir(cwd), ALERTS);
  fs.writeFileSync(
    p,
    JSON.stringify({ updatedAt: new Date().toISOString(), alerts: filtered }, null, 2),
    "utf8"
  );
}

module.exports = {
  writeRunHeartbeat,
  readRunHeartbeat,
  mergeSeoAlerts,
  detectRunGapAndAlert,
  recordLlmMissingAlert,
  evaluateAndWriteCriticalState,
  recordDegradedStreakFromReport,
  updateRealMetrics,
  hasAnyLlmApiKey,
  clearMissedRunAlertOnSuccess,
  HEARTBEAT,
  ALERTS,
  CRITICAL,
  REAL_METRICS
};
