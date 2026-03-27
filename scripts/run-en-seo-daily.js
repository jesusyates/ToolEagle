#!/usr/bin/env node
/**
 * V122 — EN SEO daily autopilot (main growth engine).
 *
 * Runs in order:
 * 1) build-content-allocation-plan.js
 * 2) en-blog-growth-engine.js
 * 3) process-indexing-queue.js --max=30
 * 4) update-run-mode-status.js
 *
 * After growth + indexing, writes:
 *   generated/en-growth-daily-status.json
 *
 * IMPORTANT:
 * - Passive optimization system remains untouched (no seo:opt:apply write).
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();

const OBSERVATION_LOG = path.join(ROOT, "logs", "seo-observation.jsonl");
const DECISION_LOG = path.join(ROOT, "logs", "seo-growth-scheduler-decisions.jsonl");
const INDEXING_LOG = path.join(ROOT, "logs", "indexing-submissions.jsonl");
const SURFACE_LAST_RUN = path.join(ROOT, "generated", "en-content-surface-last-run.json");

const OUT = path.join(ROOT, "generated", "en-growth-daily-status.json");
const LOCK_PATH = path.join(ROOT, "logs", "locks", "en-daily-growth.lock");

const TARGET_DAILY_LIMIT = 30; // V122: ramped daily target
const INDEXING_MAX = 30;
const GROWTH_PRIORITY_PATH = path.join(ROOT, "generated", "growth-priority.json");
const ANSWERS_DAILY_CAP = 5;
const GUIDES_DAILY_CAP = 2;
const STALE_LOCK_MS = 8 * 60 * 60 * 1000;

function isoDateUTC(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function safeReadText(filePath) {
  try {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function readJson(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function parseJsonlEntries(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  return raw
    .split(/\n+/)
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function getLastRealPublishTs(entries) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e && e.mode === "real_publish" && typeof e.timestamp === "string") return e.timestamp;
  }
  return null;
}

function getLastDecision(entries) {
  const arr = Array.isArray(entries) ? entries : [];
  return arr.length ? arr[arr.length - 1] : null;
}

function runCommand(label, cmd, args) {
  const line = `${cmd} ${args.join(" ")}`.trim();
  console.log(`[V122] ${label}: ${line}`);
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true });
  if ((res.status ?? 1) !== 0) {
    throw new Error(`Command failed: ${line} (exit=${res.status ?? 1})`);
  }
}

function runCommandAllowFail(label, cmd, args) {
  const line = `${cmd} ${args.join(" ")}`.trim();
  console.log(`[V122] ${label}: ${line}`);
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true });
  const code = res.status ?? 1;
  if (code !== 0) {
    console.warn(`[V122] ${label} soft-check failed (exit=${code}), continue pipeline.`);
  }
  return code;
}

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
      console.log(`[V122] lock active: EN daily growth already running (pid=${existing.pid}), abort new run.`);
      process.exit(0);
    }
    if (stale || invalid || !running) {
      try {
        fs.unlinkSync(LOCK_PATH);
      } catch {}
      console.log("[V122.1] stale lock recovered for EN daily growth.");
    }
  }

  fs.writeFileSync(
    LOCK_PATH,
    JSON.stringify(
      {
        pid: process.pid,
        startedAt: new Date().toISOString(),
        script: "run-en-seo-daily.js"
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

function main() {
  acquireLockOrExit();
  const startAt = new Date().toISOString();
  const date = isoDateUTC();

  if (!fs.existsSync(GROWTH_PRIORITY_PATH)) {
    console.warn(`[V122] WARNING: missing ${GROWTH_PRIORITY_PATH}. build-content-allocation-plan.js may be less accurate until watcher updates growth data.`);
  }

  // Pre-snapshots so the status file describes "this run" rather than "everything today".
  const preObsEntries = parseJsonlEntries(safeReadText(OBSERVATION_LOG));
  const preObsLastTs = getLastRealPublishTs(preObsEntries);

  const preIndexEntries = parseJsonlEntries(safeReadText(INDEXING_LOG));
  const preIndexLastTs = preIndexEntries.length ? String(preIndexEntries[preIndexEntries.length - 1].at || "") : null;

  const preDecisionEntries = parseJsonlEntries(safeReadText(DECISION_LOG));
  const preDecisionLastTs = preDecisionEntries.length ? String(preDecisionEntries[preDecisionEntries.length - 1].timestamp || "") : null;

  // 1) content allocation
  runCommandAllowFail("blueprint-alignment-soft-check", "node", ["scripts/validate-blueprint-alignment.js"]);

  // 1.5) content allocation
  runCommand("allocation-plan", "node", ["scripts/build-content-allocation-plan.js"]);

  // 2) growth engine (real publish)
  runCommand("en-blog-growth-engine", "node", ["scripts/en-blog-growth-engine.js"]);

  // 2.5) content surface expansion planning (EN only)
  runCommand("en-content-surface-plan", "node", ["scripts/build-en-content-surface-plan.js"]);

  // 2.6) controlled secondary layers (answers/guides)
  runCommand("en-surface-expansion", "node", [
    "scripts/run-en-surface-expansion.js",
    "--answers-max",
    String(ANSWERS_DAILY_CAP),
    "--guides-max",
    String(GUIDES_DAILY_CAP)
  ]);

  // 3) indexing queue
  runCommand("indexing-queue", "node", ["scripts/process-indexing-queue.js", "--max", String(INDEXING_MAX)]);

  // 4) run-mode status
  runCommand("update-run-mode-status", "node", ["scripts/update-run-mode-status.js"]);

  // Post-snapshots for status aggregation.
  const postObsEntries = parseJsonlEntries(safeReadText(OBSERVATION_LOG));
  const newGrowth = postObsEntries.filter((e) => {
    if (!e || e.mode !== "real_publish") return false;
    const ts = e.timestamp;
    if (!ts || typeof ts !== "string") return false;
    if (preObsLastTs && ts <= preObsLastTs) return false;
    return true;
  });

  const attempted = newGrowth.reduce((sum, e) => sum + Number(e.attempted || 0), 0);
  const created = newGrowth.reduce((sum, e) => sum + Number(e.created || 0), 0);
  const rejected = newGrowth.reduce((sum, e) => sum + Number(e.rejected || 0), 0);
  const rejectionRate = attempted > 0 ? rejected / attempted : 0;
  const actualBatchesRun = newGrowth.length;

  const postDecisions = parseJsonlEntries(safeReadText(DECISION_LOG));
  const lastDecision = getLastDecision(postDecisions);
  const surface = readJson(SURFACE_LAST_RUN, {});
  const answersCreated = Number(surface?.answersCreated) || 0;
  const guidesCreated = Number(surface?.guidesCreated) || 0;
  const primaryPagesCreated = Number(surface?.primaryPagesCreated) || 0;
  const supportingPagesCreated = Number(surface?.supportingPagesCreated) || 0;
  const skippedDueToConflict = Number(surface?.skippedDueToConflict) || 0;
  const downgradedGenerations = Number(surface?.downgradedGenerations) || 0;
  const cannibalizationPreventedCount = Number(surface?.cannibalizationPreventedCount) || 0;
  const blogCreated = created;
  const totalCreated = blogCreated + answersCreated + guidesCreated;

  const latestRejectionRate = Number(lastDecision?.computed?.latestRejectionRate ?? rejectionRate);
  const finalDailyLimit = Number(lastDecision?.finalDailyLimit ?? TARGET_DAILY_LIMIT);
  const fallbackTriggered =
    !!lastDecision?.earlyWarning ||
    latestRejectionRate > 0.10 ||
    latestRejectionRate > 0.20 ||
    finalDailyLimit < TARGET_DAILY_LIMIT;

  // Indexing submissions added after this run started.
  const postIndexEntries = parseJsonlEntries(safeReadText(INDEXING_LOG));
  const newIndex = postIndexEntries.filter((e) => {
    if (!e || typeof e.at !== "string") return false;
    if (preIndexLastTs && e.at <= preIndexLastTs) return false;
    // Include both ok and fail? For indexingSubmitted we count only ok=true.
    return true;
  });
  const indexingSubmitted = newIndex.reduce((sum, e) => sum + (e.ok ? 1 : 0), 0);
  const indexingSubmittedByType = {
    blog: newIndex.reduce((sum, e) => sum + (e.ok && String(e.source || "").includes("generate-seo-blog") ? 1 : 0), 0),
    answers: newIndex.reduce((sum, e) => sum + (e.ok && String(e.source || "").includes("v123-surface-answer") ? 1 : 0), 0),
    guides: newIndex.reduce((sum, e) => sum + (e.ok && String(e.source || "").includes("v123-surface-guide") ? 1 : 0), 0)
  };

  const status = {
    date,
    targetDailyLimit: TARGET_DAILY_LIMIT,
    caps: {
      blogPrimary: TARGET_DAILY_LIMIT,
      answersSecondary: ANSWERS_DAILY_CAP,
      guidesSecondary: GUIDES_DAILY_CAP
    },
    actualBatchesRun,
    attempted,
    created: totalCreated,
    blogCreated,
    answersCreated,
    guidesCreated,
    totalCreated,
    primaryPagesCreated,
    supportingPagesCreated,
    skippedDueToConflict,
    downgradedGenerations,
    cannibalizationPreventedCount,
    rejected,
    rejectionRate,
    indexingSubmitted,
    indexingSubmittedByType,
    fallbackTriggered,
    summary:
      `V122 daily autopilot run at ${startAt}. ` +
      `Blog=${blogCreated}, answers=${answersCreated}, guides=${guidesCreated}, rejected=${rejected}, rejectionRate=${(rejectionRate * 100).toFixed(1)}%. ` +
      `Primary=${primaryPagesCreated}, supporting=${supportingPagesCreated}, downgraded=${downgradedGenerations}, conflictsPrevented=${cannibalizationPreventedCount}. ` +
      `IndexingSubmitted=${indexingSubmitted} (blog=${indexingSubmittedByType.blog}, answers=${indexingSubmittedByType.answers}, guides=${indexingSubmittedByType.guides}).`
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(status, null, 2), "utf8");
  console.log(`[V122] status written: ${OUT}`);
}

try {
  main();
} finally {
  releaseLock();
}

