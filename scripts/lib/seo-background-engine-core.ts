/**
 * V153/V154 — Shared background SEO tick (spawn scripts, mutate pipeline state).
 * Used by run-background-seo-engine.ts and run-daily-orchestrator.ts.
 */

import { createRequire } from "module";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const { resolveRepoRoot } = require("./repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

/** Repo root from script location — not shell cwd. */
export const DEFAULT_REPO_ROOT = resolveRepoRoot();

export type SeoPipelineStatus = "idle" | "running" | "completed" | "partial";

export type SeoPipelineState = {
  en_status: SeoPipelineStatus;
  zh_status: SeoPipelineStatus;
  en_progress_count: number;
  zh_progress_count: number;
  last_run_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  consecutive_failures: number;
  zh_batch_size: number;
  en_blog_batch_size: number;
  /** V154 */
  orchestrator_safe_mode: boolean;
  safe_mode_reason: string | null;
  high_failure_streak: number;
  last_stall_detected_at: string | null;
  /** V155 — watchdog long-running lane detection */
  lane_running_since: { zh?: string; en?: string };
  /** V155 — orchestrator cycle markers (set by run-daily-orchestrator, not core tick) */
  last_orchestrator_completed_at: string | null;
  orchestrator_cycle_started_at: string | null;
};

export const DEFAULT_STATE_PATH = path.join(DEFAULT_REPO_ROOT, "generated", "seo-pipeline-state.json");

export function defaultPipelineState(): SeoPipelineState {
  return {
    en_status: "idle",
    zh_status: "idle",
    en_progress_count: 0,
    zh_progress_count: 0,
    last_run_at: null,
    last_success_at: null,
    last_error: null,
    consecutive_failures: 0,
    zh_batch_size: 12,
    en_blog_batch_size: 5,
    orchestrator_safe_mode: false,
    safe_mode_reason: null,
    high_failure_streak: 0,
    last_stall_detected_at: null,
    lane_running_since: {},
    last_orchestrator_completed_at: null,
    orchestrator_cycle_started_at: null
  };
}

export function loadPipelineState(statePath: string = DEFAULT_STATE_PATH): SeoPipelineState {
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return { ...defaultPipelineState(), ...raw };
  } catch {
    return defaultPipelineState();
  }
}

export function savePipelineState(state: SeoPipelineState, statePath: string = DEFAULT_STATE_PATH) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
}

function runNode(cwd: string, scriptRel: string, args: string[], envExtra?: NodeJS.ProcessEnv): boolean {
  const scriptAbs = path.resolve(cwd, scriptRel);
  const r = spawnSync(process.execPath, [scriptAbs, ...args], {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...envExtra }
  });
  return r.status === 0;
}

function recordLedger(cwd: string) {
  const snippet = `require(${JSON.stringify(path.join(cwd, "scripts", "seo-ledger.js"))}).recordSeoLedger({ reason: "background-seo-engine" });`;
  spawnSync(process.execPath, ["-e", snippet], { cwd, stdio: "pipe" });
}

export type BackgroundTickOptions = {
  cwd?: string;
  statePath?: string;
  zh: boolean;
  en: boolean;
  skipEnBlog?: boolean;
  /** When set, ignore state.zh_batch_size for this tick */
  zhBatchOverride?: number;
  enBatchOverride?: number;
  /** V156 — multiply final ZH batch after override (0–1); orchestrator passes search risk multiplier */
  riskZhBatchMultiplier?: number;
  /** V156 — multiply final EN blog limit after override */
  riskEnBatchMultiplier?: number;
  /** V161 — multiply ZH batch after risk clamp; typically 0.88–1.08 from traffic allocation artifact */
  allocationZhBatchScale?: number;
  /** V161 — multiply EN blog limit after risk clamp */
  allocationEnBatchScale?: number;
  /** Skip auto-distribute (orchestrator testing only) */
  skipDistribute?: boolean;
  /** V157 — pass SEO_DRY_RUN=1 to children; skip ledger */
  dryRun?: boolean;
};

export type BackgroundTickResult = {
  code: number;
  state: SeoPipelineState;
  detail: {
    zhAttempted: boolean;
    zhOk: boolean;
    distOk: boolean;
    enAttempted: boolean;
    enOk: boolean;
    enAutoOk: boolean;
  };
};

/**
 * Single V153 tick: optional ZH batch → distribute → optional EN blog + en:auto.
 */
export function runBackgroundSeoTick(opts: BackgroundTickOptions): BackgroundTickResult {
  const cwd = opts.cwd ?? DEFAULT_REPO_ROOT;
  const statePath = opts.statePath ?? DEFAULT_STATE_PATH;
  const childEnv: NodeJS.ProcessEnv | undefined = opts.dryRun
    ? { ...process.env, SEO_DRY_RUN: "1" }
    : undefined;
  const state = loadPipelineState(statePath);
  state.lane_running_since = state.lane_running_since || {};
  state.last_run_at = new Date().toISOString();
  state.last_error = null;

  if (state.consecutive_failures >= 3) {
    state.zh_batch_size = Math.max(5, state.zh_batch_size - 3);
    state.en_blog_batch_size = Math.max(2, state.en_blog_batch_size - 1);
  }

  const detail = {
    zhAttempted: false,
    zhOk: true,
    distOk: true,
    enAttempted: false,
    enOk: true,
    enAutoOk: true
  };

  let anyFail = false;

  if (opts.zh) {
    detail.zhAttempted = true;
    state.zh_status = "running";
    state.lane_running_since = { ...state.lane_running_since, zh: new Date().toISOString() };
    savePipelineState(state, statePath);
    let zhBatch = opts.zhBatchOverride ?? Math.min(20, Math.max(5, state.zh_batch_size));
    const rZh = opts.riskZhBatchMultiplier;
    if (rZh != null && rZh > 0 && rZh < 1) {
      zhBatch = Math.max(5, Math.floor(zhBatch * rZh));
    }
    const aZh = opts.allocationZhBatchScale;
    if (aZh != null && aZh > 0 && Number.isFinite(aZh)) {
      zhBatch = Math.max(5, Math.min(20, Math.floor(zhBatch * aZh)));
    }
    detail.zhOk = runNode(cwd, "scripts/auto-generate-zh.js", [`--batch-size=${zhBatch}`, "--no-git"], childEnv);
    if (detail.zhOk) {
      state.zh_status = "completed";
      state.zh_progress_count += zhBatch;
    } else {
      state.zh_status = "partial";
      anyFail = true;
      state.consecutive_failures = Math.min(20, state.consecutive_failures + 1);
      state.high_failure_streak = Math.min(50, state.high_failure_streak + 1);
    }
    const { zh: _z, ...restLanes } = state.lane_running_since;
    state.lane_running_since = restLanes;
  } else {
    state.zh_status = "idle";
    const { zh: _z, ...restLanes } = state.lane_running_since;
    state.lane_running_since = restLanes;
  }

  if (!opts.skipDistribute) {
    detail.distOk = runNode(cwd, "scripts/auto-distribute.js", [], childEnv);
    if (!detail.distOk) {
      anyFail = true;
      state.consecutive_failures = Math.min(20, state.consecutive_failures + 1);
    }
  }

  if (opts.en && !opts.skipEnBlog) {
    detail.enAttempted = true;
    state.en_status = "running";
    state.lane_running_since = { ...state.lane_running_since, en: new Date().toISOString() };
    savePipelineState(state, statePath);
    let enLimit = opts.enBatchOverride ?? Math.min(15, Math.max(2, state.en_blog_batch_size));
    const rEn = opts.riskEnBatchMultiplier;
    if (rEn != null && rEn > 0 && rEn < 1) {
      enLimit = Math.max(2, Math.floor(enLimit * rEn));
    }
    const aEn = opts.allocationEnBatchScale;
    if (aEn != null && aEn > 0 && Number.isFinite(aEn)) {
      enLimit = Math.max(2, Math.min(15, Math.floor(enLimit * aEn)));
    }
    const blogArgs = opts.dryRun ? ["--dry-run", "--limit", String(enLimit)] : ["--limit", String(enLimit)];
    detail.enOk = runNode(cwd, "scripts/generate-seo-blog.js", blogArgs, childEnv);
    if (detail.enOk) {
      state.en_status = "completed";
      state.en_progress_count += enLimit;
    } else {
      state.en_status = "partial";
      anyFail = true;
      state.consecutive_failures = Math.min(20, state.consecutive_failures + 1);
      state.high_failure_streak = Math.min(50, state.high_failure_streak + 1);
    }
    detail.enAutoOk = runNode(cwd, "scripts/en-auto.js", [], childEnv);
    if (!detail.enAutoOk) {
      anyFail = true;
      state.consecutive_failures = Math.min(20, state.consecutive_failures + 1);
    }
    const { en: _e, ...restEn } = state.lane_running_since;
    state.lane_running_since = restEn;
  } else {
    state.en_status = "idle";
    const { en: _e, ...restEn } = state.lane_running_since;
    state.lane_running_since = restEn;
  }

  if (!anyFail) {
    state.last_success_at = new Date().toISOString();
    state.consecutive_failures = 0;
    state.high_failure_streak = 0;
    state.zh_batch_size = Math.min(20, state.zh_batch_size + 1);
  } else {
    state.last_error = "one_or_more_stages_failed";
  }

  savePipelineState(state, statePath);
  if (!opts.dryRun) {
    recordLedger(cwd);
  }
  return { code: anyFail ? 1 : 0, state, detail };
}

export function parseBackgroundEngineArgs(argv: string[]) {
  const zhOnly = argv.includes("--zh-only");
  const enOnly = argv.includes("--en-only");
  const dryRun = argv.includes("--dry-run") || argv.includes("--sandbox");
  return {
    watch: argv.includes("--watch"),
    zh: !enOnly,
    en: !zhOnly,
    dryRun,
    intervalMs: Math.max(60_000, parseInt(process.env.SEO_BG_INTERVAL_MS || "21600000", 10) || 21600000)
  };
}
