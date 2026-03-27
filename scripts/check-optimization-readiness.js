#!/usr/bin/env node
/**
 * V118.1 — Readiness gate for first real optimization batch.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
require("dotenv").config();

const SEARCH_PERF_PATH = path.join(process.cwd(), "generated", "search-performance.json");
const CANDIDATES_PATH = path.join(process.cwd(), "generated", "page-optimization-candidates.json");
const RECS_PATH = path.join(process.cwd(), "generated", "page-optimization-recommendations.json");
const SCHEDULER_STATUS_PATH = path.join(process.cwd(), "generated", "optimization-scheduler-status.json");
const COHORTS_PATH = path.join(process.cwd(), "generated", "optimization-cohorts.json");
const OUT_PATH = path.join(process.cwd(), "generated", "optimization-readiness.json");

function safeReadJson(p, fallback = null) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function safeWriteJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function main() {
  const blockers = [];

  const hasClientEmail = !!process.env.GSC_CLIENT_EMAIL;
  const hasPrivateKey = !!process.env.GSC_PRIVATE_KEY;
  const hasSiteUrl = !!process.env.GSC_SITE_URL;
  if (!hasClientEmail || !hasPrivateKey || !hasSiteUrl) {
    blockers.push("missing_real_gsc_credentials");
  }

  const perf = safeReadJson(SEARCH_PERF_PATH, {});
  const perfIsStub = !!perf?.error || !Array.isArray(perf?.pages) || perf.pages.length === 0;
  if (perfIsStub) blockers.push("search_performance_is_stub_or_empty");

  const candidatesDoc = safeReadJson(CANDIDATES_PATH, {});
  const candidates = Array.isArray(candidatesDoc?.candidates) ? candidatesDoc.candidates : [];
  const candidateCount = candidates.length;
  if (!candidateCount) blockers.push("candidate_list_empty");

  const recDoc = safeReadJson(RECS_PATH, {});
  const recommendations = Array.isArray(recDoc?.items) ? recDoc.items : [];
  const recommendationCount = recommendations.length;
  if (!recommendationCount) blockers.push("recommendation_list_empty");

  const highPotentialCount = candidates.filter((c) => c?.bucket === "high_potential").length;
  if (!highPotentialCount) blockers.push("no_high_potential_candidates");

  const scheduler = safeReadJson(SCHEDULER_STATUS_PATH, {});
  const schedulerState = scheduler?.nextAction || "UNKNOWN";
  const schedulerReason = String(scheduler?.reason || "");

  // For bootstrap: PAUSE caused by the "need real data continuity lock" is allowed
  // to transition once real inputs exist. But PAUSE caused by an active cohort
  // awaiting after14 measurement is still dangerous.
  const isDangerousPause = (() => {
    if (schedulerState !== "PAUSE") return false;
    const s = schedulerReason.toLowerCase();
    return (
      s.includes("awaiting after14") ||
      s.includes("after14") ||
      s.includes("active optimization cohort") ||
      s.includes("awaiting") ||
      s.includes("after14 measurement")
    );
  })();

  if (isDangerousPause) blockers.push("scheduler_paused_for_dangerous_continuity");

  const cohortsDoc = safeReadJson(COHORTS_PATH, { cohorts: [] });
  const cohorts = Array.isArray(cohortsDoc?.cohorts) ? cohortsDoc.cohorts : [];
  const hasVerifiedHistoricalRealCohort = cohorts.some((c) => {
    const hasEvalResult = !!c?.evaluation?.result;
    const isCompleted = c?.status === "completed";
    return hasEvalResult || isCompleted;
  });

  const realInputCandidateCountOk = !perfIsStub && candidateCount > 0 && recommendationCount > 0 && highPotentialCount > 0;
  const inputsMode = realInputCandidateCountOk ? "real" : "stub";

  const readyWithoutBootstrapContinuityCheck =
    blockers.length === 0 || blockers.every((b) => b === "scheduler_paused_for_dangerous_continuity");

  const ready = hasClientEmail && hasPrivateKey && hasSiteUrl && realInputCandidateCountOk && !isDangerousPause;

  const canBootstrapFirstBatch = ready && !hasVerifiedHistoricalRealCohort;

  const out = {
    updatedAt: new Date().toISOString(),
    ready,
    blockers,
    candidateCount,
    recommendationCount,
    highPotentialCount,
    schedulerState,
    inputMode: inputsMode,
    canBootstrapFirstBatch,
    summary: ready
      ? "First real optimization batch is allowed by readiness gate."
      : "First real optimization batch is blocked until all readiness conditions pass."
  };

  safeWriteJson(OUT_PATH, out);
  console.log(`[V118.1] readiness ready=${ready} blockers=${blockers.length} -> ${OUT_PATH}`);
}

main();
