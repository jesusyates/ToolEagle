/**
 * V163 — Intent escalation durable artifact + autopilot merge.
 */

import fs from "fs";
import path from "path";
import { resolveSeoGeneratedDir } from "./seo-sandbox";
import type { IntentEscalationPlan, IntentState } from "./asset-seo-intent-escalation";
import { INTENT_ESCALATION_VERSION } from "./asset-seo-intent-escalation";

export type IntentEscalationRowMeta = {
  topic_key: string;
  plan: IntentEscalationPlan;
};

export type AssetSeoIntentEscalationArtifact = {
  version: string;
  updatedAt: string;
  intent_state_distribution: Record<string, number>;
  escalation_paths: Array<{ from: IntentState; to: IntentState; count: number }>;
  top_escalated_topics: string[];
  monetization_ready_segments: number;
  notes: string[];
};

export function buildIntentEscalationArtifactFromRows(rows: IntentEscalationRowMeta[]): AssetSeoIntentEscalationArtifact {
  const intent_state_distribution: Record<string, number> = {};
  const pathMap = new Map<string, number>();
  const escalatedTopics: { topic: string; strength: number }[] = [];
  let monetization_ready_segments = 0;

  for (const r of rows) {
    const cur = r.plan.current_intent_state;
    const nx = r.plan.next_intent_state;
    intent_state_distribution[cur] = (intent_state_distribution[cur] || 0) + 1;
    if (cur === "generation_ready" || cur === "repeat_user_monetization") {
      monetization_ready_segments += 1;
    }
    const pk = `${cur}|||${nx}`;
    pathMap.set(pk, (pathMap.get(pk) || 0) + 1);
    if (cur !== nx && r.plan.escalation_strength >= 0.3) {
      escalatedTopics.push({ topic: r.topic_key, strength: r.plan.escalation_strength });
    }
  }

  const escalation_paths = [...pathMap.entries()]
    .map(([k, count]) => {
      const [from, to] = k.split("|||") as [IntentState, IntentState];
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count);

  const top_escalated_topics = escalatedTopics
    .sort((a, b) => b.strength - a.strength)
    .map((x) => x.topic)
    .slice(0, 20);

  return {
    version: INTENT_ESCALATION_VERSION,
    updatedAt: new Date().toISOString(),
    intent_state_distribution,
    escalation_paths,
    top_escalated_topics,
    monetization_ready_segments,
    notes: [
      "V163 intent escalation refines V162; does not replace monetization safety gates",
      `rows: ${rows.length}`
    ]
  };
}

export function writeAssetSeoIntentEscalationJson(cwd: string, artifact: AssetSeoIntentEscalationArtifact): string {
  const gen = resolveSeoGeneratedDir(cwd);
  fs.mkdirSync(gen, { recursive: true });
  const out = path.join(gen, "asset-seo-intent-escalation.json");
  fs.writeFileSync(out, JSON.stringify(artifact, null, 2), "utf8");
  return out;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function mergeIntentEscalationIntoAutopilotFile(cwd: string): void {
  const gen = resolveSeoGeneratedDir(cwd);
  const p = path.join(gen, "asset-seo-intent-escalation.json");
  const apPath = path.join(gen, "asset-seo-autopilot-summary.json");
  const art = readJson<AssetSeoIntentEscalationArtifact | null>(p, null);
  if (!art?.version) return;
  const ap = readJson<Record<string, unknown>>(apPath, {});
  const merged = {
    ...ap,
    intent_state_distribution: art.intent_state_distribution,
    intent_escalation_paths_sample: (art.escalation_paths || []).slice(0, 8),
    monetization_ready_segments: art.monetization_ready_segments
  };
  fs.writeFileSync(apPath, JSON.stringify(merged, null, 2), "utf8");
}
