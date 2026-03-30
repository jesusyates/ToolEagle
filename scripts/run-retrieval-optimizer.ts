#!/usr/bin/env npx tsx
/**
 * V168 — Build generated/retrieval-optimization-plan.json; optional --apply to run dataset build when needed.
 */

import {
  buildRetrievalOptimizationPlan,
  writeRetrievalOptimizationPlan
} from "../src/lib/seo/retrieval-optimizer";

const cwd = process.cwd();
const apply = process.argv.includes("--apply");
const plan = buildRetrievalOptimizationPlan(cwd, new Date(), { apply });
writeRetrievalOptimizationPlan(cwd, plan);
console.log(
  `[retrieval-optimizer] recommendations=${plan.recommendations.join(";")} top_fallback=${plan.top_fallback_reason ?? "n/a"}`
);
if (plan.actions_taken.length) {
  console.log(`[retrieval-optimizer] actions_taken=${plan.actions_taken.join(";")}`);
}
