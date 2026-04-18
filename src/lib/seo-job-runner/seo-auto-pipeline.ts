import fs from "node:fs/promises";
import path from "node:path";
import { generateSeoDraftsFromPreflight } from "@/lib/seo-draft-generation";
import { fetchNeedsRewriteRetryDrafts } from "@/lib/seo-draft-generation/fetch-needs-rewrite-retries";
import { readRecycleRetryState } from "@/lib/seo-draft-generation/recycle-retry-state";
import { isAllowedGenerationTitle } from "@/lib/seo-draft-generation/draft-publish-gate";
import {
  fetchSeoArticlesCorpus,
  filterCorpusForHistoricalTopicExclusion,
  runGapAwareTopicEngine
} from "@/lib/seo/gap-topic-engine";
import {
  buildTopicKeySetFromPublishedTitles,
  buildUsedTopicKeySetFromLedger,
  readSeoHistoryLedger
} from "@/lib/seo-draft-generation/seo-history-ledger";
import {
  runSeoPreflightJob,
  type SeoPreflightCandidateResult,
  type SeoPreflightConfig,
  type SeoPreflightContentType
} from "@/lib/seo-preflight";
import {
  getTitlePattern,
  scoreSeoPerformanceFeedback,
  type SeoPublishedPerformanceInput
} from "@/lib/seo/performance-feedback";
import { scoreSeoPublishPriority } from "@/lib/seo/publish-priority";
import {
  buildSemanticSet,
  isSemanticDuplicate,
  normalizeSemanticKey
} from "@/lib/seo/topic-dedup";
import { scheduleSeoArticlesForPublish } from "@/lib/seo/scheduled-publish";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SeoAutomationJobStepLog } from "./types";

const PIPELINE_DAILY_SCHEDULE_CAP = 5;
const MIN_PUBLISH_PRIORITY_SCORE = 45;

/** Schedule gate: title must look high-intent and concrete before entering publish queue. */
export function isHighValueSeoTitle(title: string): boolean {
  const raw = (title || "").trim();
  if (!raw) return false;

  if (/how to improve fix/i.test(raw)) return false;

  const lower = raw.toLowerCase();
  if (
    !/\bhow to\b/.test(lower) &&
    !/\bbest\b/.test(lower) &&
    !/\bvs\b/.test(lower) &&
    !/\bexamples?\b/.test(lower) &&
    !/\bcompared\b/.test(lower)
  ) {
    return false;
  }

  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;

  if (
    !/\bblog\b/i.test(raw) &&
    !/\bemail\b/i.test(raw) &&
    !/\bcopy\b/i.test(raw) &&
    !/\bai\b/i.test(raw) &&
    !/\bcontent\b/i.test(raw) &&
    !/\bmarketing\b/i.test(raw)
  ) {
    return false;
  }

  if (lower.includes("that works well")) return false;
  if (/\bstrategy\b/i.test(raw)) return false;
  if (/\bplaybook\b/i.test(raw)) return false;
  if (/\bsystem\b/i.test(raw)) return false;
  if (/\bguide$/i.test(raw.trim())) return false;

  return true;
}

export function normalizeTopicKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\bhow to\b/g, "")
    .replace(/\bbest\b/g, "")
    .replace(/\bexamples?\b/g, "")
    .replace(/\bcompared\b/g, "")
    .replace(/\bvs\b/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildUsedTopicSet(items: Array<{ title?: string; slug?: string }>): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    const title = item.title || "";
    if (!title.trim()) continue;
    const key = normalizeTopicKey(title);
    if (key) set.add(key);
  }
  return set;
}

const AUTO_RUN_LOG = path.join("generated", "seo-auto-run-last-run.json");

function push(steps: SeoAutomationJobStepLog[], name: string, ok: boolean, detail?: string) {
  steps.push({ name, ok, detail });
}

export type SeoAutoPipelinePublishSchedule = {
  enabled: boolean;
  dailyMax: number;
  articleIdsRequested: string[];
  scheduled: { articleId: string; publishScheduledAt: string }[];
  skipped: string[];
};

export type SeoAutoPipelineResult = {
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  wanted: number;
  /** Keywords produced by gap engine (no padding; may be &lt; wanted). */
  planned: number;
  approved: number;
  /** Rows returned from draft generation (includes failures). */
  generated: number;
  /** Drafts successfully inserted as `seo_articles` status=draft. */
  queued: number;
  /** Drafts that passed quality and were moved to `scheduled` with `publish_scheduled_at` (subset of queued when scheduling on). */
  scheduledForPublish: number;
  steps: SeoAutomationJobStepLog[];
  stopReason?:
    | "no_planned_keywords"
    | "no_candidates_after_dedupe"
    | "no_approved"
    | "no_title_gate_pass"
    | "no_high_value_titles"
    | "completed";
  error?: string;
  preflight?: Awaited<ReturnType<typeof runSeoPreflightJob>>;
  drafts?: Awaited<ReturnType<typeof generateSeoDraftsFromPreflight>>;
  /** QA recycle buckets for non-`publish_ready` drafts (also in `drafts.rows[].recycle_class`). */
  recycleStats?: {
    needs_rewrite: number;
    needs_split: number;
    rejected_archive: number;
  };
  /** `needs_rewrite` drafts queued for one regeneration attempt before gap seeds (same run). */
  recycleRetriesQueued?: number;
  publishSchedule?: SeoAutoPipelinePublishSchedule;
};

export type RunSeoAutoPipelineInput = {
  wanted: number;
  repoRoot?: string;
  market: string;
  locale: string;
  contentLanguage: string;
  contentType: SeoPreflightContentType;
  site?: string;
  draftMode?: boolean;
  maxEstimatedCost?: number;
  jaccardThreshold?: number;
  /** When true (default), quality-passing new drafts enter staggered `scheduled` queue. */
  schedulePublish?: boolean;
  /** Max schedules per UTC day (clamped 3–5). */
  publishDailyMax?: number;
};

/**
 * Gap detection → preflight (seedsOnly) → draft generation → DB draft → optional staggered `scheduled` publish queue.
 */
export async function runSeoAutoPipeline(input: RunSeoAutoPipelineInput): Promise<SeoAutoPipelineResult> {
  const root = input.repoRoot ?? process.cwd();
  const wanted = Math.max(1, Math.min(500, Math.floor(input.wanted)));
  const steps: SeoAutomationJobStepLog[] = [];
  const startedAt = new Date().toISOString();

  const result: SeoAutoPipelineResult = {
    startedAt,
    finishedAt: startedAt,
    ok: true,
    wanted,
    planned: 0,
    approved: 0,
    generated: 0,
    queued: 0,
    scheduledForPublish: 0,
    steps
  };

  try {
    const db = createAdminClient();
    const articles = await fetchSeoArticlesCorpus(db);
    push(steps, "load_corpus", true, `articles=${articles.length}`);
    console.log("[seo-auto-pipeline] planned_stage=load_corpus articles=%d", articles.length);

    const exclusionCorpus = filterCorpusForHistoricalTopicExclusion(articles);
    const usedTopicSet = buildUsedTopicSet(exclusionCorpus);
    console.log("[SEO PIPELINE] used topics:", usedTopicSet.size);

    const historyLedger = readSeoHistoryLedger(root);
    const fallbackToCorpus = historyLedger.items.length === 0;
    const ledgerTopicKeys = fallbackToCorpus
      ? buildTopicKeySetFromPublishedTitles(
          articles.filter((a) => String(a.status || "").toLowerCase() === "published")
        )
      : buildUsedTopicKeySetFromLedger(historyLedger);

    console.log("[SEO HISTORY LEDGER] loaded:", historyLedger.items.length);
    console.log("[SEO HISTORY LEDGER] published_ready_count:", historyLedger.items.length);
    console.log("[SEO HISTORY LEDGER] fallback_to_corpus:", fallbackToCorpus);

    const historyTitlesForSemantic = [
      ...historyLedger.items.map((x) => ({ title: x.title })),
      ...articles
        .filter((a) => String(a.status || "").toLowerCase() === "published")
        .map((a) => ({ title: a.title }))
    ];
    const semanticSet = buildSemanticSet(historyTitlesForSemantic);

    const retriedState = await readRecycleRetryState(root);
    const recycleRetryRows = await fetchNeedsRewriteRetryDrafts(
      db,
      retriedState,
      {
        market: input.market,
        locale: input.locale,
        contentLanguage: input.contentLanguage,
        contentType: input.contentType
      },
      wanted
    );
    result.recycleRetriesQueued = recycleRetryRows.length;
    const recycleArticleIds = new Set(
      recycleRetryRows.map((r) => r.existingArticleId).filter((id): id is string => Boolean(id))
    );
    console.log("[SEO RECYCLE] queued:", recycleRetryRows.length);
    if (recycleRetryRows.length > 0) {
      push(steps, "recycle_retry", true, `needs_rewrite=${recycleRetryRows.length}`);
    }

    const plan = runGapAwareTopicEngine({
      wanted,
      articles,
      jaccardThreshold: input.jaccardThreshold
    });
    result.planned = plan.keywords.length;
    push(
      steps,
      "gap_plan",
      true,
      `planned=${result.planned} wanted=${wanted} pillars=${plan.coverage.length}`
    );
    console.log(
      "[seo-auto-pipeline] planned_stage=gap keywords=%d wanted=%d pillars=%d",
      result.planned,
      wanted,
      plan.coverage.length
    );

    if (result.planned === 0 && recycleRetryRows.length === 0) {
      result.ok = false;
      result.stopReason = "no_planned_keywords";
      push(steps, "abort", false, "no_planned_keywords");
      console.log("[seo-auto-pipeline] stop=no_planned_keywords");
      result.finishedAt = new Date().toISOString();
      await writeAutoRunLog(root, result);
      return result;
    }

    const dedupedPreflightRows = plan.preflightCandidateRows.filter((row) => {
      const key = normalizeTopicKey(row.topic || "");
      if (!key) return false;
      if (usedTopicSet.has(key)) return false;
      if (ledgerTopicKeys.has(key)) return false;
      return true;
    });
    console.log("[SEO PIPELINE] after historical dedupe:", dedupedPreflightRows.length);
    push(
      steps,
      "historical_dedupe",
      true,
      `candidates=${dedupedPreflightRows.length} raw=${plan.preflightCandidateRows.length}`
    );

    const dedupTopicsBeforeSemantic = dedupedPreflightRows.length;
    const semanticPreflightRows = dedupedPreflightRows.filter(
      (row) => !isSemanticDuplicate(row.topic || "", semanticSet)
    );
    console.log("[SEO DEDUP] before topics:", dedupTopicsBeforeSemantic);
    console.log("[SEO DEDUP] after topics:", semanticPreflightRows.length);

    if (dedupedPreflightRows.length === 0 && recycleRetryRows.length === 0) {
      result.ok = false;
      result.stopReason = "no_candidates_after_dedupe";
      push(steps, "abort", false, "no_candidates_after_dedupe");
      result.finishedAt = new Date().toISOString();
      await writeAutoRunLog(root, result);
      return result;
    }

    if (semanticPreflightRows.length === 0 && recycleRetryRows.length === 0) {
      result.ok = false;
      result.stopReason = "no_candidates_after_dedupe";
      push(steps, "abort", false, "no_candidates_after_semantic_dedupe");
      result.finishedAt = new Date().toISOString();
      await writeAutoRunLog(root, result);
      return result;
    }

    let preflightApprovedRows: SeoPreflightCandidateResult[] = [];

    if (semanticPreflightRows.length > 0) {
      const preflightConfig: SeoPreflightConfig = {
        targetCount: semanticPreflightRows.length,
        market: input.market,
        locale: input.locale,
        contentLanguage: input.contentLanguage,
        contentType: input.contentType,
        site: input.site,
        draftMode: input.draftMode,
        maxEstimatedCost: input.maxEstimatedCost
      };

      const preflight = await runSeoPreflightJob(preflightConfig, {
        repoRoot: root,
        candidateSeedRows: semanticPreflightRows,
        seedsOnly: true,
        persistLog: true
      });
      result.preflight = preflight;
      preflightApprovedRows = preflight.approved.filter((r) => r.approved);
      result.approved = preflightApprovedRows.length;
      push(
        steps,
        "preflight",
        true,
        `approved=${result.approved} seen=${preflight.candidatesSeen} target=${preflight.targetCount}`
      );
      console.log(
        "[seo-auto-pipeline] approved_stage=preflight approved=%d seen=%d target=%d",
        result.approved,
        preflight.candidatesSeen,
        preflight.targetCount
      );
    } else {
      result.approved = 0;
      push(steps, "preflight", true, "skipped:no_gap_seeds_recycle_only");
      console.log("[seo-auto-pipeline] preflight skipped (recycle-only run)");
    }

    if (preflightApprovedRows.length === 0 && recycleRetryRows.length === 0) {
      result.stopReason = "no_approved";
      push(steps, "stop", true, "no_approved_skip_drafts");
      console.log("[seo-auto-pipeline] stop=no_approved_skip_drafts");
      result.finishedAt = new Date().toISOString();
      await writeAutoRunLog(root, result);
      return result;
    }

    const gateRows = preflightApprovedRows.filter((r) => isAllowedGenerationTitle(r.title));
    const combinedApproved = [...recycleRetryRows, ...gateRows];
    push(
      steps,
      "title_gate",
      true,
      `allowed=${combinedApproved.length} recycle=${recycleRetryRows.length} preflight_ok=${gateRows.length}/${preflightApprovedRows.length}`
    );

    if (combinedApproved.length === 0) {
      result.stopReason = "no_title_gate_pass";
      push(steps, "stop", true, "no_title_gate_pass");
      result.finishedAt = new Date().toISOString();
      await writeAutoRunLog(root, result);
      return result;
    }

    const drafts = await generateSeoDraftsFromPreflight(combinedApproved, {
      repoRoot: root,
      persistLog: true,
      source: "gap_auto_pipeline",
      corpus: articles,
      historyLedger
    });
    result.drafts = drafts;
    result.generated = drafts.rows.length;
    const savedCount = drafts.rows.filter((r) => r.savedAsDraft).length;
    console.log("[SEO PIPELINE] after generation:", savedCount);

    const rejectedForRecycle = drafts.rows.filter((d) => d.review_status !== "publish_ready");
    result.recycleStats = {
      needs_rewrite: rejectedForRecycle.filter((d) => d.recycle_class === "needs_rewrite").length,
      needs_split: rejectedForRecycle.filter((d) => d.recycle_class === "needs_split").length,
      rejected_archive: rejectedForRecycle.filter((d) => d.recycle_class === "rejected_archive").length
    };
    console.log("[SEO RECYCLE] stats:", result.recycleStats);
    const promotedToPublishReady = drafts.rows.filter(
      (d) => Boolean(d.articleId && recycleArticleIds.has(d.articleId) && d.review_status === "publish_ready")
    ).length;
    console.log("[SEO RECYCLE] promoted_to_publish_ready:", promotedToPublishReady);

    let publishReadyDrafts = drafts.rows.filter((d) => d.review_status === "publish_ready");
    publishReadyDrafts = publishReadyDrafts.filter((d) => !isSemanticDuplicate(d.title, semanticSet));
    console.log("[SEO DEDUP] publish filtered:", publishReadyDrafts.length);

    const highValueDrafts = publishReadyDrafts.filter((d) => isHighValueSeoTitle(d.title || ""));
    const noHighValueStop = publishReadyDrafts.length > 0 && highValueDrafts.length === 0;
    console.log(
      "[SEO PIPELINE] high_value_titles:",
      highValueDrafts.length,
      "/",
      publishReadyDrafts.length
    );

    const publishReadyRows = highValueDrafts.filter((r) => r.savedAsDraft && r.articleId);
    const needsRevisionRows = drafts.rows.filter(
      (r) => r.savedAsDraft && r.articleId && r.review_status === "needs_revision"
    );
    const rejectedRows = drafts.rows.filter((r) => r.review_status === "rejected");
    const rejectedCount = rejectedRows.length;
    console.log("[SEO DROP] rejected:", rejectedCount);

    console.log("[SEO QA] generated:", drafts.rows.length);
    console.log("[SEO QA] publish_ready:", publishReadyDrafts.length);
    console.log("[SEO QA] high_value_schedule_eligible:", highValueDrafts.length);
    console.log("[SEO QA] needs_revision:", needsRevisionRows.length);
    console.log("[SEO QA] rejected:", rejectedCount);
    if (rejectedRows.length > 0) {
      console.log(
        "[SEO QA] rejected_reasons:",
        rejectedRows.slice(0, 10).map((d) => ({ title: d.title, reasons: d.quality_reasons }))
      );
    }

    const dmRaw = input.publishDailyMax;
    const dailyMax = Math.max(3, Math.min(5, Number.isFinite(dmRaw) ? Number(dmRaw) : 5));

    const scoredDrafts = publishReadyRows.map((d) => {
      const priority = scoreSeoPublishPriority({
        title: d.title,
        review_status: d.review_status
      });
      return {
        ...d,
        publish_priority_score: priority.score,
        publish_priority_reasons: priority.reasons
      };
    });

    const sortedDrafts = [...scoredDrafts].sort(
      (a, b) => b.publish_priority_score - a.publish_priority_score
    );

    const historyPerformanceItems: SeoPublishedPerformanceInput[] = [];
    const seenHistoryTitles = new Set<string>();
    const addHistoryPerformance = (title: string, slug?: string) => {
      const t = (title || "").trim();
      if (!t) return;
      const lk = t.toLowerCase();
      if (seenHistoryTitles.has(lk)) return;
      seenHistoryTitles.add(lk);
      const pr = scoreSeoPublishPriority({ title: t, review_status: "publish_ready" });
      historyPerformanceItems.push({
        title: t,
        slug,
        review_status: "publish_ready",
        publish_priority_score: pr.score
      });
    };

    if (fallbackToCorpus) {
      for (const row of articles) {
        if (String(row.status || "").toLowerCase() !== "published") continue;
        addHistoryPerformance(row.title, row.slug);
      }
    } else {
      for (const it of historyLedger.items) {
        addHistoryPerformance(it.title, it.slug);
      }
    }

    const feedbackMap = scoreSeoPerformanceFeedback(historyPerformanceItems);

    const rescoredDrafts = sortedDrafts.map((d) => {
      const key = getTitlePattern(d.title || "");
      const feedback = feedbackMap[key];
      const extra = feedback?.feedbackScore ?? 0;
      const reasons = feedback?.reasons ?? [];
      return {
        ...d,
        publish_priority_score: d.publish_priority_score + extra,
        publish_priority_reasons: [...(d.publish_priority_reasons || []), ...reasons]
      };
    });

    const sortedAfterFeedback = [...rescoredDrafts].sort(
      (a, b) => b.publish_priority_score - a.publish_priority_score
    );

    console.log("[SEO FEEDBACK] map:", feedbackMap);
    console.log(
      "[SEO FEEDBACK] top drafts after feedback:",
      sortedAfterFeedback.slice(0, 10).map((d) => ({
        title: d.title,
        score: d.publish_priority_score,
        reasons: d.publish_priority_reasons
      }))
    );

    const strongDrafts = sortedAfterFeedback.filter(
      (d) => d.publish_priority_score >= MIN_PUBLISH_PRIORITY_SCORE
    );

    const scheduleCap = Math.min(dailyMax, PIPELINE_DAILY_SCHEDULE_CAP);
    const draftsToSchedule: typeof strongDrafts = [];
    for (const d of strongDrafts) {
      if (draftsToSchedule.length >= scheduleCap) break;
      if (isSemanticDuplicate(d.title, semanticSet)) continue;
      draftsToSchedule.push(d);
      const sk = normalizeSemanticKey(d.title);
      if (sk) semanticSet.add(sk);
    }

    console.log(
      "[SEO PRIORITY] top drafts (before feedback):",
      sortedDrafts.slice(0, 10).map((d) => ({
        title: d.title,
        score: d.publish_priority_score,
        reasons: d.publish_priority_reasons
      }))
    );
    console.log("[SEO PRIORITY] ready:", publishReadyDrafts.length);
    console.log("[SEO PRIORITY] strong:", strongDrafts.length);
    console.log("[SEO PRIORITY] scheduled:", draftsToSchedule.length);
    const scheduledAfterRetry = draftsToSchedule.filter(
      (d) => Boolean(d.articleId && recycleArticleIds.has(d.articleId))
    ).length;
    console.log("[SEO RECYCLE] scheduled_after_retry:", scheduledAfterRetry);

    console.log(
      "[SEO PIPELINE] drafts saved:",
      savedCount,
      "publish_ready+needs_revision:",
      publishReadyRows.length + needsRevisionRows.length
    );

    const publishReadyIds: string[] = draftsToSchedule
      .map((r) => r.articleId)
      .filter((id): id is string => Boolean(id));
    console.log("[SEO PIPELINE] publish-ready (schedule after priority):", publishReadyIds.length);

    result.queued = savedCount;
    push(
      steps,
      "draft_generation",
      true,
      `generated=${result.generated} saved=${savedCount} publish_ready=${publishReadyDrafts.length} high_value=${highValueDrafts.length} needs_revision=${needsRevisionRows.length} priority_strong=${strongDrafts.length} schedule_eligible=${publishReadyIds.length}`
    );
    if (noHighValueStop) {
      result.ok = false;
      result.stopReason = "no_high_value_titles";
      push(
        steps,
        "high_value_title_gate",
        false,
        `publish_ready=${publishReadyDrafts.length} high_value=0`
      );
      console.log("[seo-auto-pipeline] stop=no_high_value_titles");
    } else {
      result.stopReason = "completed";
    }
    console.log(
      "[seo-auto-pipeline] queued_stage=drafts generated=%d saved=%d publish_ready_schedule=%d",
      result.generated,
      savedCount,
      publishReadyIds.length
    );

    const scheduleOn = input.schedulePublish !== false;
    const cappedScheduleIds = publishReadyIds;
    console.log("[SEO PIPELINE] schedule cap:", cappedScheduleIds.length, "dailyMax=", dailyMax);

    if (!scheduleOn) {
      result.publishSchedule = {
        enabled: false,
        dailyMax,
        articleIdsRequested: cappedScheduleIds,
        scheduled: [],
        skipped: []
      };
      push(steps, "publish_schedule", true, "skipped:disabled");
    } else if (cappedScheduleIds.length === 0) {
      result.publishSchedule = {
        enabled: true,
        dailyMax,
        articleIdsRequested: [],
        scheduled: [],
        skipped: []
      };
      push(
        steps,
        "publish_schedule",
        true,
        noHighValueStop
          ? "skipped:no_high_value_titles"
          : publishReadyRows.length === 0
            ? "skipped:no_publish_ready"
            : "skipped:no_priority_pass"
      );
    } else {
      const { scheduled, skipped } = await scheduleSeoArticlesForPublish(db, cappedScheduleIds, {
        dailyMax,
        source: "seo_auto_run"
      });
      result.scheduledForPublish = scheduled.length;
      result.publishSchedule = {
        enabled: true,
        dailyMax,
        articleIdsRequested: cappedScheduleIds,
        scheduled: scheduled.map((s) => ({ articleId: s.articleId, publishScheduledAt: s.publishScheduledAt })),
        skipped
      };
      push(
        steps,
        "publish_schedule",
        true,
        `scheduled=${scheduled.length} skipped=${skipped.length} dailyMax=${dailyMax} cap=${PIPELINE_DAILY_SCHEDULE_CAP}`
      );
      console.log(
        "[seo-auto-pipeline] publish_schedule scheduled=%d skipped=%d",
        scheduled.length,
        skipped.length
      );
    }
  } catch (e) {
    result.ok = false;
    result.error = e instanceof Error ? e.message : String(e);
    push(steps, "error", false, result.error);
    console.error("[seo-auto-pipeline] error", result.error);
  }

  result.finishedAt = new Date().toISOString();
  await writeAutoRunLog(root, result);
  return result;
}

async function writeAutoRunLog(repoRoot: string, result: SeoAutoPipelineResult): Promise<void> {
  const p = path.join(repoRoot, AUTO_RUN_LOG);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}

export function seoAutoRunLogRelativePath(): string {
  return AUTO_RUN_LOG;
}
