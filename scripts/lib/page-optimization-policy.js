const fs = require("fs");
const path = require("path");

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function defaultPolicyV114() {
  return {
    policyVersion: "V114",
    mode: "SAFE OPTIMIZATION ROLLOUT",
    evidenceAware: true,
    prioritization: { high_potential: 1, rising_pages: 0.4, winnersOnlySelectiveRefinement: true },
    defaultWritableFields: ["description"],
    titleChangesEnabled: false,
    allowedBuckets: ["high_potential", "rising_pages"],
    allowedFieldsByBucket: {
      high_potential: { description: "continue", intro_prefix: "limited" },
      rising_pages: { description: "hold_if_insufficient_data", intro_prefix: "paused" }
    },
    batchLimits: {
      defaultWriteBatch: 5,
      hardCap: 10,
      maxSecondaryBucketPages: 2,
      maxIntroPrefixPerBatch: 2
    },
    scalingGuardrails: {
      minAfter14SampleForExpand: 20,
      insufficientDataRateThresholdForExpand: 0.45,
      worseRateThresholdForExpand: 0.35,
      repeatablePositiveImprovedRateThreshold: 0.4,
      recommendedExpandToBatch: 8
    },
    pauseGuardrails: {
      insufficientDataRateHoldThreshold: 0.6,
      worseRatePauseFieldThreshold: 0.35,
      minSamplesForWorseRate: 8
    },
    introPrefixRiskGuardrail: {
      minImprovedRateForIntroPrefix: 0.25,
      minTotalSamplesForIntroPrefix: 8
    }
  };
}

function sumOutcomeCounts(byOutcome) {
  if (!byOutcome || typeof byOutcome !== "object") return 0;
  return Object.values(byOutcome).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function safeRate(numer, denom) {
  const d = Number(denom) || 0;
  if (!d) return null;
  return (Number(numer) || 0) / d;
}

function computeLessonsTotals(lessons) {
  const byOutcome = lessons?.aggregates?.byOutcome || {};
  const totalMeasured = sumOutcomeCounts(byOutcome);
  const insufficientCount = byOutcome.insufficient_data || 0;
  const insufficientRate = totalMeasured ? insufficientCount / totalMeasured : null;
  return { totalMeasured, insufficientCount, insufficientRate };
}

function computeFieldOutcomes(lessons) {
  // lessons v113 currently only guarantees byField.improved/total.
  const byField = lessons?.aggregates?.byField || {};
  const byFieldOutcome = lessons?.aggregates?.byFieldOutcome || {};

  const fields = new Set([...Object.keys(byField), ...Object.keys(byFieldOutcome || {})]);
  const out = {};
  for (const f of fields) {
    const improved = byField[f]?.improved ?? byFieldOutcome[f]?.improved ?? 0;
    const total = byField[f]?.total ?? byFieldOutcome[f]?.total ?? 0;
    const improvedRate = safeRate(improved, total);

    // worseRate only when available
    const worseCount = byFieldOutcome[f]?.worse ?? null;
    const worseRate = worseCount == null ? null : safeRate(worseCount, total);

    out[f] = { improved, total, improvedRate, worseCount, worseRate };
  }
  return out;
}

function computeBucketDecisions(policy, lessons, args) {
  const { totalMeasured, insufficientRate } = computeLessonsTotals(lessons);
  const fieldStats = computeFieldOutcomes(lessons);

  const introStats = fieldStats["intro_prefix"] || { improvedRate: null, worseRate: null, total: 0 };
  const descStats = fieldStats["description"] || { improvedRate: null, worseRate: null, total: 0 };

  const insufficientDominates = lessons?.error || !totalMeasured ? true : insufficientRate >= policy.pauseGuardrails.insufficientDataRateHoldThreshold;

  // If we don't have evidence, keep it conservative (hold/paused).
  const haveEvidence = lessons && !lessons.error && totalMeasured >= 1;

  const worstRateDescription = descStats.worseRate;
  const pauseOnWorseDescription =
    worstRateDescription != null &&
    totalMeasured >= policy.pauseGuardrails.minSamplesForWorseRate &&
    worstRateDescription >= policy.pauseGuardrails.worseRatePauseFieldThreshold;

  // Scaling recommendation: only when after14 sample is mature and signals look repeatable.
  const canExpand =
    haveEvidence &&
    totalMeasured >= policy.scalingGuardrails.minAfter14SampleForExpand &&
    (insufficientRate == null || insufficientRate < policy.scalingGuardrails.insufficientDataRateThresholdForExpand) &&
    (descStats.worseRate == null || descStats.worseRate < policy.scalingGuardrails.worseRateThresholdForExpand) &&
    (descStats.improvedRate != null && descStats.improvedRate >= policy.scalingGuardrails.repeatablePositiveImprovedRateThreshold);

  const recommendedBatch =
    canExpand ? Math.min(policy.scalingGuardrails.recommendedExpandToBatch, policy.batchLimits.hardCap) : policy.batchLimits.defaultWriteBatch;

  const buckets = {};
  for (const bucket of policy.allowedBuckets || []) {
    // Base bucket decision logic (field-level below).
    const bucketDecision = haveEvidence ? "continue" : "hold";
    buckets[bucket] = {
      bucketDecision,
      fields: {
        description: { decision: "hold", reason: "default_hold" },
        intro_prefix: { decision: "paused", reason: "default_paused" }
      }
    };
  }

  // Field-level: description
  // - high_potential: continue (description) unless worse triggers a pause.
  // - rising_pages: hold if insufficient_data; otherwise allow but keep secondary cap.
  if (policy.allowedFieldsByBucket?.high_potential?.description) {
    // Even when we only have thin/insufficient evidence, V114 keeps description-only
    // safe refinement enabled for high_potential to preserve momentum without risky rewrites.
    const decision = pauseOnWorseDescription ? "hold" : "continue";
    const reason = pauseOnWorseDescription
      ? `pause_on_worseRate(description) >= ${policy.pauseGuardrails.worseRatePauseFieldThreshold}`
      : insufficientDominates
        ? "insufficient_data_stub: continue description-only for high_potential (no scaling)"
        : "evidence_ok_for_description(high_potential)";
    buckets["high_potential"].fields.description = { decision, reason };
  }

  if (policy.allowedFieldsByBucket?.rising_pages?.description) {
    let decision = "hold";
    let reason = "default_hold";

    if (!lessons?.error && totalMeasured) {
      const insufficientForExpand = insufficientRate != null && insufficientRate >= policy.scalingGuardrails.insufficientDataRateThresholdForExpand;
      if (!insufficientForExpand) {
        // allow cautiously; worse pauses
        decision = pauseOnWorseDescription ? "hold" : "limited_continue";
        reason = pauseOnWorseDescription
          ? `pause_on_worseRate(description) >= ${policy.pauseGuardrails.worseRatePauseFieldThreshold}`
          : "limited_continue(rising_pages) after insufficient_data_rate < threshold";
      } else {
        decision = "hold";
        reason = `hold(rising_pages) due to insufficient_data_rate >= ${policy.scalingGuardrails.insufficientDataRateThresholdForExpand}`;
      }
    }
    buckets["rising_pages"].fields.description = { decision, reason };
  }

  // Field-level: intro_prefix
  // Always off by default; only allow in limited cases via evidence and args.includeIntro.
  const introDecision = (() => {
    if (!haveEvidence) return { decision: "hold", reason: "no_evidence_stub" };
    const improvedOk = introStats.improvedRate != null && introStats.improvedRate >= policy.introPrefixRiskGuardrail.minImprovedRateForIntroPrefix;
    const samplesOk = introStats.total >= policy.introPrefixRiskGuardrail.minTotalSamplesForIntroPrefix;
    const worseOk = introStats.worseRate == null || introStats.worseRate < policy.pauseGuardrails.worseRatePauseFieldThreshold;
    if (improvedOk && samplesOk && worseOk) return { decision: "limited_continue", reason: "intro_prefix_repeatable_positive" };
    return { decision: "hold", reason: `intro_prefix_risk_guardrail(improvedRate/total/worseRate)` };
  })();

  // Apply intro decisions per bucket
  if (buckets["high_potential"]) {
    buckets["high_potential"].fields.intro_prefix = introDecision;
  }
  if (buckets["rising_pages"]) {
    buckets["rising_pages"].fields.intro_prefix = { decision: "paused", reason: "policy_initial: intro_prefix paused for rising_pages" };
  }

  return {
    overall: {
      decision: haveEvidence ? "continue_or_hold" : "hold",
      reason: haveEvidence ? "computed_from_lessons" : "insufficient_data_stub_or_error",
      recommendedBatchPages: recommendedBatch,
      recommendedBatchMode: canExpand ? "expand_cautiously" : "default_5"
    },
    buckets,
    computed: {
      totalMeasured,
      insufficientRate,
      descStats,
      introStats
    }
  };
}

function buildRolloutStatusFile(policyPath, lessonsPath, args) {
  const policy = safeReadJson(policyPath) || defaultPolicyV114();
  const lessons = safeReadJson(lessonsPath);
  const rollout = computeBucketDecisions(policy, lessons || {}, args || {});
  return {
    updatedAt: new Date().toISOString(),
    policyVersion: policy.policyVersion || "V114",
    mode: policy.mode || "SAFE OPTIMIZATION ROLLOUT",
    lessons: {
      error: lessons?.error || null,
      sampleSize: lessons?.sampleSize ?? null,
      updatedAt: lessons?.updatedAt ?? null
    },
    rollout
  };
}

module.exports = {
  safeReadJson,
  defaultPolicyV114,
  buildRolloutStatusFile,
  computeBucketDecisions
};

