/**
 * V166 — Bounded retrieval threshold easing for strong workflows (dataset-ready only).
 * Easier bar = multiply thresholds by biasMult (lower numeric threshold = easier pass).
 */

const fs = require("fs");
const path = require("path");

/** Minimum items in workflow bucket to treat platform as "strong". */
const STRONG_WORKFLOW_MIN_ITEMS = 2;
/** Slightly lower bar (multiply thresholds). Bounded vs MIN_BIAS_MULT. */
const BIAS_MULT = 0.92;
const MIN_BIAS_MULT = 0.85;

function loadJson(p, fb) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fb;
  }
}

/**
 * @param {string} platform
 * @param {string} wfPath
 */
function isStrongWorkflow(platform, wfPath) {
  const p = String(platform || "")
    .toLowerCase()
    .trim();
  if (!p) return false;
  const raw = loadJson(wfPath, null);
  const buckets = raw && typeof raw === "object" ? raw.buckets : null;
  const byWf = buckets && typeof buckets === "object" ? buckets.by_workflow : null;
  if (!byWf || typeof byWf !== "object") return false;
  const ids = byWf[p];
  return Array.isArray(ids) && ids.length >= STRONG_WORKFLOW_MIN_ITEMS;
}

/**
 * @param {number} t1
 * @param {number} t2a
 * @param {number} t2b
 * @param {{ datasetReady: boolean; strongWorkflow: boolean }} ctx
 */
function applyBoundedBiasToThresholds(t1, t2a, t2b, ctx) {
  const extra = parseFloat(process.env.RETRIEVAL_BIAS_EXTRA || "0");
  const extraCap = Number.isFinite(extra) && extra > 0 ? Math.min(0.05, extra) : 0;

  if (!ctx.datasetReady || !ctx.strongWorkflow) {
    if (extraCap > 0 && ctx.datasetReady) {
      const mult = Math.max(0.9, 1 - extraCap * 0.5);
      return {
        t1: t1 * mult,
        t2a: t2a * mult,
        t2b: t2b * mult,
        biasApplied: true,
        biasFactor: mult
      };
    }
    return { t1, t2a, t2b, biasApplied: false, biasFactor: 1 };
  }
  let mult = Math.max(MIN_BIAS_MULT, BIAS_MULT);
  if (extraCap > 0) {
    mult = Math.max(MIN_BIAS_MULT * 0.97, mult * (1 - extraCap));
  }
  return {
    t1: t1 * mult,
    t2a: t2a * mult,
    t2b: t2b * mult,
    biasApplied: true,
    biasFactor: mult
  };
}

module.exports = {
  isStrongWorkflow,
  applyBoundedBiasToThresholds,
  STRONG_WORKFLOW_MIN_ITEMS,
  BIAS_MULT,
  MIN_BIAS_MULT
};
