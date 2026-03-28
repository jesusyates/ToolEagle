import fs from "node:fs";
import path from "node:path";
import { aggregateMonetizationEvents, type MonetizationEventRow } from "@/lib/seo/asset-seo-monetization-aggregation";
import {
  selectTopicSpecificTriggerStrategy,
  selectWorkflowSpecificTriggerStrategy
} from "@/lib/seo/asset-seo-monetization-decision";

export const ASSET_SEO_MONETIZATION_INTELLIGENCE_ARTIFACT =
  "generated/asset-seo-monetization-intelligence.json";

export function buildMonetizationIntelligenceSummary(rows: MonetizationEventRow[]) {
  const agg = aggregateMonetizationEvents(rows);
  const topic_overrides: Record<string, { variant_id: string; best_trigger_timing: number }> = {};
  const workflow_overrides: Record<string, { variant_id: string; best_trigger_timing: number }> = {};
  const sparse_data_fallbacks: string[] = [];

  for (const t of agg.topics.slice(0, 10)) {
    const s = selectTopicSpecificTriggerStrategy({ intelligence: agg, topic: t.topic, min_samples: 10 });
    if (s.source === "topic") topic_overrides[t.topic] = { variant_id: s.variant_id, best_trigger_timing: s.best_trigger_timing };
    else sparse_data_fallbacks.push(`topic:${t.topic}->${s.source}`);
  }
  for (const w of agg.workflows.slice(0, 10)) {
    const s = selectWorkflowSpecificTriggerStrategy({ intelligence: agg, workflow_id: w.workflow_id, min_samples: 10 });
    if (s.source === "workflow") {
      workflow_overrides[w.workflow_id] = { variant_id: s.variant_id, best_trigger_timing: s.best_trigger_timing };
    } else {
      sparse_data_fallbacks.push(`workflow:${w.workflow_id}->${s.source}`);
    }
  }

  return {
    version: "v153.0",
    updatedAt: new Date().toISOString(),
    global_winner_variant: agg.global_winner_variant,
    global_best_timing: agg.global_best_timing,
    variant_performance: agg.variants,
    timing_performance: agg.timings,
    top_monetizing_topics: agg.topics.slice(0, 10),
    top_monetizing_workflows: agg.workflows.slice(0, 10),
    workflow_overrides,
    topic_overrides,
    sparse_data_fallbacks,
    notes: [
      "sources: upgrade_shown/upgrade_clicked/upgrade_converted/monetization_trigger_fired/conversion_completed",
      "winner uses conversion_rate then ctr tie-break",
      "timing uses conversion_rate then revenue tie-break",
      "fallback order: topic -> workflow -> global -> default(v1,t2)"
    ]
  };
}

export function writeMonetizationIntelligenceSummaryToDisk(
  payload: ReturnType<typeof buildMonetizationIntelligenceSummary>,
  repoRoot: string = process.cwd()
): string {
  const out = path.join(repoRoot, ASSET_SEO_MONETIZATION_INTELLIGENCE_ARTIFACT.split("/").join(path.sep));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return out;
}

