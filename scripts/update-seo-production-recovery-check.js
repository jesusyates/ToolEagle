#!/usr/bin/env node
/**
 * Writes generated/seo-production-recovery-check.json — observability only (no watchdog/reliability logic).
 * Run after daily-engine or on a schedule: npm run seo:recovery-check
 */

const fs = require("fs");
const path = require("path");
const { resolveRepoRoot, resolveGeneratedPath, resolveLogsPath } = require("./lib/repo-root");

const REPO = resolveRepoRoot(__dirname);
const LIVE_HISTORY = resolveGeneratedPath(REPO, "seo-production-history.jsonl");
const DAILY_REPORT = resolveLogsPath(REPO, "daily-report.json");
const ENGINE_LOG = resolveLogsPath(REPO, "daily-engine-log.jsonl");

function utcDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function parseHistoryLines(absPath) {
  if (!fs.existsSync(absPath)) return [];
  const raw = fs.readFileSync(absPath, "utf8").trim();
  if (!raw) return [];
  const out = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip */
    }
  }
  return out;
}

/** Formal daily-engine live row (not dry-run / not sandbox-marked). */
function isLiveDailyEngineRow(row) {
  if (!row || typeof row !== "object") return false;
  if (row.dry_run === true) return false;
  const pe = String(row.production_entry || "");
  if (pe.includes("dry-run") || pe.includes("dry_run")) return false;
  return pe === "daily-engine";
}

function uniqueSortedDates(rows, filterFn) {
  const s = new Set();
  for (const row of rows) {
    if (!filterFn(row)) continue;
    const d = row.date;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) s.add(d);
  }
  return [...s].sort();
}

function consecutiveDaysFromAnchor(datesSet, anchorDay) {
  let n = 0;
  let cur = anchorDay;
  for (let i = 0; i < 400; i++) {
    if (!datesSet.has(cur)) break;
    n++;
    const [y, m, d] = cur.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d - 1));
    cur = dt.toISOString().slice(0, 10);
  }
  return n;
}

function lastNLinesPollution(rows, n, filterBad) {
  const slice = rows.slice(-n);
  let bad = 0;
  for (const row of slice) {
    if (filterBad(row)) bad++;
  }
  return { scanned: slice.length, bad };
}

function main() {
  const rows = parseHistoryLines(LIVE_HISTORY);
  const observedAll = uniqueSortedDates(rows, () => true);
  const observedLiveDailyEngine = uniqueSortedDates(rows, isLiveDailyEngineRow);

  const setLive = new Set(observedLiveDailyEngine);
  const anchor = utcDay();
  const consecutiveLive = consecutiveDaysFromAnchor(setLive, anchor);
  /** Also measure streak ending at latest date present in file (if machine not run "today" yet). */
  const latest =
    observedLiveDailyEngine.length > 0 ? observedLiveDailyEngine[observedLiveDailyEngine.length - 1] : null;
  const consecutiveToLatest = latest ? consecutiveDaysFromAnchor(setLive, latest) : 0;

  const pollute = lastNLinesPollution(
    rows,
    80,
    (row) => row.dry_run === true || String(row.production_entry || "").includes("dry-run")
  );

  const streak = Math.max(consecutiveLive, consecutiveToLatest);
  const threeDays = streak >= 3;
  const unpolluted = pollute.bad === 0;

  let recovery_status = "pending";
  if (pollute.bad > 0) recovery_status = "polluted";
  else if (threeDays && unpolluted) recovery_status = "ok";

  const payload = {
    version: "1",
    updated_at: new Date().toISOString(),
    repo_root: REPO,
    live_history_path: LIVE_HISTORY,
    daily_report_path: DAILY_REPORT,
    daily_engine_log_path: ENGINE_LOG,
    scheduled_entry_expected: "npm run daily-engine",
    scheduling_notes: {
      cwd_should_be: "repository root (or set TOOLEAGLE_REPO_ROOT); daily-engine resolves paths internally",
      avoid: [
        "npm run seo:daily:dry / daily-engine --dry-run (writes sandbox, not live history)",
        "running from another clone without adjusting paths",
        "replacing daily-engine with seo:daily:watch for production (deprecated watch)"
      ]
    },
    observed_dates: observedAll,
    observed_dates_daily_engine_live: observedLiveDailyEngine,
    /** Streak of UTC calendar days that have ≥1 `production_entry: daily-engine` row (excludes orchestrator-only / legacy rows). */
    consecutive_live_days: streak,
    consecutive_live_days_ending_today_utc: consecutiveLive,
    consecutive_live_days_ending_at_latest_entry: consecutiveToLatest,
    recovery_status,
    success_criteria: {
      three_consecutive_days_live_daily_engine: threeDays,
      live_history_last_80_lines_no_dry_markers: unpolluted,
      watchdog_missed_run_stops: "verify manually: npx tsx scripts/run-seo-watchdog.ts (exit 0 when healthy)"
    },
    live_history_tail_scan: {
      last_lines_checked: pollute.scanned,
      dry_or_sandbox_marked_lines: pollute.bad
    },
    artifact_exists: {
      live_history: fs.existsSync(LIVE_HISTORY),
      daily_report: fs.existsSync(DAILY_REPORT),
      daily_engine_log: fs.existsSync(ENGINE_LOG)
    },
    artifact_mtime_iso: {}
  };

  for (const [label, p] of [
    ["live_history", LIVE_HISTORY],
    ["daily_report", DAILY_REPORT],
    ["daily_engine_log", ENGINE_LOG]
  ]) {
    if (fs.existsSync(p)) {
      payload.artifact_mtime_iso[label] = fs.statSync(p).mtime.toISOString();
    }
  }

  fs.mkdirSync(path.dirname(LIVE_HISTORY), { recursive: true });
  const outPath = resolveGeneratedPath(REPO, "seo-production-recovery-check.json");
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log("[seo:recovery-check] wrote", outPath);
  console.log(
    JSON.stringify(
      {
        recovery_status: payload.recovery_status,
        consecutive_live_days: streak,
        consecutive_live_days_ending_today_utc: consecutiveLive,
        consecutive_live_days_ending_at_latest_entry: consecutiveToLatest,
        three_days_met: threeDays
      },
      null,
      2
    )
  );
}

main();
