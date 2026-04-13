/**
 * V154 — Daily production orchestrator: health, retries, safe mode, stall recovery, daily report.
 * Delegates execution to V153 core (runBackgroundSeoTick).
 *
 * V170: Production cron uses `npm run daily-engine` — this script is a **sub-step** (lanes, safe mode, history).
 * Run directly: `npm run seo:orchestrator` · Optional loop: `npm run seo:orchestrator:watch` (SEO_ORCH_INTERVAL_MS, default 24h)
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  DEFAULT_STATE_PATH,
  loadPipelineState,
  runBackgroundSeoTick,
  savePipelineState,
  type SeoPipelineState
} from "./lib/seo-background-engine-core";
import { appendProductionHistory } from "./lib/seo-production-reliability";
import { computeAndWriteSearchRisk } from "../src/lib/seo/seo-risk-summary";
import {
  isPrimaryScriptEntry,
  parseSeoCliMode,
  sandboxPipelineStatePath,
  seoSandboxDir,
  type SeoProductionRunMode
} from "../src/lib/seo/seo-sandbox";
import { buildAndWriteRetrievalDataset } from "../src/lib/seo/retrieval-dataset-build";

// V163.1 — heartbeat / alerts / metrics (CommonJS lib)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const activation = require("./lib/seo-system-activation.js") as {
  writeRunHeartbeat: (
    cwd: string,
    p: {
      success: boolean;
      zh_generated?: number;
      en_generated?: number;
      stop_reason: string;
      run_mode?: string;
    }
  ) => void;
  detectRunGapAndAlert: (cwd: string) => { gap: boolean; hours: number | null };
  recordLlmMissingAlert: (cwd: string) => void;
  updateRealMetrics: (
    cwd: string,
    slice: {
      daily_zh: number;
      daily_en: number;
      retrieval_share: number;
      avg_cost_per_page: number;
      run_success: boolean;
      stop_reason?: string;
    }
  ) => void;
  evaluateAndWriteCriticalState: (cwd: string) => { critical: boolean; reasons: string[] };
  hasAnyLlmApiKey: () => boolean;
  mergeSeoAlerts: (cwd: string, alerts: Array<Record<string, unknown>>) => void;
  clearMissedRunAlertOnSuccess: (cwd: string) => void;
  recordDegradedStreakFromReport: (cwd: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveRepoRoot } = require("./lib/repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

console.log("[daily-orchestrator] disabled by manual override (diagnosis mode)");
process.exit(0);

const CWD = resolveRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const REPORT_PATH = path.join(CWD, "generated", "seo-daily-report.json");
const SANDBOX_REPORT_PATH = path.join(CWD, "generated", "sandbox", "seo-daily-report.json");
const EVENT_LOG = path.join(CWD, "logs", "seo-orchestrator-events.jsonl");
const SANDBOX_EVENT_LOG = path.join(CWD, "logs", "seo-sandbox-orchestrator-events.jsonl");
const COST_PATH = path.join(CWD, "generated", "asset-seo-cost-efficiency.json");
const HQ_PATH = path.join(CWD, "generated", "agent_high_quality_assets.json");
const WF_PATH = path.join(CWD, "generated", "workflow-assets-retrieval.json");
const QUEUE_PATH = path.join(CWD, "generated", "asset-seo-publish-queue.json");
const TRAFFIC_ALLOC_PATH = path.join(CWD, "generated", "asset-seo-traffic-allocation.json");
const ROUTER_PATH = path.join(CWD, "scripts", "lib", "seo-model-router-v153.js");

type ReportLaneStatus = "completed" | "partial" | "failed";
type SafetyStatus = "normal" | "safe_mode" | "degraded";

type DailyReport = {
  date: string;
  en_status: ReportLaneStatus;
  zh_status: ReportLaneStatus;
  en_generated_count: number;
  zh_generated_count: number;
  retrieval_share: number;
  ai_share: number;
  avg_cost_per_page: number;
  failures_count: number;
  retries_count: number;
  stop_reason: string;
  safety_status: SafetyStatus;
  notes: string[];
  /** V155 — watchdog / reliability */
  updatedAt: string;
  orchestrator_cycle_started_at: string | null;
  orchestrator_completed_at: string | null;
  orchestrator_exit_code: number;
  /** V157 */
  run_mode?: SeoProductionRunMode;
};

let orchestratorEventLogFile = EVENT_LOG;

function logEvent(event: string, payload: Record<string, unknown> = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...payload });
  console.info("[seo_orchestrator]", line);
  try {
    fs.mkdirSync(path.dirname(orchestratorEventLogFile), { recursive: true });
    fs.appendFileSync(orchestratorEventLogFile, line + "\n", "utf8");
  } catch {
    // no-op
  }
}

function readJson<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

type HealthResult = {
  ok: boolean;
  retrieval: boolean;
  modelRouter: boolean;
  queue: boolean;
  cost: boolean;
  notes: string[];
};

function queuePathForMode(mode: SeoProductionRunMode): string {
  if (mode === "dry_run" || mode === "check_only") {
    return path.join(seoSandboxDir(CWD), "asset-seo-publish-queue.json");
  }
  return QUEUE_PATH;
}

function trafficAllocationPathForMode(mode: SeoProductionRunMode): string {
  if (mode === "dry_run" || mode === "check_only") {
    const sand = path.join(seoSandboxDir(CWD), "asset-seo-traffic-allocation.json");
    if (fs.existsSync(sand)) return sand;
  }
  return TRAFFIC_ALLOC_PATH;
}

function ensureQueueArtifact(mode: SeoProductionRunMode): boolean {
  const qPath = queuePathForMode(mode);
  if (fs.existsSync(qPath)) return true;
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const env =
    mode === "dry_run" || mode === "check_only"
      ? { ...process.env, SEO_DRY_RUN: "1" }
      : { ...process.env };
  const r = spawnSync(npx, ["tsx", "scripts/build-asset-seo-publish-queue.ts"], {
    cwd: CWD,
    stdio: "pipe",
    env
  });
  return r.status === 0 && fs.existsSync(qPath);
}

function runHealthCheck(mode: SeoProductionRunMode): HealthResult {
  const notes: string[] = [];
  const retrieval = fs.existsSync(HQ_PATH) && fs.existsSync(WF_PATH);
  if (!retrieval) notes.push("retrieval_json_missing");

  const modelRouter = fs.existsSync(ROUTER_PATH);
  if (!modelRouter) notes.push("model_router_script_missing");
  const hasKey = !!(process.env.OPENAI_API_KEY || process.env.GLM_API_KEY || process.env.ZHIPU_API_KEY);
  if (!hasKey) notes.push("no_llm_api_key_env");

  const queue = ensureQueueArtifact(mode);
  if (!queue) notes.push("publish_queue_build_failed");

  const costLive = fs.existsSync(COST_PATH);
  const costSandbox = fs.existsSync(path.join(seoSandboxDir(CWD), "asset-seo-cost-efficiency.json"));
  const cost = mode === "live" ? costLive : costLive || costSandbox;
  if (!cost) notes.push("cost_artifact_missing");

  const ok = retrieval && modelRouter && hasKey && queue;
  return { ok, retrieval, modelRouter, queue, cost, notes };
}

function applySafeMode(state: SeoPipelineState, reason: string, notes: string[]) {
  const prev = state.orchestrator_safe_mode;
  state.orchestrator_safe_mode = true;
  state.safe_mode_reason = reason;
  state.zh_batch_size = Math.max(5, Math.min(state.zh_batch_size, 8));
  state.en_blog_batch_size = Math.max(2, Math.min(state.en_blog_batch_size, 4));
  notes.push(`safe_mode:${reason}`);
  if (!prev) logEvent("safe_mode_entered", { reason });
}

function costSpikeDegraded(): boolean {
  const c = readJson<{ high_cost_usage_rate?: number }>(COST_PATH, {});
  const rate = Number(c.high_cost_usage_rate ?? 0);
  const threshold = parseFloat(process.env.SEO_ORCH_COST_SPIKE_THRESHOLD || "0.45");
  return rate >= threshold;
}

function detectStall(state: SeoPipelineState): boolean {
  const ms = parseInt(process.env.SEO_ORCH_STALL_MS || String(4 * 60 * 60 * 1000), 10);
  if (!state.last_success_at) return false;
  const elapsed = Date.now() - new Date(state.last_success_at).getTime();
  return elapsed > ms && state.consecutive_failures >= 2;
}

function laneReportStatus(
  attempted: boolean,
  detailOk: boolean,
  pipeline: SeoPipelineState["zh_status"]
): ReportLaneStatus {
  if (!attempted) return "completed";
  if (detailOk && pipeline === "completed") return "completed";
  if (pipeline === "partial" || (!detailOk && pipeline !== "idle")) return "partial";
  return "failed";
}

function writeDailyReport(r: DailyReport, mode: SeoProductionRunMode) {
  const out = mode === "dry_run" ? SANDBOX_REPORT_PATH : REPORT_PATH;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(r, null, 2), "utf8");
}

function parseArgs() {
  const a = process.argv.slice(2);
  return {
    watch: a.includes("--watch"),
    mode: parseSeoCliMode(a),
    intervalMs: Math.max(
      3_600_000,
      parseInt(process.env.SEO_ORCH_INTERVAL_MS || String(24 * 60 * 60 * 1000), 10) || 86400000
    )
  };
}

/** ZH+EN default; `--zh-only` / `--en-only` for single-lane (e.g. `daily-pipeline --zh-only`). */
function getRunScope(): { zh: boolean; en: boolean } {
  const a = process.argv.slice(2);
  if (a.includes("--zh-only")) return { zh: true, en: false };
  if (a.includes("--en-only")) return { zh: false, en: true };
  return { zh: true, en: true };
}

function runCheckOnly(): number {
  orchestratorEventLogFile = SANDBOX_EVENT_LOG;
  logEvent("check_only_started", {});
  const health = runHealthCheck("check_only");
  const searchRisk = computeAndWriteSearchRisk(CWD, { useSandbox: true });
  logEvent("search_risk_computed", {
    risk_score: searchRisk.risk_score,
    risk_level: searchRisk.risk_level,
    recommended_action: searchRisk.recommended_action,
    batch_multiplier: searchRisk.batch_multiplier,
    signals: searchRisk.signals,
    sandbox: true
  });
  const out = path.join(seoSandboxDir(CWD), "seo-orchestrator-check-only.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        health,
        search_risk: {
          risk_score: searchRisk.risk_score,
          risk_level: searchRisk.risk_level,
          recommended_action: searchRisk.recommended_action
        }
      },
      null,
      2
    ),
    "utf8"
  );
  logEvent("check_only_completed", { health_ok: health.ok, artifact: out });
  return health.ok ? 0 : 1;
}

function runDailyCycle(): number {
  const mode = parseSeoCliMode(process.argv.slice(2));
  orchestratorEventLogFile = mode === "live" ? EVENT_LOG : SANDBOX_EVENT_LOG;

  if (mode === "check_only") {
    return runCheckOnly();
  }

  if (mode === "dry_run") {
    process.env.SEO_DRY_RUN = "1";
  }

  const statePath = mode === "dry_run" ? sandboxPipelineStatePath(CWD) : DEFAULT_STATE_PATH;

  logEvent("daily_run_started", { mode });
  const notes: string[] = [];
  let failuresCount = 0;
  let retriesCount = 0;

  let boot = loadPipelineState(statePath);
  boot.orchestrator_cycle_started_at = new Date().toISOString();
  savePipelineState(boot, statePath);
  const cycleStartedAt = boot.orchestrator_cycle_started_at;

  let lastCode = 1;
  let lastDetail: ReturnType<typeof runBackgroundSeoTick>["detail"] | null = null;

  try {
  // V163.1 — live: gap alert; block entire run if no LLM keys (no "success without AI").
  if (mode === "live") {
    activation.detectRunGapAndAlert(CWD);
    if (!activation.hasAnyLlmApiKey()) {
      activation.recordLlmMissingAlert(CWD);
      const nowIso = new Date().toISOString();
      const day = nowIso.slice(0, 10);
      activation.writeRunHeartbeat(CWD, {
        success: false,
        zh_generated: 0,
        en_generated: 0,
        stop_reason: "llm_missing_keys",
        run_mode: "live"
      });
      const failReport: DailyReport = {
        date: day,
        en_status: "failed",
        zh_status: "failed",
        en_generated_count: 0,
        zh_generated_count: 0,
        retrieval_share: 0,
        ai_share: 0,
        avg_cost_per_page: 0,
        failures_count: 1,
        retries_count: 0,
        stop_reason: "llm_missing_keys",
        safety_status: "degraded",
        notes: ["llm_missing_blocked_run", "no_llm_api_key_env"],
        updatedAt: nowIso,
        orchestrator_cycle_started_at: cycleStartedAt,
        orchestrator_completed_at: nowIso,
        orchestrator_exit_code: 1,
        run_mode: mode
      };
      writeDailyReport(failReport, mode);
      appendProductionHistory(CWD, { ...failReport });
      activation.updateRealMetrics(CWD, {
        daily_zh: 0,
        daily_en: 0,
        retrieval_share: 0,
        avg_cost_per_page: 0,
        run_success: false,
        stop_reason: "llm_missing_keys"
      });
      activation.recordDegradedStreakFromReport(CWD);
      activation.evaluateAndWriteCriticalState(CWD);
      logEvent("daily_run_blocked_llm", {});
      return 1;
    }
  }

  const health = runHealthCheck(mode);
  if (!health.ok) {
    notes.push(...health.notes);
    logEvent("health_check_degraded", { notes: health.notes });
  }

  let state = loadPipelineState(statePath);
  const zhBefore = state.zh_progress_count;
  const enBefore = state.en_progress_count;

  if (!health.ok || !health.cost) {
    applySafeMode(state, "health_or_cost_artifact_degraded", notes);
  }
  if (costSpikeDegraded()) {
    applySafeMode(state, "high_cost_usage_rate", notes);
  }
  if (detectStall(state)) {
    state.last_stall_detected_at = new Date().toISOString();
    logEvent("recovery_triggered", { kind: "stall_detected", last_success_at: state.last_success_at });
    applySafeMode(state, "stall_detected", notes);
    state.consecutive_failures = Math.max(0, state.consecutive_failures - 1);
  }
  if (state.high_failure_streak >= 5) {
    applySafeMode(state, "high_failure_streak", notes);
  }

  savePipelineState(state, statePath);

  try {
    const ds = buildAndWriteRetrievalDataset(CWD);
    logEvent("retrieval_dataset_synced", { item_count: ds.itemCount, builtAt: ds.builtAt });
  } catch (err) {
    logEvent("retrieval_dataset_sync_failed", { message: String(err) });
  }

  const searchRisk = computeAndWriteSearchRisk(CWD, { useSandbox: mode !== "live" });
  logEvent("search_risk_computed", {
    risk_score: searchRisk.risk_score,
    risk_level: searchRisk.risk_level,
    recommended_action: searchRisk.recommended_action,
    batch_multiplier: searchRisk.batch_multiplier,
    signals: searchRisk.signals
  });
  if (searchRisk.risk_level === "medium") {
    logEvent("search_risk_medium", { risk_score: searchRisk.risk_score });
  }
  if (searchRisk.risk_level === "high") {
    logEvent("search_risk_high", { risk_score: searchRisk.risk_score });
  }
  if (searchRisk.batch_multiplier < 1) {
    logEvent("slowdown_applied", {
      batch_multiplier: searchRisk.batch_multiplier,
      risk_level: searchRisk.risk_level
    });
  }
  if (searchRisk.recommended_action === "diversify" || searchRisk.recommended_action === "protective_safe_mode") {
    logEvent("diversification_applied", {
      action: searchRisk.recommended_action,
      deprioritized_sample: searchRisk.affected_topics.slice(0, 5)
    });
  }
  if (searchRisk.recommended_action === "protective_safe_mode") {
    applySafeMode(state, "search_risk_protective", notes);
    logEvent("protective_safe_mode_entered", {
      reason: "search_risk",
      risk_score: searchRisk.risk_score
    });
    savePipelineState(state, statePath);
  }

  const maxRetries = Math.min(5, Math.max(1, parseInt(process.env.SEO_ORCH_MAX_RETRIES || "3", 10) || 3));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    state = loadPipelineState(statePath);
    const safe = state.orchestrator_safe_mode;
    const baseZh = Math.min(20, Math.max(5, state.zh_batch_size));
    const baseEn = Math.min(15, Math.max(2, state.en_blog_batch_size));
    const zhOverride =
      attempt === 1
        ? safe
          ? Math.min(baseZh, 6)
          : undefined
        : Math.max(5, Math.floor(baseZh / attempt));
    const enOverride = attempt === 1 ? (safe ? Math.min(baseEn, 3) : undefined) : Math.max(2, Math.floor(baseEn / attempt));

    const allocData = readJson<{
      recommended_zh_batch_scale?: number;
      recommended_en_batch_scale?: number;
    }>(trafficAllocationPathForMode(mode), {});
    const allocationZhBatchScale = Number(allocData.recommended_zh_batch_scale);
    const allocationEnBatchScale = Number(allocData.recommended_en_batch_scale);

    const scope = getRunScope();
    const res = runBackgroundSeoTick({
      cwd: CWD,
      statePath,
      zh: scope.zh,
      en: scope.en,
      skipEnBlog: process.env.SEO_BG_SKIP_EN_BLOG === "1",
      zhBatchOverride: zhOverride,
      enBatchOverride: enOverride,
      riskZhBatchMultiplier: searchRisk.batch_multiplier,
      riskEnBatchMultiplier: searchRisk.batch_multiplier,
      allocationZhBatchScale: Number.isFinite(allocationZhBatchScale) && allocationZhBatchScale > 0 ? allocationZhBatchScale : undefined,
      allocationEnBatchScale: Number.isFinite(allocationEnBatchScale) && allocationEnBatchScale > 0 ? allocationEnBatchScale : undefined,
      dryRun: mode === "dry_run"
    });
    lastDetail = res.detail;
    lastCode = res.code;
    state = res.state;

    if (res.code === 0) break;

    failuresCount += 1;
    if (attempt < maxRetries) {
      retriesCount += 1;
      logEvent("recovery_triggered", { kind: "batch_retry", attempt, maxRetries });
      state.zh_batch_size = Math.max(5, state.zh_batch_size - 2);
      state.en_blog_batch_size = Math.max(2, state.en_blog_batch_size - 1);
      savePipelineState(state, statePath);
    }
  }

  const costData =
    mode === "dry_run"
      ? readJson<{
          retrieval_share?: number;
          ai_share?: number;
          avg_cost_per_page?: number;
        }>(path.join(seoSandboxDir(CWD), "asset-seo-cost-efficiency.json"), readJson(COST_PATH, {}))
      : readJson<{
          retrieval_share?: number;
          ai_share?: number;
          avg_cost_per_page?: number;
        }>(COST_PATH, {});

  const zhDelta = state.zh_progress_count - zhBefore;
  const enDelta = state.en_progress_count - enBefore;

  const zhStatus = lastDetail
    ? laneReportStatus(lastDetail.zhAttempted, lastDetail.zhOk, state.zh_status)
    : "failed";
  const enStatus = lastDetail
    ? laneReportStatus(lastDetail.enAttempted, lastDetail.enOk && lastDetail.enAutoOk, state.en_status)
    : "failed";

  let stopReason = "success";
  if (lastCode !== 0) {
    stopReason = "pipeline_exit_nonzero_after_retries";
    if (!lastDetail?.zhOk) stopReason = "zh_batch_failed";
    else if (!lastDetail?.distOk) stopReason = "distribute_failed";
    else if (!lastDetail?.enOk || !lastDetail?.enAutoOk) stopReason = "en_pipeline_failed";
  } else if (
    zhDelta === 0 &&
    enDelta === 0 &&
    (lastDetail?.zhAttempted || lastDetail?.enAttempted)
  ) {
    stopReason = "no_new_progress_possible_no_candidates_or_all_skipped";
    notes.push("zero_delta_progress");
  }

  const safety: SafetyStatus = state.orchestrator_safe_mode
    ? health.ok
      ? "safe_mode"
      : "degraded"
    : "normal";

  if (lastCode === 0) {
    const s = loadPipelineState(statePath);
    if (s.orchestrator_safe_mode && s.high_failure_streak === 0) {
      s.orchestrator_safe_mode = false;
      s.safe_mode_reason = null;
      savePipelineState(s, statePath);
      notes.push("safe_mode_cleared_after_clean_run");
    }
    logEvent("daily_run_completed", { stop_reason: stopReason, zhDelta, enDelta, mode });
  } else {
    logEvent("daily_run_failed", { stop_reason: stopReason, failuresCount, retriesCount });
  }

  if (process.env.SEO_BG_SKIP_EN_BLOG === "1") {
    notes.push("en_blog_skipped_SEO_BG_SKIP_EN_BLOG");
  }

  const completedAt = new Date().toISOString();
  const report: DailyReport = {
    date: new Date().toISOString().slice(0, 10),
    en_status: enStatus,
    zh_status: zhStatus,
    en_generated_count: enDelta,
    zh_generated_count: zhDelta,
    retrieval_share: Number(costData.retrieval_share ?? 0),
    ai_share: Number(costData.ai_share ?? 0),
    avg_cost_per_page: Number(costData.avg_cost_per_page ?? 0),
    failures_count: failuresCount,
    retries_count: retriesCount,
    stop_reason: stopReason,
    safety_status: safety,
    notes,
    updatedAt: completedAt,
    orchestrator_cycle_started_at: cycleStartedAt,
    orchestrator_completed_at: completedAt,
    orchestrator_exit_code: lastCode,
    run_mode: mode
  };

  writeDailyReport(report, mode);
  appendProductionHistory(CWD, { ...report });

  const actMode = mode === "dry_run" ? "dry_run" : "live";
  activation.writeRunHeartbeat(CWD, {
    success: lastCode === 0,
    zh_generated: zhDelta,
    en_generated: enDelta,
    stop_reason: stopReason,
    run_mode: actMode
  });
  if (mode === "live" && lastCode === 0) {
    activation.clearMissedRunAlertOnSuccess(CWD);
  }
  activation.updateRealMetrics(CWD, {
    daily_zh: zhDelta,
    daily_en: enDelta,
    retrieval_share: Number(costData.retrieval_share ?? 0),
    avg_cost_per_page: Number(costData.avg_cost_per_page ?? 0),
    run_success: lastCode === 0,
    stop_reason: stopReason
  });
  activation.recordDegradedStreakFromReport(CWD);
  activation.evaluateAndWriteCriticalState(CWD);

  return lastCode;
  } finally {
    const fin = loadPipelineState(statePath);
    fin.last_orchestrator_completed_at = new Date().toISOString();
    savePipelineState(fin, statePath);
  }
}

function main() {
  const { watch, intervalMs, mode } = parseArgs();
  if (watch && mode === "check_only") {
    console.error("[daily-orchestrator] --watch cannot be used with --check-only");
    process.exit(2);
  }
  if (watch) {
    const tick = () => {
      const code = runDailyCycle();
      console.log(`[daily-orchestrator] cycle exit ${code}; next in ${intervalMs}ms`);
    };
    tick();
    setInterval(tick, intervalMs);
    return;
  }
  process.exit(runDailyCycle());
}

if (isPrimaryScriptEntry("run-daily-orchestrator.ts")) {
  main();
}
