#!/usr/bin/env node
/**
 * V126.2 — Blueprint alignment soft guard (read-only).
 * This script never mutates generation data and never hard-blocks execution.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BLUEPRINT_PATH = path.join(ROOT, "generated", "system-blueprint.json");
const ALLOCATION_PATH = path.join(ROOT, "generated", "content-allocation-plan.json");
const SURFACE_PLAN_PATH = path.join(ROOT, "generated", "en-content-surface-plan.json");
const DAILY_STATUS_PATH = path.join(ROOT, "generated", "en-growth-daily-status.json");
const OUT_PATH = path.join(ROOT, "generated", "blueprint-alignment-report.json");

function readJsonSafe(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeTopicKey(platform, topic) {
  const raw = `${platform || ""}-${topic || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || "unknown-topic";
}

function pushIssue(target, flag, detail) {
  target.push({ flag, detail });
}

function main() {
  const checkedAt = new Date().toISOString();
  const violations = [];
  const warnings = [];

  const blueprint = readJsonSafe(BLUEPRINT_PATH, {});
  const allocation = readJsonSafe(ALLOCATION_PATH, {});
  const surfacePlan = readJsonSafe(SURFACE_PLAN_PATH, {});
  const daily = readJsonSafe(DAILY_STATUS_PATH, {});

  const blogCreated = Number(daily.blogCreated || 0);
  const answersCreated = Number(daily.answersCreated || 0);
  const guidesCreated = Number(daily.guidesCreated || 0);
  const total = blogCreated + answersCreated + guidesCreated;

  const blogRatio = total > 0 ? blogCreated / total : 0;
  const answerRatio = total > 0 ? answersCreated / total : 0;
  const guideRatio = total > 0 ? guidesCreated / total : 0;

  // Rule A — Page Type Distribution
  if (total > 0) {
    if (blogRatio <= 0.6 || answerRatio > 0.2 || guideRatio > 0.15) {
      pushIssue(violations, "page_type_distribution_drift", {
        blogRatio,
        answerRatio,
        guideRatio,
        thresholds: { blogMinExclusive: 0.6, answerMax: 0.2, guideMax: 0.15 }
      });
    }
  } else {
    pushIssue(warnings, "page_type_distribution_drift", "no_created_pages_in_status_window");
  }

  // Rule B — Topic Ownership Consistency
  const topics = Array.isArray(surfacePlan.topics) ? surfacePlan.topics : [];
  if (!topics.length) {
    pushIssue(warnings, "topic_ownership_violation", "surface_plan_has_no_topics");
  } else {
    const seen = new Set();
    for (const t of topics) {
      const key = normalizeTopicKey(t.platform, t.topic);
      if (seen.has(key)) {
        pushIssue(violations, "topic_ownership_violation", { reason: "duplicate_topic_cluster", topicKey: key });
        continue;
      }
      seen.add(key);
      if (!t.primaryType || !t.primaryUrl) {
        pushIssue(violations, "topic_ownership_violation", { reason: "missing_primary_fields", topicKey: key });
      }
      if (t.primaryType === "answer") {
        pushIssue(violations, "topic_ownership_violation", { reason: "answer_primary_forbidden", topicKey: key });
      }
    }
  }

  // Rule C — Intent Separation
  for (const t of topics) {
    const intent = String(t.intent || "").toLowerCase();
    const hasHowTo = /how-to|workflow/.test(intent);
    const hasIdea = /idea|example|list/.test(intent);
    if (hasHowTo && hasIdea) {
      pushIssue(violations, "intent_collision", { topic: t.topic, platform: t.platform, intent: t.intent });
    }
    if (t.primaryType === "guide" && hasIdea && !hasHowTo) {
      pushIssue(warnings, "intent_collision", { reason: "guide_primary_with_idea_intent", topic: t.topic, platform: t.platform });
    }
    if (t.primaryType === "blog" && hasHowTo && !hasIdea) {
      pushIssue(warnings, "intent_collision", { reason: "blog_primary_with_workflow_intent", topic: t.topic, platform: t.platform });
    }
  }

  // Rule D — Tool Link Presence (proxy checks from plan + blueprint)
  const hasFlowModel = Array.isArray(blueprint?.D_traffic_flow_model?.flow);
  if (!hasFlowModel) {
    pushIssue(warnings, "tool_link_missing_or_spam", "blueprint_missing_traffic_flow_model");
  }
  for (const t of topics) {
    if (!t.primaryTool) {
      pushIssue(violations, "tool_link_missing_or_spam", { reason: "topic_missing_primary_tool", topic: t.topic, platform: t.platform });
    }
    const answerUrl = String(t?.pageTargets?.answerUrl || "");
    const guideUrl = String(t?.pageTargets?.guideUrl || "");
    if (answerUrl.startsWith("/tools/") || guideUrl.startsWith("/tools/")) {
      pushIssue(violations, "tool_link_missing_or_spam", { reason: "answer_or_guide_is_tool_only_shape", topic: t.topic, platform: t.platform });
    }
  }

  // Rule E — Surface Expansion Control
  const capAnswers = Number(daily?.caps?.answersSecondary || 5);
  const capGuides = Number(daily?.caps?.guidesSecondary || 2);
  if (answersCreated > capAnswers || guidesCreated > capGuides) {
    pushIssue(violations, "surface_expansion_overflow", {
      answersCreated,
      guidesCreated,
      caps: { answers: capAnswers, guides: capGuides }
    });
  }
  // must pass intent validation: if prior run has explicit invalid intent reasons, mark violation.
  const lastRunPath = path.join(ROOT, "generated", "en-content-surface-last-run.json");
  const lastRun = readJsonSafe(lastRunPath, {});
  const skippedReasons = Array.isArray(lastRun?.skippedReasons) ? lastRun.skippedReasons : [];
  const invalidIntent = skippedReasons.filter((r) => /intent_pattern_invalid|answer_requires|guide_requires/i.test(String(r.reason || "")));
  if (invalidIntent.length > 0) {
    pushIssue(violations, "surface_expansion_overflow", { reason: "intent_validation_failures_detected", count: invalidIntent.length });
  }

  const overallStatus = violations.length > 0 ? "warning" : "ok";
  const recommendation =
    overallStatus === "ok"
      ? "Blueprint alignment is healthy. Continue current pipeline."
      : "Soft-guard warnings detected. Keep pipeline running, review violations, and prepare hard-guard thresholds in next phase.";

  const report = {
    checkedAt,
    overallStatus,
    violations,
    warnings,
    metrics: {
      blogRatio,
      answerRatio,
      guideRatio
    },
    recommendation,
    futureHardGuardReady: true
  };

  try {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2), "utf8");
  } catch (e) {
    console.warn("[V126.2] failed writing blueprint alignment report:", e?.message || String(e));
  }

  if (violations.length > 0) {
    console.warn(`[V126.2] blueprint alignment warning: violations=${violations.length} warnings=${warnings.length}`);
  } else {
    console.log(`[V126.2] blueprint alignment ok: warnings=${warnings.length}`);
  }

  // Never hard-fail in phase 1.
  process.exit(0);
}

try {
  main();
} catch (e) {
  console.warn("[V126.2] validator graceful fallback:", e?.message || String(e));
  try {
    const fallback = {
      checkedAt: new Date().toISOString(),
      overallStatus: "warning",
      violations: [],
      warnings: [{ flag: "validator_runtime_error", detail: String(e?.message || e) }],
      metrics: { blogRatio: 0, answerRatio: 0, guideRatio: 0 },
      recommendation: "Validator failed gracefully. Pipeline should continue; inspect validator logs.",
      futureHardGuardReady: true
    };
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(fallback, null, 2), "utf8");
  } catch {}
  process.exit(0);
}

