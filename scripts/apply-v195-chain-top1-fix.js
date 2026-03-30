#!/usr/bin/env node
/**
 * V195.3 — Apply only top_1_fix from generated/v195-chain-optimization-rules.json
 * Writes: src/config/v195-chain-top1-fix.json (single control surface)
 *         generated/v195-chain-fix-applied.json (audit)
 * Usage: node scripts/apply-v195-chain-top1-fix.js
 */

const fs = require("fs");
const path = require("path");
const { resolveRepoRoot } = require("./lib/repo-root");

const REPO = resolveRepoRoot(__dirname);
const RULES_PATH = path.join(REPO, "generated", "v195-chain-optimization-rules.json");
const CONFIG_PATH = path.join(REPO, "src", "config", "v195-chain-top1-fix.json");
const APPLIED_PATH = path.join(REPO, "generated", "v195-chain-fix-applied.json");

const DEFAULT_CONFIG = {
  version: 1,
  mode: "none",
  progressHint: { variant: "default" },
  workflowNext: {},
  readyToPost: {}
};

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

/**
 * @param {object} rules
 * @returns {{ skip: true, reason: string } | { config: object, change_type: string, target_step: string, expected_effect: string }}
 */
function planFromRules(rules) {
  if (!rules || !rules.top_1_fix) {
    return { skip: true, reason: "missing v195-chain-optimization-rules.json or top_1_fix" };
  }

  const dim = rules.top_1_fix.dimension;
  const target = rules.optimize_target_step;

  if (target === "insufficient_data_or_ambiguous_drop" || dim === "measurement") {
    return {
      skip: true,
      reason:
        "No UI fix: data insufficient or top_1_fix is measurement-only. Collect events and run npm run v195 before applying."
    };
  }

  const key = `${target}::${dim}`;

  /** @type {Record<string, (c: object) => { change_type: string; target_step: string; expected_effect: string } | { skip: boolean; reason: string }>} */
  const PLANS = {
    "hook_entry_and_first_generate::visibility": (c) => {
      c.mode = "hook_entry_visibility";
      c.progressHint = { variant: "emphasized" };
      return {
        change_type: "visibility",
        target_step: "hook_entry_and_first_generate",
        expected_effect:
          "Stronger TikTok chain progress hint framing (single module: TikTokChainProgressHint) to improve session_start→hook."
      };
    },
    "caption_handoff_after_hook::cta": (c) => {
      c.mode = "caption_handoff_cta";
      c.workflowNext = {
        hookGeneratorContinueLabel: "Continue to TikTok Caption →"
      };
      return {
        change_type: "cta",
        target_step: "caption_handoff_after_hook",
        expected_effect:
          "Primary next-step CTA from Hook to Caption only (WorkflowNextStepCard); measure hook→caption."
      };
    },
    "hashtag_handoff_after_caption::copy": (c) => {
      c.mode = "hashtag_handoff_copy";
      c.workflowNext = {
        captionNextSubtitle:
          "Hashtags boost the same post in-feed — keep your hook & caption context; one short step."
      };
      return {
        change_type: "copy",
        target_step: "hashtag_handoff_after_caption",
        expected_effect:
          "One bridge line on Caption next-step card only; measure caption→hashtag."
      };
    },
    "title_handoff_after_hashtags::visibility": (c) => {
      c.mode = "title_handoff_visibility";
      c.workflowNext = { hashtagCardEmphasis: "strong" };
      return {
        change_type: "visibility",
        target_step: "title_handoff_after_hashtags",
        expected_effect:
          "Stronger next-step card emphasis on Hashtag → Title only; measure hashtag→title."
      };
    },
    "publish_handoff_ready_to_post::cta": (c) => {
      c.mode = "publish_handoff_cta";
      c.readyToPost = {
        tiktokPrimaryLabel: "Open TikTok to paste & post"
      };
      return {
        change_type: "cta",
        target_step: "publish_handoff_ready_to_post",
        expected_effect:
          "Stronger TikTok primary button label in Ready-to-post only; measure title→upload_redirect."
      };
    }
  };

  const run = PLANS[key];
  if (!run) {
    return {
      skip: true,
      reason: `No V195.3 apply mapping for optimize_target_step="${target}" + dimension="${dim}". Extend PLANS in scripts/apply-v195-chain-top1-fix.js after npm run v195.`
    };
  }

  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  const meta = run(config);
  if (meta && meta.skip) return meta;
  return { config, ...meta };
}

function main() {
  const rules = readJson(RULES_PATH);
  const plan = planFromRules(rules);

  if (plan.skip) {
    writeJson(CONFIG_PATH, DEFAULT_CONFIG);
    const applied = {
      version: "1",
      updated_at: new Date().toISOString(),
      status: "skipped",
      applied_fix: null,
      target_step: null,
      changed_files: [path.relative(REPO, CONFIG_PATH).replace(/\\/g, "/")],
      change_type: "none",
      expected_effect: "No product behavior change; v195-chain-top1-fix.json reset to mode=none.",
      skip_reason: plan.reason,
      top_1_fix_snapshot: rules?.top_1_fix ?? null,
      rules_snapshot: {
        optimize_target_step: rules?.optimize_target_step,
        confidence: rules?.confidence
      }
    };
    writeJson(APPLIED_PATH, applied);
    console.log("[v195.3] skipped UI apply:", plan.reason);
    console.log("[v195.3] wrote", APPLIED_PATH, "and reset", CONFIG_PATH);
    return;
  }

  writeJson(CONFIG_PATH, plan.config);

  const applied = {
    version: "1",
    updated_at: new Date().toISOString(),
    status: "applied",
    applied_fix: {
      dimension: rules.top_1_fix.dimension,
      action: rules.top_1_fix.action,
      rationale: rules.top_1_fix.rationale
    },
    target_step: plan.target_step,
    changed_files: [path.relative(REPO, CONFIG_PATH).replace(/\\/g, "/")],
    behavior_surface:
      "Only src/config/v195-chain-top1-fix.json is modified by this script; TikTokChainProgressHint / WorkflowNextStepCard / ReadyToPostModal read it when mode !== none.",
    change_type: plan.change_type,
    expected_effect: plan.expected_effect,
    config_mode: plan.config.mode,
    note: "top_2_fix not applied per V195.3 (single-variable experiment).",
    top_2_fix_unchanged: rules.top_2_fix ?? null
  };
  writeJson(APPLIED_PATH, applied);
  console.log("[v195.3] applied mode=", plan.config.mode, "wrote", CONFIG_PATH, APPLIED_PATH);
}

if (require.main === module) {
  main();
}

module.exports = { planFromRules, main };
