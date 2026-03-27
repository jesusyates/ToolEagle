#!/usr/bin/env node
/**
 * V120 — Daily watcher for first real optimization batch readiness.
 *
 * Runs chain:
 * 1) npm run search:performance
 * 2) npm run search:growth
 * 3) npm run seo:opt:candidates
 * 4) npm run seo:opt:recommendations
 * 5) node scripts/check-optimization-readiness.js
 *
 * Then refreshes scheduler via dry-run (no writes):
 * - node scripts/optimize-en-pages.js --dry-run
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const OUT_STATUS = path.join(process.cwd(), "generated", "optimization-bootstrap-status.json");
const READINESS_PATH = path.join(process.cwd(), "generated", "optimization-readiness.json");
const SCHEDULER_PATH = path.join(process.cwd(), "generated", "optimization-scheduler-status.json");
const LOCK_PATH = path.join(process.cwd(), "logs", "locks", "optimization-watcher.lock");
const STALE_LOCK_MS = 8 * 60 * 60 * 1000;

function isPidRunning(pid) {
  const n = Number(pid);
  if (!Number.isFinite(n) || n <= 0) return false;
  try {
    process.kill(n, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLockOrExit() {
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  if (fs.existsSync(LOCK_PATH)) {
    let existing = null;
    try {
      existing = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
    } catch {
      existing = null;
    }

    const running = isPidRunning(existing?.pid);
    const ageMs = Date.now() - new Date(existing?.startedAt || 0).getTime();
    const stale = !running && (Number.isNaN(ageMs) || ageMs > STALE_LOCK_MS);
    const invalid = !running && !existing;

    if (running) {
      console.log(`[V120] lock active: watcher already running (pid=${existing.pid}), abort new run.`);
      process.exit(0);
    }
    if (stale || invalid || !running) {
      try {
        fs.unlinkSync(LOCK_PATH);
      } catch {}
      console.log("[V120] stale lock recovered for optimization watcher.");
    }
  }

  fs.writeFileSync(
    LOCK_PATH,
    JSON.stringify(
      {
        pid: process.pid,
        startedAt: new Date().toISOString(),
        script: "run-optimization-bootstrap-check.js"
      },
      null,
      2
    ),
    "utf8"
  );
}

function releaseLock() {
  try {
    if (!fs.existsSync(LOCK_PATH)) return;
    const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
    if (Number(lock?.pid) === process.pid) fs.unlinkSync(LOCK_PATH);
  } catch {}
}

function safeReadJson(p, fallback = null) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function runStep(label, command, args) {
  const commandLine = `${command} ${args.join(" ")}`.trim();
  console.log(`[V120] ${label}: ${commandLine}`);
  const res = spawnSync(commandLine, [], { stdio: "inherit", shell: true });
  const ok = (res.status ?? 1) === 0;
  return { ok, code: res.status ?? 1 };
}

function writeStatus(doc) {
  fs.mkdirSync(path.dirname(OUT_STATUS), { recursive: true });
  fs.writeFileSync(OUT_STATUS, JSON.stringify(doc, null, 2), "utf8");
}

function main() {
  acquireLockOrExit();
  const steps = [
    { label: "step1", command: "npm", args: ["run", "search:performance"] },
    { label: "step2", command: "npm", args: ["run", "search:growth"] },
    { label: "step3", command: "npm", args: ["run", "seo:opt:candidates"] },
    { label: "step4", command: "npm", args: ["run", "seo:opt:recommendations"] },
    { label: "step5", command: "node", args: ["scripts/check-optimization-readiness.js"] }
  ];

  const stepResults = [];
  for (const s of steps) {
    const r = runStep(s.label, s.command, s.args);
    stepResults.push({ ...s, ...r });
  }

  // Keep no-write behavior while still refreshing scheduler status snapshot.
  const refresh = runStep("scheduler-refresh", "node", ["scripts/optimize-en-pages.js", "--dry-run"]);
  stepResults.push({ label: "scheduler-refresh", command: "node", args: ["scripts/optimize-en-pages.js", "--dry-run"], ...refresh });

  const readiness = safeReadJson(READINESS_PATH, {});
  const scheduler = safeReadJson(SCHEDULER_PATH, {});

  const status = {
    checkedAt: new Date().toISOString(),
    inputMode: readiness?.inputMode || "stub",
    ready: !!readiness?.ready,
    candidateCount: Number(readiness?.candidateCount) || 0,
    recommendationCount: Number(readiness?.recommendationCount) || 0,
    highPotentialCount: Number(readiness?.highPotentialCount) || 0,
    schedulerNextAction: scheduler?.nextAction || "UNKNOWN",
    pauseType: scheduler?.pauseType || null,
    bootstrapEligible: !!scheduler?.bootstrapEligible,
    blockers: Array.isArray(readiness?.blockers) ? readiness.blockers : [],
    launchRecommended: !!readiness?.ready && scheduler?.nextAction === "ALLOW_FIRST_REAL_BATCH",
    recommendedCommand: "npm run seo:opt:apply -- --write --limit 5",
    stepResults
  };

  writeStatus(status);

  console.log("[V120] bootstrap-check summary");
  console.log(
    JSON.stringify(
      {
        inputMode: status.inputMode,
        candidateCount: status.candidateCount,
        recommendationCount: status.recommendationCount,
        highPotentialCount: status.highPotentialCount,
        schedulerNextAction: status.schedulerNextAction,
        bootstrapEligible: status.bootstrapEligible,
        ready: status.ready
      },
      null,
      2
    )
  );

  if (status.launchRecommended) {
    console.log("FIRST_REAL_BATCH_READY");
    console.log("Run:");
    console.log(status.recommendedCommand);
  } else {
    console.log("[V120] NOT_READY");
    console.log(`pauseType=${status.pauseType || "null"} reason=${scheduler?.reason || "n/a"}`);
    if (status.blockers.length) {
      console.log(`blockers=${status.blockers.join(",")}`);
    }
  }
}

try {
  main();
} finally {
  releaseLock();
}
