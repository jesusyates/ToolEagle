#!/usr/bin/env node
/**
 * V195.2 — Derive chain optimization rules from v195-chain-completion.json + v195-chain-dropoff-diagnosis.json
 * Output: generated/v195-chain-optimization-rules.json
 * Usage: node scripts/build-v195-chain-optimization-rules.js
 */

const fs = require("fs");
const path = require("path");
const { resolveRepoRoot } = require("./lib/repo-root");

const REPO = resolveRepoRoot(__dirname);
const COMPLETION_PATH = path.join(REPO, "generated", "v195-chain-completion.json");
const DIAGNOSIS_PATH = path.join(REPO, "generated", "v195-chain-dropoff-diagnosis.json");
const OUT_PATH = path.join(REPO, "generated", "v195-chain-optimization-rules.json");

/** @type {Record<string, {
 *   optimize_target_step: string;
 *   recommended_fix_type: "copy" | "cta" | "visibility" | "mixed";
 *   recommended_copy_adjustment: string;
 *   recommended_cta_adjustment: string;
 *   recommended_visibility_adjustment: string;
 *   top_1_fix: { dimension: string; action: string; rationale: string };
 *   top_2_fix: { dimension: string; action: string; rationale: string };
 *   do_not_change_yet: string[];
 * }>} */
const RULES_BY_TRANSITION = {
  "session_start → hook": {
    optimize_target_step: "hook_entry_and_first_generate",
    recommended_fix_type: "visibility",
    recommended_copy_adjustment:
      "Strengthen the one-line explanation of what the hook tool does and what the user receives after generating (outcome-focused, not feature-focused).",
    recommended_cta_adjustment:
      "Make the primary Generate control the single obvious next action; avoid competing secondary CTAs at first glance.",
    recommended_visibility_adjustment:
      "Ensure the chain progress hint and first-step framing are visible without scrolling on mobile; reduce noise above the fold.",
    top_1_fix: {
      dimension: "visibility",
      action: "Increase prominence of the first-step chain framing and primary Generate entry on hook landing.",
      rationale: "Largest loss is before first hook: users are not starting generation."
    },
    top_2_fix: {
      dimension: "cta",
      action: "Tighten primary button hierarchy so Generate clearly wins over secondary actions.",
      rationale: "If the action exists but is missed, CTA weight fixes convert faster than new copy alone."
    },
    do_not_change_yet: [
      "Caption / hashtag / title tools and upload handoff until first-step generation rate improves (avoid diluting signal)."
    ]
  },
  "hook → caption": {
    optimize_target_step: "caption_handoff_after_hook",
    recommended_fix_type: "cta",
    recommended_copy_adjustment:
      "Add a short bridge line that ties hook output to the next step (e.g. turn this hook into a caption) with one clear promise.",
    recommended_cta_adjustment:
      "Make the next-step control to TikTok Caption the dominant action after results; repeat it near the primary result block.",
    recommended_visibility_adjustment:
      "Place the next-step card above the fold after generation on hook; avoid burying it under long secondary content.",
    top_1_fix: {
      dimension: "cta",
      action: "Make the next-step navigation to Caption the primary post-result action once hooks exist.",
      rationale: "Loss is between hook and caption: continuation intent is not converting."
    },
    top_2_fix: {
      dimension: "copy",
      action: "Add one sentence that explains why caption is the logical next step for the same post.",
      rationale: "Motivation gap after hook: users need a reason to continue the chain."
    },
    do_not_change_yet: [
      "Hashtag and title microcopy deep-dives until caption handoff is validated.",
      "Ready-to-post modal and upload URL treatment (unless data also shows title→upload as co-primary)."
    ]
  },
  "caption → hashtag": {
    optimize_target_step: "hashtag_handoff_after_caption",
    recommended_fix_type: "copy",
    recommended_copy_adjustment:
      "Clarify that hashtags are for distribution reach on the same post, not a separate topic—reduce perceived redundancy.",
    recommended_cta_adjustment:
      "Label the next step as Hashtags for this post with a single continue control after caption results.",
    recommended_visibility_adjustment:
      "Surface the next-step card immediately after caption results; avoid pushing it below fold on mobile.",
    top_1_fix: {
      dimension: "copy",
      action: "Reframe hashtags as the same-post packaging step, not an extra chore.",
      rationale: "Users may stop if the value of another step feels unclear."
    },
    top_2_fix: {
      dimension: "visibility",
      action: "Keep the next-step card adjacent to caption output so continuation is obvious.",
      rationale: "If the path exists but is missed, visibility beats new feature work."
    },
    do_not_change_yet: [
      "Hook landing and first generate unless data shows simultaneous regression upstream."
    ]
  },
  "hashtag → title": {
    optimize_target_step: "title_handoff_after_hashtags",
    recommended_fix_type: "visibility",
    recommended_copy_adjustment:
      "Explain title/cover line as the on-video hook viewers see—distinct from hashtags and body caption.",
    recommended_cta_adjustment:
      "Use one consistent Continue to title label after hashtag results; avoid synonym drift across tools.",
    recommended_visibility_adjustment:
      "Show title as step 4 of 4 in the same surface pattern as prior steps to reduce skip behavior.",
    top_1_fix: {
      dimension: "visibility",
      action: "Align title next-step placement with prior chain cards so users recognize the same pattern.",
      rationale: "Users may believe they are done after hashtags; visibility of step 4 matters."
    },
    top_2_fix: {
      dimension: "copy",
      action: "One line on why title still matters for TikTok packaging (cover / opener).",
      rationale: "Reduces premature exit when users think hashtags were enough."
    },
    do_not_change_yet: [
      "Upload modal mechanics until title→upload is separately measured."
    ]
  },
  "title → upload": {
    optimize_target_step: "publish_handoff_ready_to_post",
    recommended_fix_type: "cta",
    recommended_copy_adjustment:
      "Strengthen Ready-to-post body copy: what to paste where and that opening upload is the final step to ship.",
    recommended_cta_adjustment:
      "Make the Go to TikTok (or platform) button the clear primary; reduce ambiguity vs Cancel.",
    recommended_visibility_adjustment:
      "Trigger the modal in context right after copy success; avoid timing that feels like an interruption with no payoff.",
    top_1_fix: {
      dimension: "cta",
      action: "Strengthen the upload redirect button as the obvious completion of the chain after copy.",
      rationale: "Loss is after title: users are not opening upload despite finishing earlier steps."
    },
    top_2_fix: {
      dimension: "copy",
      action: "Clarify in one short paragraph what happens when they open TikTok (paste + post).",
      rationale: "Reduces anxiety and abandonment on the last click."
    },
    do_not_change_yet: [
      "Earlier chain steps unless completion data shows multi-step regression.",
      "Broad redesign of generation models—this is a handoff and intent problem first."
    ]
  }
};

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function confidenceFromSample(started_sessions) {
  const n = Number(started_sessions) || 0;
  if (n <= 0) return { score: 0, tier: "none", note: "No started_sessions; rules are placeholders until data exists." };
  if (n < 30) return { score: 0.35, tier: "low", note: "Sample < 30: use directionally only." };
  if (n < 100) return { score: 0.55, tier: "medium_low", note: "Sample 30–99: validate with one change at a time." };
  if (n < 300) return { score: 0.72, tier: "medium", note: "Sample 100–299: reasonable confidence for prioritized tests." };
  return { score: 0.85, tier: "high", note: "Sample ≥ 300: stronger basis; still change one lever per experiment." };
}

function main() {
  const completion = readJson(COMPLETION_PATH);
  const diagnosis = readJson(DIAGNOSIS_PATH);

  const bd =
    completion?.biggest_drop_step ??
    diagnosis?.biggest_drop_step ??
    null;

  const transition =
    bd && typeof bd.transition === "string" && bd.transition.trim() ? bd.transition.trim() : null;

  const started_sessions = Number(completion?.started_sessions ?? 0);
  const conf = confidenceFromSample(started_sessions);

  let rules = RULES_BY_TRANSITION[transition] ?? null;

  if (!rules) {
    rules = {
      optimize_target_step: "insufficient_data_or_ambiguous_drop",
      recommended_fix_type: "mixed",
      recommended_copy_adjustment:
        "Re-run npm run v195 after more production events, or inspect v195-chain-dropoff-diagnosis.json for the dominant transition.",
      recommended_cta_adjustment:
        "Avoid CTA experiments until the largest drop transition is stable across a minimum sample (e.g. n ≥ 30 started sessions).",
      recommended_visibility_adjustment:
        "Prefer measuring before broad visibility changes; ensure chain telemetry (session_start + steps) is firing.",
      top_1_fix: {
        dimension: "measurement",
        action: "Collect more tiktok-chain-events.jsonl data and re-aggregate so biggest_drop_step is non-null.",
        rationale: "Rules require a identified transition; current data does not support a single target."
      },
      top_2_fix: {
        dimension: "measurement",
        action: "Verify client emits session_start and step events for all four tools in production.",
        rationale: "Wrong or missing telemetry will mis-rank drops."
      },
      do_not_change_yet: [
        "Simultaneous UI changes across hook, caption, hashtag, title, and upload until one dominant drop is confirmed."
      ]
    };
  }

  const payload = {
    version: "1",
    updated_at: new Date().toISOString(),
    inputs: {
      completion: COMPLETION_PATH,
      diagnosis: DIAGNOSIS_PATH
    },
    data_snapshot: {
      started_sessions,
      biggest_drop_transition: transition,
      lost_sessions: bd?.lost_sessions ?? null,
      from_count: bd?.from_count ?? null,
      to_count: bd?.to_count ?? null
    },
    biggest_drop_step: bd,
    optimize_target_step: rules.optimize_target_step,
    recommended_fix_type: rules.recommended_fix_type,
    recommended_copy_adjustment: rules.recommended_copy_adjustment,
    recommended_cta_adjustment: rules.recommended_cta_adjustment,
    recommended_visibility_adjustment: rules.recommended_visibility_adjustment,
    confidence: conf.score,
    confidence_meta: {
      tier: conf.tier,
      note: conf.note,
      started_sessions
    },
    top_1_fix: rules.top_1_fix,
    top_2_fix: rules.top_2_fix,
    do_not_change_yet: rules.do_not_change_yet,
    priority_note:
      "Change only top_1_fix first in the next iteration; treat top_2_fix as the second experiment. Defer items in do_not_change_yet until the primary drop moves."
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log("[v195.2] wrote", OUT_PATH, {
    transition: transition ?? "(none)",
    optimize_target_step: rules.optimize_target_step,
    confidence: conf.score
  });
}

if (require.main === module) {
  main();
}

module.exports = { main, RULES_BY_TRANSITION, confidenceFromSample };
