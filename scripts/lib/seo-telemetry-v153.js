/**
 * V153 CLI telemetry (scripts cannot import src/). Keep field names aligned with src/lib/seo/asset-seo-telemetry.ts.
 */

function line(tag, payload) {
  try {
    console.info(tag, JSON.stringify({ ts: new Date().toISOString(), ...payload }));
  } catch {
    // no-op
  }
}

function logV153SeoGeneration(input) {
  line("[v153_seo_gen]", {
    retrieval_used: input.retrieval_used,
    generation_mode: input.generation_mode,
    model_cost_tier: input.model_cost_tier,
    slug: input.slug,
    keyword: input.keyword
  });
}

function logRetrievalPathUsed(input) {
  line("[v153_retrieval_path]", { event: "retrieval_path_used", ...input });
}

function logAiFallbackUsed(input) {
  line("[v153_ai_fallback]", { event: "ai_fallback_used", ...input });
}

function logCostOptimizationApplied(input) {
  line("[v153_cost_optimization]", { event: "cost_optimization_applied", ...input });
}

module.exports = {
  logV153SeoGeneration,
  logRetrievalPathUsed,
  logAiFallbackUsed,
  logCostOptimizationApplied
};
