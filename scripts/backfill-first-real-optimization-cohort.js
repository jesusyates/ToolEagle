#!/usr/bin/env node
/**
 * V118 — Backfill first real optimization cohort into V117 scheduler system.
 *
 * Rules:
 * - Use registry/history as primary evidence.
 * - Exclude synthetic/stub/local verification writes.
 * - Only backfill when a controlled first batch (5 unique slugs) is reconstructable.
 * - If not reconstructable, lock scheduler to PAUSE to prevent blind new writes.
 */

const fs = require("fs");
const path = require("path");
const { ensureSchedulerStatus } = require("./lib/optimization-experiment-scheduler");

const REGISTRY_PATH = path.join(process.cwd(), "generated", "page-optimization-registry.json");
const HISTORY_PATH = path.join(process.cwd(), "generated", "page-optimization-history.jsonl");
const COHORTS_PATH = path.join(process.cwd(), "generated", "optimization-cohorts.json");
const STATUS_PATH = path.join(process.cwd(), "generated", "optimization-scheduler-status.json");
const REPORT_PATH = path.join(process.cwd(), "generated", "optimization-backfill-report.json");

function safeReadJson(p, fallback = null) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function readHistoryLines() {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  const text = fs.readFileSync(HISTORY_PATH, "utf8");
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function saveJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function isSyntheticOrStub(entry, historyByEntryId) {
  const reasons = Object.values(entry.policyReasonsByField || {})
    .map((x) => String(x || "").toLowerCase())
    .join(" | ");
  if (reasons.includes("stub")) return true;
  if (reasons.includes("synthetic")) return true;

  const h = historyByEntryId.get(entry.entryId);
  if (h) {
    const hReasons = Object.values(h.policyReasonsByField || {})
      .map((x) => String(x || "").toLowerCase())
      .join(" | ");
    if (hReasons.includes("stub")) return true;
    if (hReasons.includes("synthetic")) return true;
  }
  return false;
}

function toMs(iso) {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

function buildHistoryIndex(historyRows) {
  const m = new Map();
  for (const row of historyRows) {
    if (!row?.slug || !row?.at) continue;
    m.set(`${row.slug}@${row.at}`, row);
  }
  return m;
}

function groupByControlledBatch(entries, gapMinutes = 30) {
  const sorted = [...entries].sort((a, b) => toMs(a.optimizedAt) - toMs(b.optimizedAt));
  const groups = [];
  let current = [];

  for (const e of sorted) {
    if (!current.length) {
      current.push(e);
      continue;
    }
    const prev = current[current.length - 1];
    const gap = Math.abs(toMs(e.optimizedAt) - toMs(prev.optimizedAt));
    if (gap <= gapMinutes * 60000) {
      current.push(e);
    } else {
      groups.push(current);
      current = [e];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function toDayStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ageDaysFrom(createdAtIso) {
  const from = toDayStart(new Date(createdAtIso));
  const now = toDayStart(new Date());
  return Math.max(0, Math.floor((now - from) / 86400000));
}

function deriveStatusAndCheckpoints(createdAtIso) {
  const ageDays = ageDaysFrom(createdAtIso);
  const after7Ready = ageDays >= 7;
  const after14Ready = ageDays >= 14;
  let status = "active";
  if (after7Ready && !after14Ready) status = "measuring_after7";
  if (after14Ready) status = "measuring_after14";
  return { ageDays, after7Ready, after14Ready, status };
}

function main() {
  const registry = safeReadJson(REGISTRY_PATH, { entries: [] });
  const historyRows = readHistoryLines();
  const historyByEntryId = buildHistoryIndex(historyRows);
  const allEntries = Array.isArray(registry.entries) ? registry.entries : [];

  const realCandidates = allEntries.filter((e) => !isSyntheticOrStub(e, historyByEntryId));
  const groups = groupByControlledBatch(realCandidates);
  const firstControlled5 = groups.find((g) => {
    const uniqueSlugs = new Set(g.map((x) => x.slug));
    return uniqueSlugs.size === 5;
  });

  const excluded = allEntries
    .filter((e) => !realCandidates.includes(e))
    .map((e) => ({
      entryId: e.entryId,
      slug: e.slug,
      reason: "synthetic_or_stub_policy_reason"
    }));

  const cohortsDoc = safeReadJson(COHORTS_PATH, { updatedAt: null, version: 1, cohorts: [] });
  if (!Array.isArray(cohortsDoc.cohorts)) cohortsDoc.cohorts = [];
  if (!cohortsDoc.version) cohortsDoc.version = 1;

  let backfilled = null;
  if (firstControlled5) {
    const createdAt = [...firstControlled5]
      .map((e) => e.optimizedAt)
      .sort()[0];
    const cohortId = `v116-first-real-${String(createdAt).replace(/[:.]/g, "-")}`;

    const slugs = firstControlled5.map((e) => e.slug);
    const uniqueBuckets = Array.from(new Set(firstControlled5.map((e) => e.bucketAtOptimization).filter(Boolean)));
    const fieldsChanged = {};
    const optimizationTimestamps = {};
    const priorityReasons = {};
    for (const e of firstControlled5) {
      fieldsChanged[e.slug] = e.fieldsChanged || [];
      optimizationTimestamps[e.slug] = e.optimizedAt || createdAt;
      priorityReasons[e.slug] = e.priorityReason || null;
    }

    const progress = deriveStatusAndCheckpoints(createdAt);
    backfilled = {
      cohortId,
      createdAt,
      slugs,
      batchSize: 5,
      buckets: uniqueBuckets,
      fieldsChanged,
      optimizationTimestamps,
      priorityReasons,
      registryEntryIds: firstControlled5.map((e) => e.entryId),
      status: progress.status,
      measurementCheckpoints: {
        after7Ready: progress.after7Ready,
        after14Ready: progress.after14Ready
      },
      evaluation: null
    };

    const already = cohortsDoc.cohorts.some((c) => c.cohortId === cohortId);
    if (!already) cohortsDoc.cohorts.push(backfilled);
    cohortsDoc.updatedAt = new Date().toISOString();
    saveJson(COHORTS_PATH, cohortsDoc);
    ensureSchedulerStatus();
  } else {
    // No trustworthy first real 5-page cohort found from primary evidence.
    const pausedStatus = {
      updatedAt: new Date().toISOString(),
      currentActiveCohortId: null,
      cohortAgeDays: null,
      nextAction: "PAUSE",
      reason:
        "V118 backfill lock: no verifiable first real 5-page cohort found in registry/history; keep writes blocked until real cohort evidence is backfilled."
    };
    saveJson(STATUS_PATH, pausedStatus);
  }

  const report = {
    updatedAt: new Date().toISOString(),
    source: {
      registryPath: REGISTRY_PATH,
      historyPath: HISTORY_PATH
    },
    totalRegistryEntries: allEntries.length,
    syntheticExcludedCount: excluded.length,
    syntheticExcluded: excluded,
    realCandidateCount: realCandidates.length,
    controlledBatchesDetected: groups.map((g) => ({
      size: g.length,
      uniqueSlugs: Array.from(new Set(g.map((x) => x.slug))).length,
      startAt: [...g].map((x) => x.optimizedAt).sort()[0],
      endAt: [...g].map((x) => x.optimizedAt).sort().slice(-1)[0]
    })),
    backfilledCohort: backfilled,
    result: backfilled ? "backfilled" : "no_verifiable_real_first_batch"
  };
  saveJson(REPORT_PATH, report);

  if (backfilled) {
    console.log(`[V118] Backfilled cohort: ${backfilled.cohortId} (${backfilled.slugs.length} slug(s))`);
    return;
  }
  console.log("[V118] No verifiable first real 5-page cohort found. Scheduler paused for continuity lock.");
}

main();
