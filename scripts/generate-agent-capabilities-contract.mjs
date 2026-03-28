#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const base = process.env.AGENT_CONTRACT_BASE_URL || "http://localhost:3003";

async function main() {
  const listRes = await fetch(`${base}/api/agent/v1/capabilities`);
  if (!listRes.ok) throw new Error(`capabilities list failed: ${listRes.status}`);
  const listJson = await listRes.json();
  if (!listJson?.capabilities || !Array.isArray(listJson.capabilities)) {
    throw new Error("invalid capabilities list payload");
  }

  const names = listJson.capabilities.map((c) => c.name);
  const details = [];
  for (const name of names) {
    const detailRes = await fetch(`${base}/api/agent/v1/capabilities/${name}`);
    if (!detailRes.ok) throw new Error(`detail failed for ${name}: ${detailRes.status}`);
    const detailJson = await detailRes.json();
    details.push(detailJson.detail);
  }

  const artifact = {
    version: listJson.version || "v130.4",
    generatedAt: new Date().toISOString(),
    capabilities: names,
    summaries: listJson.capabilities,
    details,
    workflows: null,
    metaFieldDescriptions: details[0]?.fallbackMetaNotes || {
      route: "retrieval+low_cost_ai|high_cost_fallback",
      providerAttempted: "none|openai_low_cost_only|openai_low_and_high",
      providerFailed: "boolean",
      fallbackReason: "timeout|network|empty_output|parse_fail|provider_http_error|other|null"
    }
  };

  // V131: include workflow definitions (offline contract mirror).
  const workflowsPath = path.join(process.cwd(), "src", "lib", "agent", "workflows.contract.json");
  const workflowsJsonRaw = await fs.readFile(workflowsPath, "utf8");
  const workflowsJson = JSON.parse(workflowsJsonRaw);
  const enrichedDefinitions = {};
  for (const [workflowId, def] of Object.entries(workflowsJson.workflows || {})) {
    enrichedDefinitions[workflowId] = {
      ...def,
      quote_endpoint: "/api/agent/v1/workflow/quote",
      idempotency_supported: true
    };
  }
  artifact.workflows = {
    version: workflowsJson.version,
    definitions: enrichedDefinitions,
    meta: {
      execute_endpoint: "/api/agent/v1/workflow/execute",
      quote_endpoint: "/api/agent/v1/workflow/quote",
      execute_smart_endpoint: "/api/agent/v1/workflow/execute-smart",
      quote_smart_endpoint: "/api/agent/v1/workflow/quote-smart",
      idempotency_header: "Idempotency-Key",
      asset_search_endpoint: "/api/agent/v1/assets/search",
      asset_search_debug_endpoint: "/api/agent/v1/assets/search-debug",
      retrieval_ranking_version: workflowsJson.version || "v135.0",
      asset_seo_publish_queue_artifact: "generated/asset-seo-publish-queue.json",
      seo_publish_manifest_artifact: "generated/asset-seo-publish-manifest.json",
      seo_materialization_enabled: true,
      seo_publish_integration_mode: "artifact_handoff_compatible",
      seo_activation_enabled: true,
      seo_activation_manifest_artifact: "generated/asset-seo-activation-manifest.json",
      seo_autopilot_enabled: true,
      seo_autopilot_summary_artifact: "generated/asset-seo-autopilot-summary.json",
      seo_volume_policy_enabled: true,
      seo_volume_policy_artifact: "generated/asset-seo-volume-policy.json",
      ai_citation_optimized: true,
      citation_summary_artifact: "generated/asset-seo-citation-summary.json",
      ai_traffic_capture_enabled: true,
      ai_capture_summary_artifact: "generated/asset-seo-ai-capture-summary.json",
      ai_conversion_path_enabled: true,
      conversion_summary_artifact: "generated/asset-seo-conversion-summary.json",
      ai_real_conversion_enabled: true,
      conversion_metrics_artifact: "generated/asset-seo-conversion-metrics.json",
      conversion_feedback_loop_enabled: true,
      conversion_feedback_artifact: "generated/asset-seo-conversion-feedback.json",
      data_flywheel_enabled: true,
      topic_expansion_artifact: "generated/asset-seo-topic-expansion.json",
      data_flywheel_metrics_enabled: true,
      data_flywheel_metrics_artifact: "generated/asset-seo-data-flywheel-metrics.json",
      monetization_enabled: true,
      monetization_metrics_artifact: "generated/asset-seo-monetization-metrics.json",
      monetization_optimization_enabled: true,
      monetization_optimization_artifact: "generated/asset-seo-monetization-optimization.json",
      monetization_intelligence_enabled: true,
      monetization_intelligence_artifact: "generated/asset-seo-monetization-intelligence.json",
      seo_feedback_artifact: "generated/asset-seo-feedback-summary.json",
      strategy_options: ["reuse_only", "retrieve_rewrite", "full_generate"],
      smart_billing_modes: ["reuse_only", "retrieve_rewrite", "full_generate"]
    }
  };

  const outPath = path.join(process.cwd(), "generated", "agent-capabilities-contract.json");
  await fs.writeFile(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(`wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});