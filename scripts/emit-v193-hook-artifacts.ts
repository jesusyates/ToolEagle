/**
 * V193.1 — Writes generated/v193-platform-generation-map.json and generated/v193-hook-validation.json
 * Run: npx tsx scripts/emit-v193-hook-artifacts.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveV186 } from "../src/lib/creator-knowledge-engine/resolve-v186";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const userText = "morning routine for busy founders";
const args = {
  toolSlug: "hook-generator",
  intentId: "intent_views",
  scenarioId: "sc_tutorial",
  userText
} as const;

const baseline = resolveV186({ ...args, debugDisableV193: true });
const v193 = resolveV186({ ...args, debugDisableV193: false });

const kbBase = baseline?.knowledgeBlock ?? "";
const kbV = v193?.knowledgeBlock ?? "";

const differences: string[] = [];
if (kbV.length > kbBase.length) differences.push(`knowledgeBlock longer by ${kbV.length - kbBase.length} chars`);
if (kbV.includes("V193.1") && !kbBase.includes("V193.1")) differences.push("V193.1 reinforcement block only in v193 run");
if (kbV.includes("TikTok voice") && !kbBase.includes("TikTok voice")) differences.push("TikTok voice rules only in v193 run");
if ((v193?.patternIds?.length ?? 0) !== (baseline?.patternIds?.length ?? 0)) {
  differences.push(
    `patternIds count baseline=${baseline?.patternIds?.length ?? 0} v193=${v193?.patternIds?.length ?? 0}`
  );
}

const pass =
  kbV.length > kbBase.length &&
  kbV.includes("V193.1") &&
  kbV.includes("TikTok voice") &&
  Boolean(v193?.v193ObservationApplied);

const mapPath = path.join(root, "generated", "v193-platform-generation-map.json");
const valPath = path.join(root, "generated", "v193-hook-validation.json");

const meta = v193?.v193GenerationMeta;
const mapPayload = {
  version: "193.1",
  generated_at: new Date().toISOString(),
  platform: "tiktok" as const,
  tool_slug: "hook-generator",
  observation_count_used: meta?.observation_count_used ?? 0,
  top_pattern_types_applied: meta?.top_pattern_types_applied ?? [],
  additive_only: true as const,
  generation_surfaces: meta?.generation_surfaces ?? [],
  pattern_ids_in_prompt: v193?.patternIds?.filter((id) => id.startsWith("v193-")) ?? []
};

fs.writeFileSync(mapPath, JSON.stringify(mapPayload, null, 2), "utf8");

const validationPayload = {
  version: "193.1",
  generated_at: new Date().toISOString(),
  baseline_output: kbBase,
  v193_output: kbV,
  differences,
  conclusion: pass
    ? "V193 observation injection adds distinct TikTok reinforcement and pattern weighting vs debugDisableV193 baseline."
    : "Validation failed: compare baseline_output vs v193_output.",
  pass
};

fs.writeFileSync(valPath, JSON.stringify(validationPayload, null, 2), "utf8");

console.log("[emit-v193-hook-artifacts] wrote", mapPath, valPath);
console.log(JSON.stringify({ pass, observation_applied: v193?.v193ObservationApplied }, null, 2));
