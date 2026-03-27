#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BOOTSTRAP_STATUS = path.join(ROOT, "generated", "optimization-bootstrap-status.json");
const SCHEDULER_STATUS = path.join(ROOT, "generated", "optimization-scheduler-status.json");
const OUT = path.join(ROOT, "generated", "run-mode-status.json");
const EN_LOCK = path.join(ROOT, "logs", "locks", "en-daily-growth.lock");
const WATCHER_LOCK = path.join(ROOT, "logs", "locks", "optimization-watcher.lock");

function readJson(p, fallback = {}) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function pidRunning(pid) {
  const n = Number(pid);
  if (!Number.isFinite(n) || n <= 0) return false;
  try {
    process.kill(n, 0);
    return true;
  } catch {
    return false;
  }
}

function lockState(lockPath) {
  if (!fs.existsSync(lockPath)) return { exists: false, running: false, pid: null, startedAt: null };
  try {
    const parsed = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    const running = pidRunning(parsed?.pid);
    return {
      exists: true,
      running,
      pid: Number(parsed?.pid) || null,
      startedAt: parsed?.startedAt || null
    };
  } catch {
    return { exists: true, running: false, pid: null, startedAt: null };
  }
}

function main() {
  const bootstrap = readJson(BOOTSTRAP_STATUS, {});
  const scheduler = readJson(SCHEDULER_STATUS, {});
  const enLock = lockState(EN_LOCK);
  const watcherLock = lockState(WATCHER_LOCK);
  const nextAction = bootstrap.schedulerNextAction || scheduler.nextAction || "UNKNOWN";
  const writeAllowed = nextAction === "ALLOW_NEXT_BATCH" || nextAction === "ALLOW_FIRST_REAL_BATCH";
  const enDailyGrowthRunning = !!enLock.running;
  const optimizationWatcherRunning = !!watcherLock.running;
  const taskOverlapDetected = enDailyGrowthRunning && optimizationWatcherRunning;

  const doc = {
    updatedAt: new Date().toISOString(),
    seoGrowthActive: true,
    indexingActive: true,
    optimizationWatcherActive: true,
    optimizationWriteLocked: !writeAllowed,
    enDailyGrowthRunning,
    optimizationWatcherRunning,
    taskOverlapDetected,
    lockStateSummary: {
      enDailyGrowth: enLock,
      optimizationWatcher: watcherLock
    },
    latestWatcherState: {
      checkedAt: bootstrap.checkedAt || null,
      inputMode: bootstrap.inputMode || null,
      ready: !!bootstrap.ready,
      schedulerNextAction: nextAction,
      pauseType: bootstrap.pauseType || scheduler.pauseType || null,
      bootstrapEligible: !!bootstrap.bootstrapEligible,
      launchRecommended: !!bootstrap.launchRecommended,
      blockers: Array.isArray(bootstrap.blockers) ? bootstrap.blockers : []
    },
    summary:
      "EN SEO growth and indexing are active. Optimization remains passive in background watcher mode with write lock enforced until first real batch readiness. Automation is guarded by scheduler non-reentry and script lock files."
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log(`[V121] run mode status -> ${OUT}`);
}

main();
