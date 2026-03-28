import type { aggregateMonetizationEvents } from "@/lib/seo/asset-seo-monetization-aggregation";

export type MonetizationIntelligence = ReturnType<typeof aggregateMonetizationEvents>;

export type StrategySelection = {
  variant_id: string;
  best_trigger_timing: 1 | 2 | 3;
  source: "topic" | "workflow" | "global" | "fallback";
};

const DEFAULTS: StrategySelection = {
  variant_id: "v1",
  best_trigger_timing: 2,
  source: "fallback"
};

function meetsSamples(shown: number, minSamples: number): boolean {
  return shown >= minSamples;
}

export function selectWinningVariant(context: {
  intelligence?: MonetizationIntelligence | null;
  topic?: string | null;
  workflow_id?: string | null;
  min_samples?: number;
}): StrategySelection {
  const i = context.intelligence;
  const minSamples = context.min_samples ?? 8;
  if (!i) return { ...DEFAULTS };
  const topic = String(context.topic || "");
  const workflow = String(context.workflow_id || "");

  const topicPerf = i.topics?.find((x) => x.topic === topic);
  if (topicPerf && meetsSamples(topicPerf.shown, minSamples)) {
    return { variant_id: i.global_winner_variant || "v1", best_trigger_timing: i.global_best_timing || 2, source: "topic" };
  }
  const workflowPerf = i.workflows?.find((x) => x.workflow_id === workflow);
  if (workflowPerf && meetsSamples(workflowPerf.shown, minSamples)) {
    return { variant_id: i.global_winner_variant || "v1", best_trigger_timing: i.global_best_timing || 2, source: "workflow" };
  }
  const globalShown = i.variants?.reduce((n, x) => n + Number(x.shown || 0), 0) ?? 0;
  if (meetsSamples(globalShown, minSamples)) {
    return { variant_id: i.global_winner_variant || "v1", best_trigger_timing: i.global_best_timing || 2, source: "global" };
  }
  return { ...DEFAULTS };
}

export function selectBestTriggerTiming(context: {
  intelligence?: MonetizationIntelligence | null;
  topic?: string | null;
  workflow_id?: string | null;
  min_samples?: number;
}): 1 | 2 | 3 {
  return selectWinningVariant(context).best_trigger_timing;
}

export function selectTopicSpecificTriggerStrategy(context: {
  intelligence?: MonetizationIntelligence | null;
  topic?: string | null;
  min_samples?: number;
}): StrategySelection {
  return selectWinningVariant({ intelligence: context.intelligence, topic: context.topic, min_samples: context.min_samples });
}

export function selectWorkflowSpecificTriggerStrategy(context: {
  intelligence?: MonetizationIntelligence | null;
  workflow_id?: string | null;
  min_samples?: number;
}): StrategySelection {
  return selectWinningVariant({
    intelligence: context.intelligence,
    workflow_id: context.workflow_id,
    min_samples: context.min_samples
  });
}

