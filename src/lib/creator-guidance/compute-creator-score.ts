/**
 * V189 — Creator Score + stage from real browser memory (V187), no fake gamification.
 */

import type { CreatorMemoryV187 } from "@/lib/creator-guidance/creator-memory-store";
import manifest from "../../../generated/v189-creator-score-manifest.json";
import stageDoc from "../../../generated/v189-stage-rules.json";

const WORKFLOW_TOOLS = [
  "hook-generator",
  "tiktok-caption-generator",
  "hashtag-generator",
  "title-generator"
] as const;

export type CreatorScoreBand = "beginner" | "rising" | "active" | "advanced";

export type CreatorStageV189 = {
  id: number;
  key: string;
  title: string;
  summary: string;
};

export type CreatorScoreResult = {
  score: number;
  band: CreatorScoreBand;
  bandLabel: string;
  stage: CreatorStageV189;
  workflowCompletionPercent: number;
  /** 0–4 tools + publish = 5 checkpoints */
  workflowCheckpoints: {
    hook: boolean;
    caption: boolean;
    hashtag: boolean;
    title: boolean;
    publishRedirect: boolean;
  };
  metrics: {
    generationCount: number;
    copyCount: number;
    toolDiversity: number;
    workflowStepsCompleted: number;
    distinctIntentCount: number;
    publishRedirectCount: number;
    distinctUsageDays: number;
  };
  whyOneLine: string;
  nextBestActionLabel: string;
};

type Manifest = typeof manifest;
type Weights = Manifest["weights"] & {
  v191_account_analysis?: { bonus_points: number; max_points: number };
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function countPublishRedirects(m: CreatorMemoryV187): number {
  return m.publish_events.filter((e) => e.type === "upload_redirect").length;
}

function distinctCalendarDays(timestamps: number[]): number {
  const days = new Set(timestamps.map((ts) => new Date(ts).toDateString()));
  return days.size;
}

function workflowCheckpoints(memory: CreatorMemoryV187): CreatorScoreResult["workflowCheckpoints"] {
  const genSlugs = new Set(memory.generation_history.map((g) => g.tool_slug));
  return {
    hook: genSlugs.has("hook-generator"),
    caption: genSlugs.has("tiktok-caption-generator"),
    hashtag: genSlugs.has("hashtag-generator"),
    title: genSlugs.has("title-generator"),
    publishRedirect: countPublishRedirects(memory) > 0
  };
}

function workflowCompletionPercent(cp: CreatorScoreResult["workflowCheckpoints"]): number {
  const done =
    (cp.hook ? 1 : 0) +
    (cp.caption ? 1 : 0) +
    (cp.hashtag ? 1 : 0) +
    (cp.title ? 1 : 0) +
    (cp.publishRedirect ? 1 : 0);
  return Math.round((done / 5) * 100);
}

function subscoreWeighted(
  count: number,
  per: number,
  capCount: number,
  maxPoints: number
): number {
  const c = clamp(count, 0, capCount);
  return clamp(c * per, 0, maxPoints);
}

function computeRawScore(memory: CreatorMemoryV187, w: Weights): number {
  const genCount = memory.generation_history.length;
  const copyCount = memory.copy_events.length;
  const toolsFromGen = new Set(memory.generation_history.map((g) => g.tool_slug));
  const diversity = toolsFromGen.size;

  let wfSteps = 0;
  for (const slug of WORKFLOW_TOOLS) {
    if (toolsFromGen.has(slug)) wfSteps += 1;
  }
  const wfPoints = subscoreWeighted(wfSteps, w.workflow_chain_steps.points_per_step, 4, w.workflow_chain_steps.max_points);

  const pub = countPublishRedirects(memory);
  const pubPoints = subscoreWeighted(pub, w.publish_redirect.points_per, w.publish_redirect.cap, w.publish_redirect.max_points);

  const intents = memory.v186_intent_ids_seen ?? [];
  const uniqIntent = new Set(intents);
  if (memory.last_v186_intent_id) uniqIntent.add(memory.last_v186_intent_id);
  const intentCount = uniqIntent.size;
  let intentPoints = subscoreWeighted(
    intentCount,
    w.v186_intent.points_per_unique_intent,
    w.v186_intent.cap_intents,
    w.v186_intent.max_points
  );
  if (memory.last_v186_intent_id) {
    intentPoints += w.v186_intent.bonus_if_any_intent_set;
  }
  intentPoints = clamp(intentPoints, 0, w.v186_intent.max_points);

  const ts = [...memory.generation_history.map((g) => g.ts), ...memory.copy_events.map((c) => c.ts)];
  const days = distinctCalendarDays(ts.length ? ts : [Date.now()]);
  const dayPoints = subscoreWeighted(
    days,
    w.repeat_usage_days.points_per_distinct_day,
    w.repeat_usage_days.cap_days,
    w.repeat_usage_days.max_points
  );

  const gPts = subscoreWeighted(
    genCount,
    w.generation_events.points_per,
    w.generation_events.cap_events,
    w.generation_events.max_points
  );
  const cPts = subscoreWeighted(
    copyCount,
    w.copy_events.points_per,
    w.copy_events.cap_events,
    w.copy_events.max_points
  );
  const divPts = subscoreWeighted(
    diversity,
    w.tool_diversity.points_per_distinct_tool,
    w.tool_diversity.cap_tools,
    w.tool_diversity.max_points
  );

  const base = gPts + cPts + divPts + wfPoints + pubPoints + intentPoints + dayPoints;
  const v191w = w.v191_account_analysis;
  const v191Pts =
    v191w && typeof memory.v191_analysis_completed_at === "number" && memory.v191_analysis_completed_at > 0
      ? Math.min(v191w.max_points, v191w.bonus_points)
      : 0;
  return clamp(base + v191Pts, 0, 100);
}

function bandFromScore(score: number, m: Manifest): { band: CreatorScoreBand; label: string } {
  for (const b of m.bands) {
    if (score >= b.min && score <= b.max) {
      return { band: b.id as CreatorScoreBand, label: b.label };
    }
  }
  return { band: "beginner", label: "Beginner" };
}

function isSalesIntent(memory: CreatorMemoryV187): boolean {
  const raw = (memory.last_v186_intent_id ?? "").toLowerCase();
  return raw.includes("shop") || raw.includes("promote") || raw.includes("sell") || raw === "intent_promote";
}

function resolveStage(
  score: number,
  memory: CreatorMemoryV187,
  metrics: CreatorScoreResult["metrics"],
  cp: CreatorScoreResult["workflowCheckpoints"],
  wfPct: number
): CreatorStageV189 {
  const pub = metrics.publishRedirectCount;
  const sales = isSalesIntent(memory);
  const stages = stageDoc.stages as CreatorStageV189[];

  if (score >= 72 && wfPct >= 55 && (sales || pub >= 1)) {
    return stages.find((s) => s.id === 5) ?? stages[0]!;
  }
  if (score >= 52 && metrics.toolDiversity >= 3 && wfPct >= 45) {
    return stages.find((s) => s.id === 4) ?? stages[0]!;
  }
  if (pub >= 1 || metrics.distinctUsageDays >= 3 || metrics.generationCount >= 10) {
    return stages.find((s) => s.id === 3) ?? stages[0]!;
  }
  if (score >= 8 && (metrics.generationCount >= 3 || wfPct >= 25)) {
    return stages.find((s) => s.id === 2) ?? stages[0]!;
  }
  return stages.find((s) => s.id === 1) ?? stages[0]!;
}

function buildWhyLine(
  memory: CreatorMemoryV187,
  metrics: CreatorScoreResult["metrics"],
  cp: CreatorScoreResult["workflowCheckpoints"],
  m: Manifest
): string {
  const t = m.why_templates;
  const wfDone =
    (cp.hook ? 1 : 0) + (cp.caption ? 1 : 0) + (cp.hashtag ? 1 : 0) + (cp.title ? 1 : 0);
  const parts = [
    t.generation.replace("{gens}", String(metrics.generationCount)),
    t.copy.replace("{copies}", String(metrics.copyCount)),
    t.workflow.replace("{completed}", String(wfDone)),
    t.publish.replace("{pub}", String(metrics.publishRedirectCount)),
    t.intent.replace("{intents}", String(metrics.distinctIntentCount)),
    t.days.replace("{days}", String(metrics.distinctUsageDays))
  ];
  return parts.slice(0, 3).join(" ");
}

function nextActionLabel(
  toolSlug: string,
  result: Pick<CreatorScoreResult, "metrics" | "workflowCheckpoints" | "stage">,
  m: Manifest
): string {
  const n = m.next_best_action;
  const cp = result.workflowCheckpoints;
  const lowChain = wfCompletionFromCp(cp) < 45;
  if (result.metrics.generationCount === 0) return n.first_run;
  if (lowChain) return n.low_workflow;
  if (result.metrics.publishRedirectCount >= 1 && result.metrics.generationCount >= 8) return n.after_publish;

  if (toolSlug === "hook-generator") return n.default_hook;
  if (toolSlug === "tiktok-caption-generator") return n.default_caption;
  if (toolSlug === "hashtag-generator") return n.default_hashtag;
  if (toolSlug === "title-generator") return n.default_title;
  return n.default_caption;
}

function wfCompletionFromCp(cp: CreatorScoreResult["workflowCheckpoints"]): number {
  const done =
    (cp.hook ? 1 : 0) +
    (cp.caption ? 1 : 0) +
    (cp.hashtag ? 1 : 0) +
    (cp.title ? 1 : 0) +
    (cp.publishRedirect ? 1 : 0);
  return Math.round((done / 5) * 100);
}

export function computeCreatorScore(memory: CreatorMemoryV187, toolSlug: string): CreatorScoreResult {
  const w = manifest.weights as Weights;
  const score = Math.round(computeRawScore(memory, w));
  const { band, label: bandLabel } = bandFromScore(score, manifest);

  const cp = workflowCheckpoints(memory);
  const wfPct = workflowCompletionPercent(cp);

  const genSlugs = new Set(memory.generation_history.map((g) => g.tool_slug));
  let wfSteps = 0;
  for (const slug of WORKFLOW_TOOLS) {
    if (genSlugs.has(slug)) wfSteps += 1;
  }

  const intents = new Set(memory.v186_intent_ids_seen ?? []);
  if (memory.last_v186_intent_id) intents.add(memory.last_v186_intent_id);

  const ts = [...memory.generation_history.map((g) => g.ts), ...memory.copy_events.map((c) => c.ts)];
  const distinctUsageDays = distinctCalendarDays(ts.length ? ts : [Date.now()]);

  const metrics = {
    generationCount: memory.generation_history.length,
    copyCount: memory.copy_events.length,
    toolDiversity: genSlugs.size,
    workflowStepsCompleted: wfSteps,
    distinctIntentCount: intents.size,
    publishRedirectCount: countPublishRedirects(memory),
    distinctUsageDays
  };

  const stage = resolveStage(score, memory, metrics, cp, wfPct);
  const whyOneLine = buildWhyLine(memory, metrics, cp, manifest);
  const nextBestActionLabel = nextActionLabel(toolSlug, { metrics, workflowCheckpoints: cp, stage }, manifest);

  return {
    score,
    band,
    bandLabel,
    stage,
    workflowCompletionPercent: wfPct,
    workflowCheckpoints: cp,
    metrics,
    whyOneLine,
    nextBestActionLabel
  };
}
