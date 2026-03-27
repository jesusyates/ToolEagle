#!/usr/bin/env node
/**
 * V123 — Controlled EN answer/guide surface expansion.
 * Governed by docs/system-blueprint.md.
 * Do not implement logic that conflicts with blueprint rules.
 * Secondary to blog autopilot; only enqueues selected pages for indexing.
 */

const fs = require("fs");
const path = require("path");
require("./lib/indexing-queue");
const { enqueueIndexingUrl } = require("./lib/indexing-queue");
const { topicKeyFromParts } = require("./lib/topic-normalizer");
const { validateGuideLike, validateAnswerLike } = require("./lib/content-role-validator");
const { loadRegistry, saveRegistry, decideGeneration, upsertTopicPage } = require("./lib/topic-registry");

const ROOT = process.cwd();
const PLAN_PATH = path.join(ROOT, "generated", "en-content-surface-plan.json");
const OUT_LAST_RUN = path.join(ROOT, "generated", "en-content-surface-last-run.json");
const HISTORY_PATH = path.join(ROOT, "generated", "en-content-surface-history.json");

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.tooleagle.com").replace(/\/$/, "");
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

function readJson(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const getNum = (flag, d) => {
    const idx = args.indexOf(flag);
    if (idx < 0) return d;
    const n = Number(args[idx + 1]);
    return Number.isFinite(n) && n >= 0 ? n : d;
  };
  return {
    answersMax: getNum("--answers-max", 5),
    guidesMax: getNum("--guides-max", 2)
  };
}

function isAnswerQualitySafe(url) {
  if (!url || !url.startsWith("/answers/")) return false;
  const slug = url.replace("/answers/", "");
  if (!slug || slug.length < 10) return false;
  return /how|what|best|tips|strategy|guide|formula|time|viral|caption|hook|hashtag/i.test(slug);
}

function isGuideQualitySafe(url) {
  if (!url) return false;
  return url.startsWith("/how-to/") || url.startsWith("/en/how-to/");
}

function recentlyPushed(history, url) {
  const at = history?.submittedAt?.[url];
  if (!at) return false;
  const ts = new Date(at).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < COOLDOWN_MS;
}

function enqueueByType(candidates, type, cap, history, skippedReasons) {
  const out = [];
  for (const c of candidates) {
    if (out.length >= cap) break;
    const url = c.url;
    if (recentlyPushed(history, url)) {
      skippedReasons.push({ type, url, reason: "cooldown_not_elapsed" });
      continue;
    }

    const qualitySafe = type === "answer" ? isAnswerQualitySafe(url) : isGuideQualitySafe(url);
    if (!qualitySafe) {
      skippedReasons.push({ type, url, reason: "quality_not_safe_skip" });
      continue;
    }

    const full = `${BASE}${url}`;
    const source = type === "answer" ? "v123-surface-answer" : "v123-surface-guide";
    const q = enqueueIndexingUrl({ url: full, source });
    if (q?.queued) {
      out.push({ url, fullUrl: full, source, platform: c.platform, topic: c.topic });
      history.submittedAt[url] = new Date().toISOString();
    } else {
      skippedReasons.push({ type, url, reason: q?.reason || "enqueue_failed" });
    }
  }
  return out;
}

function intentForType(type) {
  if (type === "blog") return "broader_ideas_examples_lists";
  if (type === "answer") return "short_direct_question_answer";
  return "step_by_step_workflow";
}

function typePatternValid(type, url) {
  if (type === "answer") return isAnswerQualitySafe(url);
  if (type === "guide") return isGuideQualitySafe(url);
  return typeof url === "string" && url.startsWith("/blog/");
}

function competingWithPrimary(topic, type, url) {
  const primaryType = topic?.primaryType;
  const primaryUrl = topic?.primaryUrl;
  const intent = String(topic?.intent || "");
  if (!primaryType || !primaryUrl) return { conflict: false, reason: null };

  if (type === primaryType && url !== primaryUrl) {
    return { conflict: true, reason: "same_type_non_primary_competes_with_primary" };
  }

  // Guide-primary topics should not produce blog pages with how-to/workflow intent shape.
  if (primaryType === "guide" && type === "blog" && /how-to|workflow/i.test(intent)) {
    return { conflict: true, reason: "guide_primary_blocks_howto_blog_competition" };
  }

  // Blog-primary topics should avoid guide pages that mirror ideas/list intent.
  if (primaryType === "blog" && type === "guide" && /idea|example|list/i.test(intent)) {
    return { conflict: true, reason: "blog_primary_blocks_listicle_guide_competition" };
  }

  return { conflict: false, reason: null };
}

function main() {
  const { answersMax, guidesMax } = parseArgs();
  const plan = readJson(PLAN_PATH, {});
  const history = readJson(HISTORY_PATH, { submittedAt: {} });
  history.submittedAt = history.submittedAt && typeof history.submittedAt === "object" ? history.submittedAt : {};

  const topics = Array.isArray(plan.topics) ? plan.topics : [];
  const registry = loadRegistry();
  const answerCandidates = [];
  const guideCandidates = [];
  let primaryPagesCreated = 0;
  let supportingPagesCreated = 0;
  let skippedDueToConflict = 0;
  let cannibalizationPreventedCount = 0;
  let downgradedGenerations = 0;
  const preventedConflicts = [];

  for (const t of topics) {
    const answerUrl = t?.pageTargets?.answerUrl;
    const guideUrl = t?.pageTargets?.guideUrl;
    if (answerUrl)
      answerCandidates.push({
        platform: t.platform,
        topic: t.topic,
        topicKey: topicKeyFromParts({ platform: t.platform, topic: t.topic }),
        intent: t.intent,
        primaryType: t.primaryType,
        primaryUrl: t.primaryUrl,
        url: answerUrl,
        type: "answer",
        score: Number(t.score) || 0
      });
    if (guideUrl)
      guideCandidates.push({
        platform: t.platform,
        topic: t.topic,
        topicKey: topicKeyFromParts({ platform: t.platform, topic: t.topic }),
        intent: t.intent,
        primaryType: t.primaryType,
        primaryUrl: t.primaryUrl,
        answerUrl: answerUrl || null,
        url: guideUrl,
        type: "guide",
        score: Number(t.score) || 0
      });
  }

  answerCandidates.sort((a, b) => b.score - a.score);
  guideCandidates.sort((a, b) => b.score - a.score);

  const skippedReasons = [];
  const filteredAnswers = [];
  const filteredGuides = [];

  for (const c of answerCandidates) {
    const patternOk = typePatternValid("answer", c.url);
    if (!patternOk) {
      skippedReasons.push({ type: "answer", url: c.url, reason: "intent_pattern_invalid_answer" });
      continue;
    }
    const roleCheck = validateAnswerLike("Direct answer format", `how to ${c.topic}?`);
    if (!roleCheck.ok) {
      skippedReasons.push({ type: "answer", url: c.url, reason: roleCheck.reason });
      continue;
    }
    const decision = decideGeneration({
      registry,
      topicKey: c.topicKey,
      platform: c.platform,
      type: "answer",
      url: c.url,
      intent: c.intent
    });
    if (decision.decision === "skip") {
      skippedDueToConflict += 1;
      cannibalizationPreventedCount += 1;
      preventedConflicts.push({ type: "answer", url: c.url, primaryType: c.primaryType, primaryUrl: c.primaryUrl, reason: decision.reason });
      skippedReasons.push({ type: "answer", url: c.url, reason: decision.reason });
      continue;
    }
    filteredAnswers.push(c);
  }

  for (const c of guideCandidates) {
    const patternOk = typePatternValid("guide", c.url);
    if (!patternOk) {
      skippedReasons.push({ type: "guide", url: c.url, reason: "intent_pattern_invalid_guide" });
      continue;
    }
    const roleCheck = validateGuideLike("How to execute workflow\n## Step 1\n## Step 2");
    if (!roleCheck.ok) {
      skippedReasons.push({ type: "guide", url: c.url, reason: roleCheck.reason });
      continue;
    }
    // Blueprint intent guard from topic ownership plan (pre-registry).
    if (c.primaryType === "blog" && /idea|example|list/i.test(String(c.intent || ""))) {
      if (c.answerUrl) {
        downgradedGenerations += 1;
        filteredAnswers.push({
          ...c,
          type: "answer",
          url: c.answerUrl
        });
        preventedConflicts.push({
          type: "guide",
          url: c.url,
          primaryType: c.primaryType,
          primaryUrl: c.primaryUrl,
          reason: "plan_guard_downgrade_guide_to_answer"
        });
        skippedReasons.push({ type: "guide", url: c.url, reason: "downgraded_to_answer:plan_guard_downgrade_guide_to_answer" });
        cannibalizationPreventedCount += 1;
        skippedDueToConflict += 1;
        continue;
      }
      skippedDueToConflict += 1;
      cannibalizationPreventedCount += 1;
      preventedConflicts.push({ type: "guide", url: c.url, primaryType: c.primaryType, primaryUrl: c.primaryUrl, reason: "plan_guard_skip_overlapping_guide" });
      skippedReasons.push({ type: "guide", url: c.url, reason: "plan_guard_skip_overlapping_guide" });
      continue;
    }

    const decision = decideGeneration({
      registry,
      topicKey: c.topicKey,
      platform: c.platform,
      type: "guide",
      url: c.url,
      intent: c.intent,
      answerUrl: c.answerUrl
    });
    if (decision.decision === "downgrade" && decision.downgradeTo?.type === "answer") {
      downgradedGenerations += 1;
      filteredAnswers.push({
        ...c,
        type: "answer",
        url: decision.downgradeTo.url
      });
      skippedReasons.push({ type: "guide", url: c.url, reason: `downgraded_to_answer:${decision.reason}` });
      continue;
    }
    if (decision.decision === "skip") {
      skippedDueToConflict += 1;
      cannibalizationPreventedCount += 1;
      preventedConflicts.push({ type: "guide", url: c.url, primaryType: c.primaryType, primaryUrl: c.primaryUrl, reason: decision.reason });
      skippedReasons.push({ type: "guide", url: c.url, reason: decision.reason });
      continue;
    }
    filteredGuides.push(c);
  }

  const answersQueued = enqueueByType(filteredAnswers, "answer", answersMax, history, skippedReasons);
  const guidesQueued = enqueueByType(filteredGuides, "guide", guidesMax, history, skippedReasons);

  for (const q of answersQueued) {
    const topic = topics.find((t) => t.platform === q.platform && t.topic === q.topic);
    const isPrimary = topic?.primaryType === "answer" && topic?.primaryUrl === q.url;
    if (isPrimary) primaryPagesCreated += 1;
    else supportingPagesCreated += 1;
    upsertTopicPage({
      registry,
      topicKey: topicKeyFromParts({ platform: q.platform, topic: q.topic }),
      platform: q.platform,
      type: "answer",
      url: q.url,
      primaryType: topic?.primaryType || "blog",
      primaryUrl: topic?.primaryUrl || q.url
    });
  }
  for (const q of guidesQueued) {
    const topic = topics.find((t) => t.platform === q.platform && t.topic === q.topic);
    const isPrimary = topic?.primaryType === "guide" && topic?.primaryUrl === q.url;
    if (isPrimary) primaryPagesCreated += 1;
    else supportingPagesCreated += 1;
    upsertTopicPage({
      registry,
      topicKey: topicKeyFromParts({ platform: q.platform, topic: q.topic }),
      platform: q.platform,
      type: "guide",
      url: q.url,
      primaryType: topic?.primaryType || "guide",
      primaryUrl: topic?.primaryUrl || q.url
    });
  }

  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf8");
  saveRegistry(registry);

  const run = {
    updatedAt: new Date().toISOString(),
    caps: { answersMax, guidesMax },
    answersCreated: answersQueued.length,
    guidesCreated: guidesQueued.length,
    primaryPagesCreated,
    supportingPagesCreated,
    skippedDueToConflict,
    downgradedGenerations,
    cannibalizationPreventedCount,
    preventedConflicts,
    intentSeparation: {
      blog: intentForType("blog"),
      answer: intentForType("answer"),
      guide: intentForType("guide")
    },
    queued: {
      answers: answersQueued,
      guides: guidesQueued
    },
    skippedReasons
  };

  fs.mkdirSync(path.dirname(OUT_LAST_RUN), { recursive: true });
  fs.writeFileSync(OUT_LAST_RUN, JSON.stringify(run, null, 2), "utf8");
  console.log(
    `[V123] EN surface expansion answers=${answersQueued.length}/${answersMax} guides=${guidesQueued.length}/${guidesMax} -> ${OUT_LAST_RUN}`
  );
}

main();

