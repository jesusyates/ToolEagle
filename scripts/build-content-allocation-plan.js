#!/usr/bin/env node
/**
 * V111 — Build generated/content-allocation-plan.json from V110 growth-priority.json
 *
 * Usage: node scripts/build-content-allocation-plan.js
 */

const path = require("path");
const {
  GROWTH_PATH,
  buildAllocationPlanFromGrowth,
  writeAllocationPlan
} = require("./lib/content-allocation");

const fs = require("fs");

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const growth = safeReadJson(GROWTH_PATH);
  const plan = growth
    ? buildAllocationPlanFromGrowth(growth)
    : {
        updatedAt: new Date().toISOString(),
        source: "none",
        error: "missing generated/growth-priority.json — run: npm run search:growth",
        priorityPlatforms: {},
        priorityTopics: {},
        priorityIntents: {},
        reducedClusters: [],
        pausedClusters: [],
        rationale: [{ cluster: "_", action: "note", reason: "Neutral weights until growth-priority exists" }],
        weightsNote: "Run aggregate-growth-priority first, then re-run this script."
      };

  const outPath = writeAllocationPlan(plan);
  console.log(`[build-content-allocation-plan] wrote ${outPath}`);
  console.log(
    `[V111] platforms boosted: ${Object.keys(plan.priorityPlatforms || {}).length} | topics: ${Object.keys(plan.priorityTopics || {}).length} | reduced: ${(plan.reducedClusters || []).length} | paused: ${(plan.pausedClusters || []).length}`
  );
}

main();
