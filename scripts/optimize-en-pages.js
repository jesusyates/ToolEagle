#!/usr/bin/env node
/**
 * V112 + V113 — Apply safe EN blog MDX updates; V113 appends generated/page-optimization-registry.json on --write
 * Governed by docs/system-blueprint.md.
 * Do not implement logic that conflicts with blueprint rules.
 *
 * Usage:
 *   node scripts/optimize-en-pages.js --dry-run
 *   node scripts/optimize-en-pages.js --write --limit 5
 *   node scripts/optimize-en-pages.js --write --only high_potential
 *   node scripts/optimize-en-pages.js --write --only rising_pages --include-intro
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { BLOG_DIR, safeReadJson } = require("./lib/page-optimization-shared");
const { buildRolloutStatusFile, defaultPolicyV114, safeReadJson: safeReadPolicyJson } = require("./lib/page-optimization-policy");
const { sanitizeAndValidateMdxForWrite } = require("./lib/mdx-safety");
const {
  ensureSchedulerStatus,
  assertWriteAllowedOrExit,
  registerCohortFromWriteBatch
} = require("./lib/optimization-experiment-scheduler");

const REC_PATH = path.join(process.cwd(), "generated", "page-optimization-recommendations.json");
const POLICY_PATH = path.join(process.cwd(), "generated", "page-optimization-policy.json");
const LESSONS_PATH = path.join(process.cwd(), "generated", "page-optimization-lessons.json");
const ROLLOUT_STATUS_PATH = path.join(process.cwd(), "generated", "page-optimization-rollout-status.json");
const HISTORY = path.join(process.cwd(), "generated", "page-optimization-history.jsonl");
const SCHEDULER_STATUS_PATH = path.join(process.cwd(), "generated", "optimization-scheduler-status.json");
const { appendEntries } = require("./lib/page-optimization-registry");

function parseArgs(argv) {
  const out = {
    dryRun: argv.includes("--dry-run"),
    write: argv.includes("--write"),
    limit: null,
    only: null,
    includeIntro: argv.includes("--include-intro"),
  };
  const li = argv.indexOf("--limit");
  if (li >= 0) out.limit = parseInt(argv[li + 1], 10) || null;
  const oi = argv.indexOf("--only");
  if (oi >= 0) out.only = argv[oi + 1] || null;
  return out;
}

function shouldInclude(item, only) {
  if (!only) return true;
  return item.bucket === only;
}

function appendHistory(entry) {
  fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
  fs.appendFileSync(HISTORY, JSON.stringify(entry) + "\n", "utf8");
}

function readSchedulerStatus() {
  try {
    if (!fs.existsSync(SCHEDULER_STATUS_PATH)) return null;
    return JSON.parse(fs.readFileSync(SCHEDULER_STATUS_PATH, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const doWrite = args.write;

  // V119 hard lock: only allow writes in explicitly approved scheduler states.
  if (doWrite) {
    ensureSchedulerStatus();
    const schedulerStatus = readSchedulerStatus();
    const nextAction = schedulerStatus?.nextAction;
    const allowed = nextAction === "ALLOW_NEXT_BATCH" || nextAction === "ALLOW_FIRST_REAL_BATCH";
    if (!allowed) {
      console.error("Optimization write blocked by scheduler state");
      console.error(`[V119] nextAction=${nextAction || "UNKNOWN"} reason=${schedulerStatus?.reason || "scheduler_blocked"}`);
      process.exit(1);
    }
  }

  const doc = safeReadJson(REC_PATH);
  if (!doc || !Array.isArray(doc.items)) {
    console.error("Missing generated/page-optimization-recommendations.json — run build-page-optimization-recommendations.js");
    process.exit(1);
  }

  const policy = safeReadPolicyJson(POLICY_PATH) || defaultPolicyV114();
  const rolloutStatus = buildRolloutStatusFile(POLICY_PATH, LESSONS_PATH, args);
  fs.mkdirSync(path.dirname(ROLLOUT_STATUS_PATH), { recursive: true });
  fs.writeFileSync(ROLLOUT_STATUS_PATH, JSON.stringify(rolloutStatus, null, 2), "utf8");

  const recommendedBatchPages = rolloutStatus?.rollout?.overall?.recommendedBatchPages ?? policy.batchLimits.defaultWriteBatch;
  const hardCap = policy.batchLimits.hardCap ?? 10;

  // Policy-driven write batch size:
  // - if user passes --limit, still clamp it to both policy recommended and hardCap
  const requestedLimit = args.limit;
  const effectiveLimit = requestedLimit
    ? Math.min(requestedLimit, hardCap, recommendedBatchPages)
    : recommendedBatchPages;
  const selectionWindow = Math.min(hardCap, policy.batchLimits.hardCap ?? 10);

  if (args.write && args.dryRun) {
    console.error("Use either --write or --dry-run, not both.");
    process.exit(1);
  }

  if (!doWrite && !args.dryRun) {
    console.log("No --write or --dry-run: defaulting to --dry-run (no files changed).");
  }
  const dry = !doWrite;
  if (doWrite) {
    assertWriteAllowedOrExit();
  } else {
    ensureSchedulerStatus();
  }

  let items = doc.items.filter((it) => it.status !== "missing_file" && it.recommendations);
  if (args.only) {
    items = items.filter((it) => shouldInclude(it, args.only));
  }
  // Keep a bounded selection window; final write is still controlled by effectiveLimit + per-bucket caps.
  if (items.length > selectionWindow) items = items.slice(0, selectionWindow);

  // Prioritize high_potential bucket to preserve safe rollout discipline.
  const bucketPriority = policy.prioritization || { high_potential: 1, rising_pages: 0.4 };
  items.sort((a, b) => (bucketPriority[b.bucket] ?? 0) - (bucketPriority[a.bucket] ?? 0));

  let applied = 0;
  const registryBatch = [];
  const bucketApplied = { high_potential: 0, rising_pages: 0 };
  const bucketCaps = { high_potential: 0, rising_pages: 0 };
  if (args.only === "rising_pages") {
    bucketCaps.rising_pages = effectiveLimit;
  } else if (args.only === "high_potential") {
    bucketCaps.high_potential = effectiveLimit;
  } else {
    bucketCaps.rising_pages = Math.min(policy.batchLimits.maxSecondaryBucketPages ?? 2, effectiveLimit);
    bucketCaps.high_potential = Math.max(0, effectiveLimit - bucketCaps.rising_pages);
  }

  const secondaryBucket = "rising_pages";
  let introAppliedCount = 0;

  const rolloutFieldsForBucket = (bucket) => rolloutStatus?.rollout?.buckets?.[bucket]?.fields || {};

  for (const item of items) {
    if (applied >= effectiveLimit) break;
    const slug = item.slug;
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) {
      console.log(`[skip] missing ${filePath}`);
      continue;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const nextData = { ...data };
    let nextContent = content;
    const changes = [];
    const policyReasonsByField = {};

    const fieldDecisions = rolloutFieldsForBucket(item.bucket);
    const descDecision = fieldDecisions.description?.decision;
    const introDecision = fieldDecisions.intro_prefix?.decision;

    const canApplyDescription = descDecision === "continue" || descDecision === "limited_continue";

    if (canApplyDescription) {
      const safe = item.safeApply || {};
      const newDesc = safe.description;
      if (typeof newDesc === "string" && newDesc.trim() && newDesc.trim() !== String(data.description || "").trim()) {
        nextData.description = newDesc.trim();
        changes.push("description");
        policyReasonsByField.description = fieldDecisions.description?.reason || "policy_reason_missing";
      }
    }

    if (args.includeIntro) {
      const plat = slug.startsWith("youtube-") ? "YouTube" : slug.startsWith("instagram-") ? "Instagram" : "TikTok";
      const prefix = `Practical, copy-ready ${plat} ideas below — use the linked generator to adapt lines to your niche.`;
      const marker = "<!-- v112-intro -->";
      const canApplyIntro = introDecision === "limited_continue" || introDecision === "continue";
      if (
        canApplyIntro &&
        introAppliedCount < (policy.batchLimits.maxIntroPrefixPerBatch ?? 2) &&
        !content.includes(marker) &&
        (item.current?.introWordCount ?? 0) < 45
      ) {
        nextContent = `${marker}\n\n${prefix}\n\n${content}`;
        changes.push("intro_prefix");
        policyReasonsByField.intro_prefix = fieldDecisions.intro_prefix?.reason || "policy_reason_missing";
        introAppliedCount++;
      }
    }

    if (changes.length === 0) {
      console.log(`[noop] ${slug} — no safe field changes (already aligned or empty diff)`);
      continue;
    }

    // Per-bucket caps (traceable safe rollout discipline)
    const bucket = item.bucket;
    if (bucketApplied[bucket] >= (bucketCaps[bucket] ?? 0)) {
      console.log(`[skip] ${slug} — bucket cap reached for ${bucket}`);
      continue;
    }

    const outStr = matter.stringify(nextContent, nextData);
    const preview = `[${slug}] ${changes.join("+")}`;

    if (dry) {
      console.log(`[dry-run] would write ${filePath} (${preview})`);
      applied++;
      continue;
    }

    const res = sanitizeAndValidateMdxForWrite({
      mdxString: outStr,
      filePath,
      slug,
      failureKind: "en_blog_optimization_mdx_compile_check"
    });
    if (!res.ok) {
      console.warn(`[mdx-safety] skip write (compile failed): ${slug}`);
      continue;
    }

    fs.writeFileSync(filePath, res.sanitizedMdx, "utf8");
    const optimizedAt = new Date().toISOString();
    appendHistory({
      at: optimizedAt,
      slug,
      file: path.relative(process.cwd(), filePath),
      changes,
      bucket: item.bucket,
      ctr: item.ctr,
      policyVersion: rolloutStatus.policyVersion,
      policyReasonsByField,
      rolloutDecision: rolloutStatus.rollout?.overall?.decision ?? null
    });
    registryBatch.push({
      entryId: `${slug}@${optimizedAt}`,
      slug,
      path: `/blog/${slug}`,
      bucketAtOptimization: item.bucket,
      optimizedAt,
      fieldsChanged: changes,
      previous: {
        title: data.title ?? null,
        description: data.description ?? null,
        intro: String(content).slice(0, 1200)
      },
      new: {
        title: nextData.title ?? null,
        description: nextData.description ?? null,
        intro: String(nextContent).slice(0, 1200)
      },
      priorityReason: item.priorityReason ?? null,
      policyVersion: rolloutStatus.policyVersion,
      policyReasonsByField,
      sourceRecommendationRef: {
        file: "generated/page-optimization-recommendations.json",
        recommendationsUpdatedAt: doc.updatedAt ?? null
      }
    });
    console.log(`[write] ${preview}`);
    applied++;
    bucketApplied[item.bucket] = (bucketApplied[item.bucket] ?? 0) + 1;
  }

  if (!dry && registryBatch.length) {
    appendEntries(registryBatch);
    console.log(`[V113] registry +${registryBatch.length} → generated/page-optimization-registry.json`);
    const cohort = registerCohortFromWriteBatch(registryBatch, registryBatch.length);
    if (cohort) {
      console.log(`[V117] cohort created: ${cohort.cohortId} (${cohort.slugs.length} slug(s))`);
    }
  }

  console.log(`Done. ${dry ? "Dry-run" : "Wrote"} ${applied} file(s). History: ${HISTORY}`);
}

main();
