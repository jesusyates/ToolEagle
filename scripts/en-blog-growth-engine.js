/**
 * V103: Automated Growth Engine + Smart Scheduler + Early Risk Control
 * Governed by docs/system-blueprint.md.
 * Do not implement logic that conflicts with blueprint rules.
 *
 * Reads logs/seo-observation.jsonl and decides an EN daily publishing capacity.
 * Then executes real publish batches sequentially using scripts/generate-seo-blog.js.
 *
 * IMPORTANT protections:
 * - quality gate + retry logic remains inside generate-seo-blog.js
 * - after each batch we re-check rejectionRate/retryDistribution/failureByTopic via logs
 */

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const OBSERVATION_LOG = path.join(process.cwd(), "logs", "seo-observation.jsonl");
const DECISION_LOG = path.join(process.cwd(), "logs", "seo-growth-scheduler-decisions.jsonl");

function nowIso() {
  return new Date().toISOString();
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  return raw.split(/\n+/).filter(Boolean).map((l) => JSON.parse(l));
}

function rollingRealPublishBatches(observations) {
  return observations.filter((e) => e && e.mode === "real_publish");
}

function avg(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeDailyLimit({ lastRealBatches }) {
  const latest = lastRealBatches[lastRealBatches.length - 1];
  const latestRejectionRate = latest?.rejectionRate ?? 0;

  const last5 = lastRealBatches.slice(-5);
  const last10 = lastRealBatches.slice(-10);

  const last5AllZero = last5.length === 5 && last5.every((b) => (b.rejectionRate ?? 0) === 0);
  const last10AllZero = last10.length === 10 && last10.every((b) => (b.rejectionRate ?? 0) === 0);
  const avgRetriesLast10 = avg(last10.map((b) => b.avgRetriesPerSuccess ?? 0));

  // Default: keep current safe level when no conditions match.
  let dailyLimit = 20;
  let baseRule = "default_20";

  // Rejection overrides first (pause/fallback).
  if (latestRejectionRate > 0.20) {
    dailyLimit = 0;
    baseRule = "pause_generation_gt20pct";
  } else if (latestRejectionRate > 0.10) {
    dailyLimit = 15;
    baseRule = "fallback_15_gt10pct";
  } else if (latestRejectionRate > 0.05) {
    dailyLimit = 15;
    baseRule = "fallback_15_gt5pct";
  } else if (last10AllZero && avgRetriesLast10 < 0.4) {
    dailyLimit = 30;
    baseRule = "increase_30_last10_zero_and_avgRetries_lt0_4";
  } else if (last5AllZero) {
    dailyLimit = 30;
    baseRule = "increase_30_last5_zero";
  }

  // Hard cap (V122): never jump above 30/day in this version.
  dailyLimit = Math.min(30, dailyLimit);

  return {
    dailyLimit,
    baseRule,
    latestRejectionRate,
    avgRetriesLast10,
    last5AllZero,
    last10AllZero
  };
}

function applyEarlyRiskControl({ dailyLimit, lastRealBatches }) {
  // Rule uses avgRetriesPerSuccess trend; we use rolling average over last 5 real batches.
  const last5 = lastRealBatches.slice(-5);
  const rollingAvgRetries = avg(last5.map((b) => b.avgRetriesPerSuccess ?? 0));

  // If failures look expensive, reduce capacity even if rejectionRate is still 0.
  let adjusted = dailyLimit;
  let earlyWarning = null;

  if (rollingAvgRetries > 1.2) {
    adjusted = 10;
    earlyWarning = { type: "fallback_10_avgRetries_gt1_2", rollingAvgRetries };
  } else if (rollingAvgRetries > 0.8) {
    adjusted = Math.max(10, Math.floor((dailyLimit * 0.7) / 5) * 5); // keep multiples of 5
    earlyWarning = { type: "reduce_30pct_avgRetries_gt0_8", rollingAvgRetries };
  }

  // Hard cap safety (V122).
  adjusted = Math.min(30, adjusted);
  return { adjustedDailyLimit: adjusted, earlyWarning, rollingAvgRetries };
}

function decideBatchPlan(dailyLimit) {
  if (dailyLimit <= 0) return { batchSize: 0, batches: 0, plan: [] };

  const batchSize = 5; // standardize risk per batch
  const batches = Math.floor(dailyLimit / batchSize);

  // For N=20: prefer 4x5 (already satisfied by 5-size).
  // For N=25/30/15/10: this yields 5/6/3/2 batches respectively.
  const plan = Array.from({ length: batches }, () => batchSize);
  return { batchSize, batches, plan };
}

function extractTopicsFromFailureByTopic(failureByTopic) {
  if (!failureByTopic || typeof failureByTopic !== "object") return [];
  return Object.keys(failureByTopic).filter((k) => failureByTopic[k] > 0);
}

function getLatestRealPublishObservation(observations) {
  const real = rollingRealPublishBatches(observations);
  return real[real.length - 1];
}

function runBatch({ batchSize, attemptLimit }) {
  // batchSize = created target for this batch
  // attemptLimit caps total slugs attempted (to keep runtime bounded).
  try {
    execSync("node scripts/build-content-allocation-plan.js", { stdio: "inherit" });
  } catch (e) {
    console.warn("[en-blog-growth-engine] V111 content:allocation skipped:", e?.message || e);
  }
  const cmd = `node scripts/generate-seo-blog.js --limit ${batchSize} --attempt-limit ${attemptLimit}`;
  console.log(`\n[en-blog-growth-engine] Executing batch: limit=${batchSize} attempt-limit=${attemptLimit}`);
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const maxBatchesIdx = argv.indexOf("--max-batches");
  const maxBatches = maxBatchesIdx >= 0 ? parseInt(argv[maxBatchesIdx + 1], 10) : null;

  const observations = readJsonl(OBSERVATION_LOG);
  const lastReal = rollingRealPublishBatches(observations);
  if (lastReal.length < 1) {
    console.log("[en-blog-growth-engine] No real_publish observations found; fallback dailyLimit=10.");
    fs.mkdirSync(path.dirname(DECISION_LOG), { recursive: true });
    const fallback = {
      timestamp: nowIso(),
      mode: "no_observations",
      dailyLimit: 10,
      plan: [],
      note: "fallback dailyLimit=10 due to missing history"
    };
    fs.appendFileSync(DECISION_LOG, JSON.stringify(fallback) + "\n", "utf8");
    return;
  }

  const base = computeDailyLimit({ lastRealBatches: lastReal });
  const early = applyEarlyRiskControl({ dailyLimit: base.dailyLimit, lastRealBatches: lastReal });
  let finalDailyLimit = early.adjustedDailyLimit;

  // If pause requested by rejectionRate, keep it paused regardless of early risk.
  if (base.dailyLimit === 0) finalDailyLimit = 0;

  const plan = decideBatchPlan(finalDailyLimit);

  // Log scheduler decision.
  fs.mkdirSync(path.dirname(DECISION_LOG), { recursive: true });
  const decision = {
    timestamp: nowIso(),
    source: { observationLog: OBSERVATION_LOG, realBatchesCount: lastReal.length },
    computed: {
      baseDailyLimit: base.dailyLimit,
      baseRule: base.baseRule,
      latestRejectionRate: base.latestRejectionRate,
      last5AllZero: base.last5AllZero,
      last10AllZero: base.last10AllZero,
      avgRetriesLast10: base.avgRetriesLast10,
      rollingAvgRetriesLast5: early.rollingAvgRetries
    },
    earlyWarning: early.earlyWarning,
    finalDailyLimit,
    batchPlan: plan.plan.map((s) => ({ batchSize: s })),
    dryRun
  };
  fs.appendFileSync(DECISION_LOG, JSON.stringify(decision) + "\n", "utf8");

  console.log("\n[en-blog-growth-engine] Scheduler decision:");
  console.log(JSON.stringify(decision, null, 2));

  if (dryRun || finalDailyLimit <= 0 || plan.batches <= 0) {
    console.log("[en-blog-growth-engine] No execution (dry-run or paused).");
    return;
  }

  // Execute sequentially with stability protection after each batch.
  const knownFailureTopics = new Set();
  const batchesToRun = maxBatches ? Math.min(plan.batches, maxBatches) : plan.batches;
  for (let i = 0; i < batchesToRun; i++) {
    const batchSize = plan.plan[i];
    const attemptLimit = batchSize * 2;

    runBatch({ batchSize, attemptLimit });

    const observationsAfter = readJsonl(OBSERVATION_LOG);
    const latestObs = getLatestRealPublishObservation(observationsAfter);

    const rejectionRate = latestObs?.rejectionRate ?? 0;
    const failureByTopic = latestObs?.failureByTopic ?? {};
    const avgRetries = latestObs?.avgRetriesPerSuccess ?? 0;

    const topics = extractTopicsFromFailureByTopic(failureByTopic);
    topics.forEach((t) => knownFailureTopics.add(t));

    const newFailureTopics = topics.filter((t) => !knownFailureTopics.has(t));

    console.log(
      `[en-blog-growth-engine] After batch ${i + 1}/${batchesToRun}: rejectionRate=${(rejectionRate * 100).toFixed(
        1
      )}% avgRetriesPerSuccess=${avgRetries} failureTopics=${topics.length}`
    );

    // Mandatory stability protection.
    if (rejectionRate > 0.20) {
      console.log("[en-blog-growth-engine] Hard pause: rejectionRate > 20%. Stopping further batches.");
      break;
    }
    if (rejectionRate > 0.10) {
      console.log("[en-blog-growth-engine] Fallback to 10/day condition met. Stopping further batches.");
      break;
    }
    if (newFailureTopics.length > 0) {
      console.log("[en-blog-growth-engine] New failure pattern detected:", newFailureTopics.join(", "));
      break;
    }
  }
}

main();

