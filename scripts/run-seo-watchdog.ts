/**
 * V155 — SEO production watchdog: stale/missed detection, reliability summary, capped recovery.
 *
 * Run: npx tsx scripts/run-seo-watchdog.ts
 * Loop: npx tsx scripts/run-seo-watchdog.ts --watch
 *
 * Env:
 *   SEO_WATCHDOG_RECOVERY=1 — allow spawning orchestrator when stale/missed
 *   SEO_WATCHDOG_MAX_RECOVERY_PER_DAY=2 (default)
 *   SEO_WATCHDOG_STALE_MS — daily report max age (default 40h)
 *   SEO_WATCHDOG_LOOKBACK_DAYS=7
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { loadPipelineState, type SeoPipelineState } from "./lib/seo-background-engine-core";
import {
  buildReliabilityMetrics,
  decideWatchdogRecovery,
  type PipelineStateForWatchdog
} from "./lib/seo-production-reliability";
import { dailyReportMtimeMs, loadRecentDailyReports, readDailyReportFile } from "./lib/seo-production-reliability";
import { buildReliabilitySummaryPayload, writeReliabilitySummary } from "./lib/seo-reliability-summary";
import { isPrimaryScriptEntry } from "../src/lib/seo/seo-sandbox";

const CWD = process.cwd();
const EVENT_LOG = path.join(CWD, "logs", "seo-orchestrator-events.jsonl");
const RELIABILITY_LOG = path.join(CWD, "logs", "seo-reliability-watchdog.jsonl");
const WATCHDOG_STATE_LIVE = path.join(CWD, "generated", "seo-watchdog-state.json");
const WATCHDOG_STATE_SANDBOX = path.join(CWD, "generated", "sandbox", "seo-watchdog-state.json");

function watchdogStatePath(): string {
  return process.env.SEO_WATCHDOG_DRY === "1" ? WATCHDOG_STATE_SANDBOX : WATCHDOG_STATE_LIVE;
}

type WatchdogState = {
  recovery_triggers_day: string;
  recovery_triggers_count: number;
  degraded_reporting_only: boolean;
  last_check_at: string | null;
};

function defaultWd(): WatchdogState {
  return {
    recovery_triggers_day: "",
    recovery_triggers_count: 0,
    degraded_reporting_only: false,
    last_check_at: null
  };
}

function loadWd(): WatchdogState {
  const p = watchdogStatePath();
  try {
    return { ...defaultWd(), ...JSON.parse(fs.readFileSync(p, "utf8")) };
  } catch {
    return defaultWd();
  }
}

function saveWd(s: WatchdogState) {
  const p = watchdogStatePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(s, null, 2), "utf8");
}

function logLine(file: string, event: string, payload: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...payload });
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, line + "\n", "utf8");
  } catch {
    // no-op
  }
  console.info("[seo_watchdog]", line);
}

function toWatchdogPipeline(s: SeoPipelineState): PipelineStateForWatchdog {
  return {
    zh_status: s.zh_status,
    en_status: s.en_status,
    last_run_at: s.last_run_at,
    last_success_at: s.last_success_at,
    last_orchestrator_completed_at: s.last_orchestrator_completed_at,
    orchestrator_cycle_started_at: s.orchestrator_cycle_started_at,
    orchestrator_safe_mode: s.orchestrator_safe_mode,
    lane_running_since: s.lane_running_since
  };
}

function utcDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function runWatchdogOnce(): number {
  const now = new Date();
  const lookback = Math.min(30, Math.max(3, parseInt(process.env.SEO_WATCHDOG_LOOKBACK_DAYS || "7", 10) || 7));
  const staleMs = parseInt(process.env.SEO_WATCHDOG_STALE_MS || String(40 * 60 * 60 * 1000), 10) || 40 * 60 * 60 * 1000;
  const longRunMs = parseInt(process.env.SEO_WATCHDOG_LONG_RUNNING_MS || String(2 * 60 * 60 * 1000), 10) || 2 * 60 * 60 * 1000;
  const incompleteMs =
    parseInt(process.env.SEO_WATCHDOG_INCOMPLETE_MS || String(4 * 60 * 60 * 1000), 10) || 4 * 60 * 60 * 1000;

  const snapshots = loadRecentDailyReports(CWD, 200);
  const latest = readDailyReportFile(CWD);
  const mtime = dailyReportMtimeMs(CWD);
  const pipeline = loadPipelineState();
  const wd = loadWd();

  const day = utcDay(now);
  if (wd.recovery_triggers_day !== day) {
    wd.recovery_triggers_count = 0;
    wd.recovery_triggers_day = day;
  }

  const metrics = buildReliabilityMetrics({
    snapshots,
    now,
    lookbackDays: lookback,
    latestReport: latest,
    reportMtimeMs: mtime,
    staleMaxAgeMs: staleMs,
    pipeline: toWatchdogPipeline(pipeline),
    longRunningMaxMs: longRunMs,
    orchestratorIncompleteMaxMs: incompleteMs
  });

  const missedOrStale = metrics.missed_run_count > 0 || metrics.stale_report_count > 0;
  if (metrics.missed_run_count > 0) {
    logLine(EVENT_LOG, "missed_run_detected", { missed: metrics.missedDates });
    logLine(RELIABILITY_LOG, "missed_run_detected", { missed: metrics.missedDates });
  }
  if (metrics.stale_detail.stale || metrics.orchestrator_incomplete_cycle) {
    logLine(EVENT_LOG, "stale_report_detected", {
      source: metrics.stale_detail.source,
      age_ms: metrics.stale_detail.age_ms,
      incomplete_cycle: metrics.orchestrator_incomplete_cycle
    });
    logLine(RELIABILITY_LOG, "stale_report_detected", {
      source: metrics.stale_detail.source,
      incomplete_cycle: metrics.orchestrator_incomplete_cycle
    });
  }

  const maxRec = Math.min(5, Math.max(0, parseInt(process.env.SEO_WATCHDOG_MAX_RECOVERY_PER_DAY || "2", 10) || 2));
  const recoveryEnabled = process.env.SEO_WATCHDOG_RECOVERY === "1";

  const decision = decideWatchdogRecovery({
    missedOrStale,
    recoveryEnabled,
    triggersToday: wd.recovery_triggers_count,
    maxTriggersPerDay: maxRec,
    degradedReportingOnly: wd.degraded_reporting_only
  });

  if (decision.capReached && missedOrStale) {
    wd.degraded_reporting_only = true;
    logLine(EVENT_LOG, "reliability_check_failed", { reason: decision.reason, degraded: true });
  }

  if (decision.shouldTrigger && process.env.SEO_WATCHDOG_DRY !== "1") {
    wd.recovery_triggers_count += 1;
    logLine(EVENT_LOG, "recovery_retriggered", { attempt: wd.recovery_triggers_count, max: maxRec });
    logLine(RELIABILITY_LOG, "recovery_retriggered", { attempt: wd.recovery_triggers_count });
    const npx = process.platform === "win32" ? "npx.cmd" : "npx";
    const r = spawnSync(npx, ["tsx", "scripts/run-daily-orchestrator.ts"], {
      cwd: CWD,
      stdio: "inherit"
    });
    if (r.status !== 0) {
      logLine(EVENT_LOG, "recovery_orchestrator_failed", { code: r.status });
    }
  } else if (decision.shouldTrigger && process.env.SEO_WATCHDOG_DRY === "1") {
    logLine(RELIABILITY_LOG, "recovery_skipped_dry_run", { reason: "SEO_WATCHDOG_DRY" });
  }

  wd.last_check_at = now.toISOString();
  saveWd(wd);

  const summaryNotes: string[] = [];
  if (wd.degraded_reporting_only) summaryNotes.push("degraded_reporting_only_cap");
  if (!recoveryEnabled && missedOrStale) summaryNotes.push("recovery_disabled_set_SEO_WATCHDOG_RECOVERY=1");

  const payload = buildReliabilitySummaryPayload(metrics, lookback, summaryNotes);
  writeReliabilitySummary(CWD, payload, { useSandbox: process.env.SEO_WATCHDOG_DRY === "1" });

  const passed = !missedOrStale && !metrics.long_running && metrics.reliability_score >= 50;
  if (passed) {
    logLine(EVENT_LOG, "reliability_check_passed", { score: metrics.reliability_score });
  } else {
    logLine(EVENT_LOG, "reliability_check_failed", {
      score: metrics.reliability_score,
      missed: metrics.missed_run_count,
      stale: metrics.stale_report_count
    });
  }

  return passed ? 0 : 1;
}

function parseArgs() {
  const a = process.argv.slice(2);
  return {
    watch: a.includes("--watch"),
    dryRun: a.includes("--dry-run") || a.includes("--sandbox"),
    intervalMs: Math.max(
      600_000,
      parseInt(process.env.SEO_WATCHDOG_INTERVAL_MS || String(6 * 60 * 60 * 1000), 10) || 6 * 60 * 60 * 1000
    )
  };
}

function main() {
  const { watch, intervalMs, dryRun } = parseArgs();
  if (dryRun) {
    process.env.SEO_WATCHDOG_DRY = "1";
  }
  if (watch) {
    const tick = () => {
      const code = runWatchdogOnce();
      console.log(`[seo-watchdog] exit ${code}; next in ${intervalMs}ms`);
    };
    tick();
    setInterval(tick, intervalMs);
    return;
  }
  process.exit(runWatchdogOnce());
}

if (isPrimaryScriptEntry("run-seo-watchdog.ts")) {
  main();
}
