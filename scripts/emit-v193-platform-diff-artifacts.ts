/**
 * V193.3 — Writes:
 * - generated/v193-platform-generation-map.json
 * - generated/v193-hook-validation.json
 * - generated/v193-hashtag-validation.json
 * - generated/v193-title-validation.json
 * - generated/v193-caption-validation.json
 * - generated/v193-tiktok-chain-map.json
 * - generated/v193-tiktok-chain-validation.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveV186, type V193TikTokChainRules } from "../src/lib/creator-knowledge-engine/resolve-v186";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

type ChainTool = "hook-generator" | "tiktok-caption-generator" | "hashtag-generator" | "title-generator";

function writeJson(rel: string, payload: unknown) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(payload, null, 2), "utf8");
  return p;
}

function validateTool(toolSlug: ChainTool, userText: string) {
  const baseArgs = { toolSlug, intentId: "intent_views", scenarioId: "sc_tutorial", userText };
  const baseline = resolveV186({ ...baseArgs, debugDisableV193: true });
  const v193 = resolveV186({ ...baseArgs, debugDisableV193: false });

  const kbBase = baseline?.knowledgeBlock ?? "";
  const kbV = v193?.knowledgeBlock ?? "";
  const differences: string[] = [];
  if (kbV.length > kbBase.length) differences.push(`knowledgeBlock longer by ${kbV.length - kbBase.length} chars`);
  if (kbV.includes("V193 Platform Observations") && !kbBase.includes("V193 Platform Observations")) {
    differences.push("V193 observation summary present only in v193 run");
  }
  if (kbV.includes("V193.3 TikTok Chain Consistency") && !kbBase.includes("V193.3 TikTok Chain Consistency")) {
    differences.push("V193.3 chain consistency block present only in v193 run");
  }
  if ((v193?.v193ObservationApplied ?? false) !== (baseline?.v193ObservationApplied ?? false)) {
    differences.push(
      `v193ObservationApplied baseline=${baseline?.v193ObservationApplied ?? false} v193=${v193?.v193ObservationApplied ?? false}`
    );
  }

  const hasObservationOrReinforcement =
    kbV.includes("V193 Platform Observations") || kbV.includes("V193.3 Platform Difference Reinforcement");
  const pass =
    kbV.length > kbBase.length &&
    hasObservationOrReinforcement &&
    kbV.includes("V193.3 TikTok Chain Consistency") &&
    Boolean(v193?.v193ObservationApplied) &&
    Boolean(v193?.v193GenerationMeta?.observation_count_used);

  return {
    baseline_output: kbBase,
    v193_output: kbV,
    differences,
    conclusion: pass
      ? "V193 TikTok observations + chain consistency add tool-specific reinforcement vs baseline."
      : "Validation failed: compare baseline_output vs v193_output.",
    pass,
    v193_meta: v193?.v193GenerationMeta ?? null,
    chain_rules: v193?.v193ChainRules ?? null
  };
}

function sameRules(a: V193TikTokChainRules | null | undefined, b: V193TikTokChainRules | null | undefined): boolean {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

const updatedAt = new Date().toISOString();
const topic = "cozy desk setup for students";

const hook = validateTool("hook-generator", topic);
const caption = validateTool("tiktok-caption-generator", topic);
const hashtag = validateTool("hashtag-generator", topic);
const title = validateTool("title-generator", topic);

writeJson("generated/v193-hook-validation.json", { version: "193.3", generated_at: updatedAt, ...hook });
writeJson("generated/v193-caption-validation.json", { version: "193.3", generated_at: updatedAt, ...caption });
writeJson("generated/v193-hashtag-validation.json", { version: "193.3", generated_at: updatedAt, ...hashtag });
writeJson("generated/v193-title-validation.json", { version: "193.3", generated_at: updatedAt, ...title });

const mapItems = [
  { platform: "tiktok" as const, tool_slug: "hook-generator", meta: hook.v193_meta },
  { platform: "tiktok" as const, tool_slug: "tiktok-caption-generator", meta: caption.v193_meta },
  { platform: "tiktok" as const, tool_slug: "hashtag-generator", meta: hashtag.v193_meta },
  { platform: "tiktok" as const, tool_slug: "title-generator", meta: title.v193_meta }
];

writeJson("generated/v193-platform-generation-map.json", {
  version: "193.3",
  generated_at: updatedAt,
  additive_only: true,
  items: mapItems.map((x) => ({
    platform: x.platform,
    tool_slug: x.tool_slug,
    observation_count_used: x.meta?.observation_count_used ?? 0,
    top_pattern_types_applied: x.meta?.top_pattern_types_applied ?? [],
    generation_surfaces: x.meta?.generation_surfaces ?? []
  }))
});

const shared = hook.chain_rules;
const chainConsistencyApplied =
  Boolean(shared) &&
  sameRules(shared, caption.chain_rules) &&
  sameRules(shared, hashtag.chain_rules) &&
  sameRules(shared, title.chain_rules);

writeJson("generated/v193-tiktok-chain-map.json", {
  version: "193.3",
  generated_at: updatedAt,
  tools_in_chain: ["hook-generator", "tiktok-caption-generator", "hashtag-generator", "title-generator"],
  shared_voice_rules: shared?.voice_rules ?? [],
  shared_cta_rules: shared?.cta_rules ?? [],
  shared_monetization_rules: shared?.monetization_rules ?? [],
  chain_consistency_applied: chainConsistencyApplied
});

writeJson("generated/v193-tiktok-chain-validation.json", {
  version: "193.3",
  generated_at: updatedAt,
  baseline: {
    hook: hook.baseline_output,
    caption: caption.baseline_output,
    hashtag: hashtag.baseline_output,
    title: title.baseline_output
  },
  reinforced_chain_output: {
    hook: hook.v193_output,
    caption: caption.v193_output,
    hashtag: hashtag.v193_output,
    title: title.v193_output
  },
  consistency_checks: {
    same_chain_rules_hook_vs_caption: sameRules(hook.chain_rules, caption.chain_rules),
    same_chain_rules_caption_vs_hashtag: sameRules(caption.chain_rules, hashtag.chain_rules),
    same_chain_rules_hashtag_vs_title: sameRules(hashtag.chain_rules, title.chain_rules),
    all_tools_v193_applied:
      hook.v193_meta?.observation_applied === true &&
      caption.v193_meta?.observation_applied === true &&
      hashtag.v193_meta?.observation_applied === true &&
      title.v193_meta?.observation_applied === true
  },
  pass:
    chainConsistencyApplied &&
    hook.pass &&
    caption.pass &&
    hashtag.pass &&
    title.pass
});

console.log(
  "[emit-v193-platform-diff-artifacts] ok",
  JSON.stringify(
    {
      hook: hook.pass,
      caption: caption.pass,
      hashtag: hashtag.pass,
      title: title.pass,
      chainConsistencyApplied
    },
    null,
    2
  )
);

