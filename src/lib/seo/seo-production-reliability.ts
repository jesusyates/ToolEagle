/**
 * V155 — Production reliability: pure metrics (tests + scripts).
 *
 * Reliability score (0–100): start 100, subtract weighted penalties, clamp.
 * - missed_run_count: −12 each (max −48)
 * - stale_report_count: −15 each (max −30)
 * - partial_run_count (in window): −5 each (max −25)
 * - safe_mode_days: −4 each (max −20)
 * - avg_retries (last N runs): −3 × min(avg, 5)
 * - long_running_penalty: −15 if any lane stuck in "running" too long
 */

export type DailyReportSnapshot = {
  date: string;
  updatedAt?: string;
  en_status: string;
  zh_status: string;
  stop_reason?: string;
  safety_status?: string;
  failures_count?: number;
  retries_count?: number;
  orchestrator_exit_code?: number;
};

export type PipelineStateForWatchdog = {
  zh_status: string;
  en_status: string;
  last_run_at: string | null;
  last_success_at: string | null;
  last_orchestrator_completed_at?: string | null;
  orchestrator_cycle_started_at?: string | null;
  orchestrator_safe_mode?: boolean;
  lane_running_since?: { zh?: string; en?: string };
};

/** Cycle marked started but not completed within maxIncompleteMs (orchestrator crash / hang). */
export function detectIncompleteOrchestratorCycle(
  pipeline: PipelineStateForWatchdog,
  nowMs: number,
  maxIncompleteMs: number
): boolean {
  const start = pipeline.orchestrator_cycle_started_at;
  if (!start) return false;
  const startMs = new Date(start).getTime();
  if (nowMs - startMs < maxIncompleteMs) return false;
  const end = pipeline.last_orchestrator_completed_at;
  if (!end) return true;
  return new Date(end).getTime() < startMs;
}

export type ReliabilityComputationInput = {
  missed_run_count: number;
  stale_report_count: number;
  partial_run_count: number;
  safe_mode_days: number;
  recent_days: number;
  avg_retries: number;
  long_running: boolean;
};

export type ReliabilityComputationOutput = ReliabilityComputationInput & {
  reliability_score: number;
  long_running_penalty_applied: boolean;
};

export type WatchdogRecoveryDecision = {
  shouldTrigger: boolean;
  reason: string;
  /** Block recovery (degraded reporting only) */
  capReached: boolean;
};

/** Parse jsonl content (newest last = typical append; we sort by date+updatedAt). */
export function parseProductionHistoryJsonl(raw: string): DailyReportSnapshot[] {
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: DailyReportSnapshot[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as DailyReportSnapshot);
    } catch {
      // skip bad line
    }
  }
  return out;
}

export function loadRecentDailyReportsFromSnapshots(
  snapshots: DailyReportSnapshot[],
  maxEntries: number
): DailyReportSnapshot[] {
  const sorted = [...snapshots].sort((a, b) => {
    const da = `${a.date}|${a.updatedAt || ""}`;
    const db = `${b.date}|${b.updatedAt || ""}`;
    return da.localeCompare(db);
  });
  return sorted.slice(-maxEntries);
}

/**
 * Past completed UTC calendar days only: yesterday .. yesterday-(lookbackDays-1).
 * Today is excluded (run may still be scheduled).
 */
export function detectMissedRuns(
  snapshots: DailyReportSnapshot[],
  now: Date,
  lookbackDays: number
): { missedDates: string[]; missed_run_count: number } {
  const datesWithRun = new Set(snapshots.map((s) => s.date).filter(Boolean));
  const missed: string[] = [];
  for (let i = 1; i <= lookbackDays; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const ds = utcDateString(d);
    if (!datesWithRun.has(ds)) missed.push(ds);
  }
  return { missedDates: missed, missed_run_count: missed.length };
}

function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function detectStaleReport(
  latestReport: { updatedAt?: string } | null,
  reportFileMtimeMs: number | null,
  nowMs: number,
  maxAgeMs: number
): { stale: boolean; age_ms: number; source: "updatedAt" | "mtime" | "missing" } {
  if (!latestReport && reportFileMtimeMs == null) {
    return { stale: true, age_ms: Number.POSITIVE_INFINITY, source: "missing" };
  }
  const t =
    latestReport?.updatedAt != null
      ? new Date(latestReport.updatedAt).getTime()
      : reportFileMtimeMs ?? 0;
  if (!Number.isFinite(t) || t <= 0) {
    const age = reportFileMtimeMs != null ? nowMs - reportFileMtimeMs : Number.POSITIVE_INFINITY;
    return { stale: age > maxAgeMs, age_ms: age, source: "mtime" };
  }
  const age = nowMs - t;
  return { stale: age > maxAgeMs, age_ms: age, source: "updatedAt" };
}

export function detectLongRunningStates(
  pipeline: PipelineStateForWatchdog,
  nowMs: number,
  maxRunningMs: number
): { long_running: boolean; lanes: string[] } {
  const lanes: string[] = [];
  const since = pipeline.lane_running_since || {};
  if (pipeline.zh_status === "running" && since.zh) {
    if (nowMs - new Date(since.zh).getTime() > maxRunningMs) lanes.push("zh");
  }
  if (pipeline.en_status === "running" && since.en) {
    if (nowMs - new Date(since.en).getTime() > maxRunningMs) lanes.push("en");
  }
  return { long_running: lanes.length > 0, lanes };
}

export function countPartialRunsInSnapshots(snapshots: DailyReportSnapshot[]): number {
  return snapshots.filter((s) => s.zh_status === "partial" || s.en_status === "partial").length;
}

export function countSafeModeDaysInSnapshots(snapshots: DailyReportSnapshot[]): number {
  return snapshots.filter((s) => s.safety_status === "safe_mode" || s.safety_status === "degraded").length;
}

export function averageRetriesInSnapshots(snapshots: DailyReportSnapshot[]): number {
  if (snapshots.length === 0) return 0;
  const sum = snapshots.reduce((a, s) => a + (s.retries_count ?? 0), 0);
  return Math.round((sum / snapshots.length) * 100) / 100;
}

export function laneHealthFromSnapshots(
  snapshots: DailyReportSnapshot[],
  lane: "zh" | "en"
): "ok" | "degraded" | "failing" {
  if (snapshots.length === 0) return "degraded";
  const key = lane === "zh" ? "zh_status" : "en_status";
  const last3 = snapshots.slice(-3);
  const failed = last3.filter((s) => s[key] === "failed").length;
  const partial = last3.filter((s) => s[key] === "partial").length;
  if (failed >= 2) return "failing";
  if (partial >= 2 || failed === 1) return "degraded";
  return "ok";
}

export function computeProductionReliability(input: ReliabilityComputationInput): ReliabilityComputationOutput {
  let score = 100;
  const missPenalty = Math.min(48, 12 * input.missed_run_count);
  const stalePenalty = Math.min(30, 15 * input.stale_report_count);
  const partialPenalty = Math.min(25, 5 * input.partial_run_count);
  const safePenalty = Math.min(20, 4 * input.safe_mode_days);
  const retryPenalty = 3 * Math.min(5, input.avg_retries);
  const longPen = input.long_running ? 15 : 0;

  score -= missPenalty + stalePenalty + partialPenalty + safePenalty + retryPenalty + longPen;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    ...input,
    reliability_score: score,
    long_running_penalty_applied: input.long_running
  };
}

/** Full output object for summary artifact + watchdog. */
export function buildReliabilityMetrics(ctx: {
  snapshots: DailyReportSnapshot[];
  now: Date;
  lookbackDays: number;
  latestReport: DailyReportSnapshot | null;
  reportMtimeMs: number | null;
  staleMaxAgeMs: number;
  pipeline: PipelineStateForWatchdog;
  longRunningMaxMs: number;
  partialWindowSize?: number;
  safeModeWindowSize?: number;
  /** Max age of an orchestrator cycle without completion marker (incomplete = stale). */
  orchestratorIncompleteMaxMs?: number;
}): ReliabilityComputationOutput & {
  missed_run_count: number;
  stale_report_count: number;
  missedDates: string[];
  stale_detail: ReturnType<typeof detectStaleReport>;
  orchestrator_incomplete_cycle: boolean;
  long_running_lanes: string[];
  en_health: "ok" | "degraded" | "failing";
  zh_health: "ok" | "degraded" | "failing";
} {
  const recent = loadRecentDailyReportsFromSnapshots(ctx.snapshots, 120);
  const { missedDates, missed_run_count } = detectMissedRuns(recent, ctx.now, ctx.lookbackDays);
  const stale_detail = detectStaleReport(
    ctx.latestReport,
    ctx.reportMtimeMs,
    ctx.now.getTime(),
    ctx.staleMaxAgeMs
  );
  const incomplete = detectIncompleteOrchestratorCycle(
    ctx.pipeline,
    ctx.now.getTime(),
    ctx.orchestratorIncompleteMaxMs ?? 4 * 60 * 60 * 1000
  );
  let stale_report_count = (stale_detail.stale ? 1 : 0) + (incomplete ? 1 : 0);
  stale_report_count = Math.min(3, stale_report_count);
  const pw = ctx.partialWindowSize ?? 14;
  const sw = ctx.safeModeWindowSize ?? 14;
  const partial_run_count = countPartialRunsInSnapshots(recent.slice(-pw));
  const safe_mode_days = countSafeModeDaysInSnapshots(recent.slice(-sw));
  const avg_retries = averageRetriesInSnapshots(recent.slice(-pw));
  const lr = detectLongRunningStates(ctx.pipeline, ctx.now.getTime(), ctx.longRunningMaxMs);

  const base = computeProductionReliability({
    missed_run_count,
    stale_report_count,
    partial_run_count,
    safe_mode_days,
    recent_days: Math.min(ctx.lookbackDays, recent.length || ctx.lookbackDays),
    avg_retries,
    long_running: lr.long_running
  });

  return {
    ...base,
    missedDates,
    stale_detail,
    orchestrator_incomplete_cycle: incomplete,
    long_running_lanes: lr.lanes,
    en_health: laneHealthFromSnapshots(recent.slice(-pw), "en"),
    zh_health: laneHealthFromSnapshots(recent.slice(-pw), "zh")
  };
}

/**
 * Watchdog recovery: cap triggers per UTC day; after cap, only degraded reporting.
 */
export function decideWatchdogRecovery(input: {
  missedOrStale: boolean;
  recoveryEnabled: boolean;
  triggersToday: number;
  maxTriggersPerDay: number;
  degradedReportingOnly: boolean;
}): WatchdogRecoveryDecision {
  if (input.degradedReportingOnly) {
    return { shouldTrigger: false, reason: "degraded_reporting_only", capReached: true };
  }
  if (!input.recoveryEnabled) {
    return { shouldTrigger: false, reason: "recovery_disabled", capReached: false };
  }
  if (!input.missedOrStale) {
    return { shouldTrigger: false, reason: "no_issue", capReached: false };
  }
  if (input.triggersToday >= input.maxTriggersPerDay) {
    return { shouldTrigger: false, reason: "daily_recovery_cap", capReached: true };
  }
  return { shouldTrigger: true, reason: "missed_or_stale", capReached: false };
}
