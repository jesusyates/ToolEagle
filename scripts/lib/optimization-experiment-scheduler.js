/**
 * Governed by docs/system-blueprint.md.
 * Do not implement logic that conflicts with blueprint rules.
 */
const fs = require("fs");
const path = require("path");

const COHORTS_PATH = path.join(process.cwd(), "generated", "optimization-cohorts.json");
const STATUS_PATH = path.join(process.cwd(), "generated", "optimization-scheduler-status.json");
const IMPACT_PATH = path.join(process.cwd(), "generated", "page-optimization-impact.json");
const LESSONS_PATH = path.join(process.cwd(), "generated", "page-optimization-lessons.json");
const READINESS_PATH = path.join(process.cwd(), "generated", "optimization-readiness.json");
const SEARCH_PERF_PATH = path.join(process.cwd(), "generated", "search-performance.json");
const CANDIDATES_PATH = path.join(process.cwd(), "generated", "page-optimization-candidates.json");
const RECS_PATH = path.join(process.cwd(), "generated", "page-optimization-recommendations.json");

function safeReadJson(p, fallback = null) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function hasRealGscDrivenInputs() {
  const perf = safeReadJson(SEARCH_PERF_PATH, {});
  if (perf?.error) return false;
  if (!Array.isArray(perf?.pages) || perf.pages.length === 0) return false;

  const candidatesDoc = safeReadJson(CANDIDATES_PATH, {});
  const candidates = Array.isArray(candidatesDoc?.candidates) ? candidatesDoc.candidates : [];
  if (!candidates.length) return false;

  const recDoc = safeReadJson(RECS_PATH, {});
  const recs = Array.isArray(recDoc?.items) ? recDoc.items : [];
  if (!recs.length) return false;

  const highPotentialCount = candidates.filter((c) => c?.bucket === "high_potential").length;
  return highPotentialCount > 0;
}

function hasVerifiedHistoricalRealCohort(cohortsDoc) {
  const list = Array.isArray(cohortsDoc?.cohorts) ? cohortsDoc.cohorts : [];
  // "Verified historical real cohort" = at least one cohort with a completed/evaluated outcome.
  return list.some((c) => (c?.status === "completed" && !!c?.evaluation?.result) || !!c?.evaluation?.result);
}

function hasNoDataBlockers(readiness) {
  const blockers = Array.isArray(readiness?.blockers) ? readiness.blockers : [];
  const needed = ["search_performance_is_stub_or_empty", "candidate_list_empty", "recommendation_list_empty"];
  return needed.every((b) => blockers.includes(b));
}

function safeWriteJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function toDayStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDiffFrom(iso) {
  const from = toDayStart(new Date(iso));
  const now = toDayStart(new Date());
  return Math.max(0, Math.floor((now - from) / 86400000));
}

function loadCohorts() {
  const doc = safeReadJson(COHORTS_PATH, { updatedAt: null, version: 1, cohorts: [] });
  if (!Array.isArray(doc.cohorts)) doc.cohorts = [];
  if (!doc.version) doc.version = 1;
  return doc;
}

function saveCohorts(doc) {
  doc.updatedAt = new Date().toISOString();
  safeWriteJson(COHORTS_PATH, doc);
}

function deriveStatusFromProgress(cohort) {
  if (cohort?.evaluation?.result) return "completed";
  if (!cohort?.measurementCheckpoints?.after7Ready) return "active";
  if (!cohort?.measurementCheckpoints?.after14Ready) return "measuring_after7";
  return "measuring_after14";
}

function updateCohortProgress(cohort) {
  const ageDays = dayDiffFrom(cohort.createdAt);
  const after7Ready = ageDays >= 7;
  const after14Ready = ageDays >= 14;
  cohort.measurementCheckpoints = {
    after7Ready,
    after14Ready
  };
  cohort.status = deriveStatusFromProgress(cohort);
  return cohort;
}

function updateAllCohortProgress(doc) {
  doc.cohorts = (doc.cohorts || []).map((c) => updateCohortProgress(c));
  return doc;
}

function latestNonCompletedCohort(doc) {
  const list = (doc.cohorts || []).filter((c) => c.status !== "completed");
  if (!list.length) return null;
  list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return list[0];
}

function getBlockingCohort(doc) {
  const active = latestNonCompletedCohort(doc);
  if (!active) return null;
  const after14Ready = !!active.measurementCheckpoints?.after14Ready;
  const hasEvaluation = !!active.evaluation?.result;
  if (!after14Ready || !hasEvaluation) return active;
  return null;
}

function sumOutcomes(byOutcome) {
  if (!byOutcome || typeof byOutcome !== "object") return 0;
  return Object.values(byOutcome).reduce((acc, x) => acc + (Number(x) || 0), 0);
}

function evaluateOutcomeForCohort(cohort, impactDoc, lessonsDoc) {
  const records = Array.isArray(impactDoc?.records) ? impactDoc.records : [];
  const entryIds = new Set(cohort.registryEntryIds || []);
  const cohortRecords = records.filter((r) => (entryIds.size ? entryIds.has(r.entryId) : (cohort.slugs || []).includes(r.slug)));

  if (!cohortRecords.length) {
    return {
      result: "insufficient_data",
      nextBatchSize: 5,
      nextAction: "WAIT",
      reason: "No impact records found for active cohort yet."
    };
  }

  const measuredAfter14 = cohortRecords.filter((r) => {
    const cls = r.classification?.outcome;
    return cls && cls !== "insufficient_data";
  });

  if (!measuredAfter14.length) {
    return {
      result: "insufficient_data",
      nextBatchSize: 5,
      nextAction: "WAIT",
      reason: "after14 not materially measured yet (insufficient_data only)."
    };
  }

  const byOutcome = lessonsDoc?.aggregates?.byOutcome || {};
  const improved =
    (byOutcome.improved_ctr || 0) +
    (byOutcome.improved_clicks || 0) +
    (byOutcome.improved_position || 0);
  const neutral = byOutcome.neutral || 0;
  const worse = byOutcome.worse || 0;
  const total = sumOutcomes(byOutcome) || measuredAfter14.length;
  const strongPositive = improved / Math.max(1, total) >= 0.6 && worse === 0;

  if (worse > 0) {
    return {
      result: "worse_signals",
      nextBatchSize: 3,
      nextAction: "PAUSE",
      reason: "Worse signals detected in measured outcomes; reduce batch or pause risky fields."
    };
  }
  if (strongPositive) {
    return {
      result: "strong_positive",
      nextBatchSize: 8,
      nextAction: "ALLOW_NEXT_BATCH",
      reason: "Strong positive signal with low risk; cautious expansion is allowed."
    };
  }
  if (improved + neutral >= 1) {
    return {
      result: "mostly_improved_or_neutral",
      nextBatchSize: 5,
      nextAction: "ALLOW_NEXT_BATCH",
      reason: "Mostly improved/neutral signal; keep safe batch size 5."
    };
  }
  return {
    result: "insufficient_data",
    nextBatchSize: 5,
    nextAction: "WAIT",
    reason: "Not enough stable evidence to progress."
  };
}

function ensureSchedulerStatus() {
  const cohorts = updateAllCohortProgress(loadCohorts());
  saveCohorts(cohorts);

  const active = latestNonCompletedCohort(cohorts);
  const cohortsDoc = cohorts || {};
  const hasVerifiedRealCohort = hasVerifiedHistoricalRealCohort(cohortsDoc);

  const readiness = safeReadJson(READINESS_PATH, {});
  const readinessInputMode = readiness?.inputMode || null;
  const candidateCount = Number(readiness?.candidateCount) || 0;
  const recommendationCount = Number(readiness?.recommendationCount) || 0;
  const highPotentialCount = Number(readiness?.highPotentialCount) || 0;
  const dataReady =
    readinessInputMode === "real" &&
    candidateCount >= 5 &&
    recommendationCount >= 5 &&
    highPotentialCount >= 1;
  const hasRealInputsNow = hasRealGscDrivenInputs();
  const bootstrapEligible = !hasVerifiedRealCohort && dataReady && hasRealInputsNow;
  const noDataPause = hasNoDataBlockers(readiness);

  const status = {
    updatedAt: new Date().toISOString(),
    currentActiveCohortId: active?.cohortId ?? null,
    cohortAgeDays: active ? dayDiffFrom(active.createdAt) : null,
    pauseType: null,
    bootstrapEligible,
    dataReady,
    nextAction: "PAUSE_NO_DATA",
    reason: bootstrapEligible
      ? "real data arrived, bootstrap first batch allowed"
      : "No data-ready signal for first real batch yet."
  };

  if (active) {
    const after7Ready = !!active.measurementCheckpoints?.after7Ready;
    const after14Ready = !!active.measurementCheckpoints?.after14Ready;
    const hasEvaluation = !!active.evaluation?.result;

    // Continuity progression: always keep writes locked until after14 evaluation exists.
    if (!after7Ready) {
      status.nextAction = "WAIT";
      status.reason = "Active cohort is still aging toward after7 checkpoint (write locked).";
    } else if (!after14Ready) {
      status.nextAction = "MEASURE_AFTER7";
      status.reason = "after7 checkpoint ready; run measurement as early reference (writes still locked).";
    } else if (!hasEvaluation) {
      status.nextAction = "MEASURE_AFTER14";
      status.reason = "after14 checkpoint ready; run seo:opt:measure to evaluate before next batch (writes locked).";
    } else {
      status.nextAction = active.evaluation.nextAction === "ALLOW_NEXT_BATCH" ? "ALLOW_NEXT_BATCH" : "PAUSE_CONTINUITY";
      status.reason = active.evaluation.reason || "Evaluation available.";
    }
    if (["WAIT", "MEASURE_AFTER7", "MEASURE_AFTER14"].includes(status.nextAction)) {
      status.pauseType = "CONTINUITY";
    } else if (status.nextAction === "PAUSE_CONTINUITY") {
      status.pauseType = "CONTINUITY";
    }
    status.bootstrapEligible = false;
    status.dataReady = false;
  } else {
    // No active cohort: bootstrap first real batch when data-ready trigger fires.
    if (bootstrapEligible) {
      status.nextAction = "ALLOW_FIRST_REAL_BATCH";
      status.reason = "real data arrived, bootstrap first batch allowed";
      status.pauseType = null;
    } else {
      status.nextAction = noDataPause ? "PAUSE_NO_DATA" : "PAUSE_CONTINUITY";
      status.pauseType = noDataPause ? "NO_DATA" : "CONTINUITY";
      const blockers = Array.isArray(readiness?.blockers) ? readiness.blockers : [];
      const first = blockers[0] ? ` (${blockers[0]})` : "";
      status.reason = noDataPause
        ? `No data-ready signal yet.${first}`
        : `Continuity constraints prevent bootstrap release.${first}`;
    }
  }

  safeWriteJson(STATUS_PATH, status);
  return status;
}

function assertWriteAllowedOrExit() {
  const status = ensureSchedulerStatus();
  const allowed = status?.nextAction === "ALLOW_NEXT_BATCH" || status?.nextAction === "ALLOW_FIRST_REAL_BATCH";
  if (!allowed) {
    console.error(status?.reason || "Optimization write blocked by scheduler.");
    process.exit(1);
  }
}

function registerCohortFromWriteBatch(registryBatch, batchSize) {
  if (!Array.isArray(registryBatch) || !registryBatch.length) {
    return null;
  }

  const now = new Date().toISOString();
  const cohortId = `cohort-${now.replace(/[:.]/g, "-")}`;
  const slugs = registryBatch.map((x) => x.slug);
  const uniqueBuckets = Array.from(new Set(registryBatch.map((x) => x.bucketAtOptimization).filter(Boolean)));
  const fieldsChanged = {};
  const optimizationTimestamps = {};
  const priorityReasons = {};

  for (const entry of registryBatch) {
    fieldsChanged[entry.slug] = entry.fieldsChanged || [];
    optimizationTimestamps[entry.slug] = entry.optimizedAt || now;
    priorityReasons[entry.slug] = entry.priorityReason || null;
  }

  const cohort = updateCohortProgress({
    cohortId,
    createdAt: now,
    slugs,
    registryEntryIds: registryBatch.map((x) => x.entryId).filter(Boolean),
    batchSize: batchSize || registryBatch.length,
    buckets: uniqueBuckets,
    fieldsChanged,
    optimizationTimestamps,
    priorityReasons,
    status: "active",
    measurementCheckpoints: {
      after7Ready: false,
      after14Ready: false
    },
    evaluation: null
  });

  const doc = loadCohorts();
  doc.cohorts.push(cohort);
  saveCohorts(doc);
  ensureSchedulerStatus();
  return cohort;
}

function refreshCohortEvaluationFromImpact() {
  const doc = updateAllCohortProgress(loadCohorts());
  const active = latestNonCompletedCohort(doc);
  if (!active) {
    saveCohorts(doc);
    return ensureSchedulerStatus();
  }

  if (!active.measurementCheckpoints?.after14Ready) {
    saveCohorts(doc);
    return ensureSchedulerStatus();
  }

  const impactDoc = safeReadJson(IMPACT_PATH, {});
  const lessonsDoc = safeReadJson(LESSONS_PATH, {});
  const evaluation = evaluateOutcomeForCohort(active, impactDoc, lessonsDoc);
  active.evaluation = {
    ...evaluation,
    evaluatedAt: new Date().toISOString()
  };
  active.status = deriveStatusFromProgress(active);
  saveCohorts(doc);
  return ensureSchedulerStatus();
}

module.exports = {
  COHORTS_PATH,
  STATUS_PATH,
  ensureSchedulerStatus,
  assertWriteAllowedOrExit,
  registerCohortFromWriteBatch,
  refreshCohortEvaluationFromImpact
};
