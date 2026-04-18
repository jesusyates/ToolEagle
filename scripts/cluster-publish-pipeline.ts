/**
 * Cluster → topic → article → publish + priority state (CLI, scheduler, daily-engine).
 */

import crypto from "node:crypto";
import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { rebuildToSeoArticle } from "../src/lib/seo/rebuild-article";
import { evaluatePreStagedQualityGate } from "../src/lib/seo/pre-staged-quality-gate";
import { composeStagedGuide, STAGED_GUIDES_DIR } from "../src/lib/auto-posts";
import { auditPublishedGuideMarkdown } from "../src/lib/seo/published-guide-audit";
import {
  generateTopicClusters,
  MIN_FILES_PER_RUN,
  recordClusterRunOutcome,
  rewriteMainlineTopicTitleForDedupV1,
  rewriteMainlineTopicTitleForDedupV2
} from "../src/lib/seo/topic-engine";
import { evaluateClusterReadiness } from "../src/lib/seo/cluster-gate";
import { evaluatePublishReadiness } from "../src/lib/seo/publish-gate";
import { evaluateEnContentLanguage } from "../src/lib/seo/language-gate";
import {
  evaluateTopicReadiness,
  shouldPreDropTopicBeforeModel
} from "../src/lib/seo/topic-gate";
import { describeEnAssetIndexHit, loadContentAssetIndexEntries } from "../src/lib/seo/content-asset-index";
import { getAllAutoPosts, getAllStagedPosts, getStagedGuideCount } from "../src/lib/auto-posts-reader";
import type { ClusterPriorityMeta } from "../src/lib/seo/cluster-priority";

/** Stable SHA-256 of markdown body text (matches gray-matter `content` after trim). */
function hashStagedGuideBody(body: string): string {
  const n = String(body ?? "").replace(/\r\n/g, "\n").trim();
  return crypto.createHash("sha256").update(n, "utf8").digest("hex");
}

function normalizeTopicKey(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Adds normalized title + optional stripped guide suffix for topic-pool matching. */
function addTopicKeyVariants(raw: string, set: Set<string>): void {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return;
  set.add(normalizeTopicKey(t));
  const stripped = t.replace(/:\s*a practical guide\s*$/i, "").trim();
  if (stripped) set.add(normalizeTopicKey(stripped));
}

export const CLUSTER_PUBLISH_LAST_RUN_JSON = path.join(
  process.cwd(),
  "generated",
  "cluster-publish-last-run.json"
);

export const CLUSTER_PUBLISH_DAILY_STATUS_JSON = path.join(
  process.cwd(),
  "generated",
  "cluster-publish-daily-status.json"
);

/** Single health file for EN guides auto-publish (daily-engine + operators). */
export const SEO_GUIDES_PUBLISH_HEALTH_JSON = path.join(
  process.cwd(),
  "generated",
  "seo-guides-publish-health.json"
);

/** Machine-readable run health for automation / dashboards (minimal fields). */
export const CLUSTER_PUBLISH_RUN_HEALTH_JSON = path.join(
  process.cwd(),
  "generated",
  "cluster-publish-run-health.json"
);

/** Last healthy mainline-dominant snapshot for regression comparison (updated only when healthy). */
export const CLUSTER_PUBLISH_BASELINE_JSON = path.join(
  process.cwd(),
  "generated",
  "cluster-publish-baseline.json"
);

/** Rolling same-calendar-day (UTC) totals for cluster-publish runs. */
export const CLUSTER_PUBLISH_DAILY_SUMMARY_JSON = path.join(
  process.cwd(),
  "generated",
  "cluster-publish-daily-summary.json"
);

export type SeoGuidesPublishHealth = {
  runAt: string;
  success: boolean;
  clustersGenerated: number;
  topicsPassed: number;
  /** Items written to staged-guides this run (passed gates). */
  articlesPassed: number;
  articlesPassedByCluster: Record<string, number>;
  fallbackUsed: boolean;
  publishErrors: string[];
  error: string | null;
  source: string;
  stagedCount?: number;
  remainingStagedCount?: number;
  publishedCountThisRun?: number;
  publishedFiles?: string[];
  languageGatePassed?: number;
  languageGateFailedCount?: number;
  finalAuditPassed?: number;
  finalAuditFailed?: number;
  finalAuditFailedReasonsTop?: Record<string, number>;
  retryCount?: number;
  topicPreDedupDropped?: number;
  /** 当前加载的英文资产索引条数（来自 generated/content-asset-index-en.json）。 */
  assetIndexEntries?: number;
  preIndexDedupDropped?: number;
  inventoryLow?: boolean;
  forcedSuccessTarget?: number;
  attemptsUsed?: number;
  minStagedTarget?: number;
  /** 本轮实际新增 staged 文件数（以目录增量为准）。 */
  stagedFilesWrittenThisRun?: number;
  /** 本轮发布脚本写入 sent-guides 数（generate 阶段恒为 0）。 */
  publishedFilesWrittenThisRun?: number;
  minFilesWrittenPerRun?: number;
  fileThroughputSatisfied?: boolean;
  throughputFailureReason?: string | null;
  preDedupThresholdEn?: number;
  publishGateThresholdEn?: number;
  fallbackReleaseUsed?: boolean;
  fallbackReleaseTopic?: string | null;
  mainlineWritten?: number;
  fallbackWritten?: number;
  runHealth?: "healthy" | "degraded" | "blocked";
  runHealthReason?: string;
};

export type ClusterPublishRunResult = {
  runAt: string;
  clustersGenerated: number;
  clustersPassed: number;
  topicsGenerated: number;
  topicsPassed: number;
  articlesPassed: number;
  topicsPassedByContentType: { guide: number; ideas: number };
  articlesPassedByContentType: { guide: number; ideas: number };
  articlesPassedByCluster: Record<string, number>;
  priorityChoices: Array<{ cluster: string; score: number; reason: string }>;
  skippedClusters: Array<{
    cluster: string;
    decision: string;
    score: number;
    reasons: string[];
  }>;
  languageGatePassed: number;
  languageGateFailedCount: number;
  finalAuditPassed: number;
  finalAuditFailed: number;
  finalAuditFailedReasonsTop: Record<string, number>;
  retryCount: number;
  topicPreDedupDropped: number;
  preIndexDedupDropped: number;
  inventoryLow: boolean;
  forcedSuccessTarget: number;
  attemptsUsed: number;
  minStagedTarget: number;
  stagedFilesWrittenThisRun: number;
  publishedFilesWrittenThisRun: number;
  minFilesWrittenPerRun: number;
  fileThroughputSatisfied: boolean;
  throughputFailureReason: string | null;
  /** Staged files from cluster mainline path (not SEO fallback pool / not fallback-release). */
  mainlineWritten?: number;
  /** Staged files from SEO fallback pool or fallback-release staging. */
  fallbackWritten?: number;
  runHealth?: "healthy" | "degraded" | "blocked";
  runHealthReason?: string;
};

/** Last-run + daily-engine observability (always written when the pipeline runs). */
export type ClusterPublishLastRunFile = ClusterPublishRunResult & {
  success: boolean;
  failed: boolean;
  error: string | null;
  source: string;
};

type SkippedCluster = ClusterPublishRunResult["skippedClusters"][number];

function emptyMetrics(runAt: string): ClusterPublishRunResult {
  return {
    runAt,
    clustersGenerated: 0,
    clustersPassed: 0,
    topicsGenerated: 0,
    topicsPassed: 0,
    articlesPassed: 0,
    topicsPassedByContentType: { guide: 0, ideas: 0 },
    articlesPassedByContentType: { guide: 0, ideas: 0 },
    articlesPassedByCluster: {},
    priorityChoices: [],
    skippedClusters: [],
    languageGatePassed: 0,
    languageGateFailedCount: 0,
    finalAuditPassed: 0,
    finalAuditFailed: 0,
    finalAuditFailedReasonsTop: {},
    retryCount: 0,
    topicPreDedupDropped: 0,
    preIndexDedupDropped: 0,
    inventoryLow: false,
    forcedSuccessTarget: 1,
    attemptsUsed: 0,
    minStagedTarget: 10,
    stagedFilesWrittenThisRun: 0,
    publishedFilesWrittenThisRun: 0,
    minFilesWrittenPerRun: 1,
    fileThroughputSatisfied: false,
    throughputFailureReason: null,
    mainlineWritten: 0,
    fallbackWritten: 0,
    runHealth: "blocked",
    runHealthReason: "no_files_written"
  };
}

function topFailedReasons(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15));
}

/** Minimal run health: mainline vs fallback dominance and throughput (no external config). */
export function computeClusterPublishRunHealth(input: {
  stagedFilesWrittenThisRun: number;
  mainlineWritten: number;
  fallbackWritten: number;
  clustersPassed: number;
}): { runHealth: "healthy" | "degraded" | "blocked"; runHealthReason: string } {
  const s = input.stagedFilesWrittenThisRun;
  const m = input.mainlineWritten;
  const f = input.fallbackWritten;
  const c = input.clustersPassed;
  if (c === 0) {
    return { runHealth: "blocked", runHealthReason: "no_clusters_passed" };
  }
  if (s === 0) {
    return { runHealth: "blocked", runHealthReason: "no_files_written" };
  }
  if (s >= 3 && m >= 2 && m > f) {
    return { runHealth: "healthy", runHealthReason: "mainline_dominant" };
  }
  if (f >= m && f > 0) {
    return { runHealth: "degraded", runHealthReason: "fallback_dominant" };
  }
  return { runHealth: "degraded", runHealthReason: "low_mainline_yield" };
}

/** Observability only: aggregate blocker counts for duplicate-style softpass vs gate rejections. */
function computeSupplyPressureFromBlockers(counts: Record<string, number>): {
  duplicatePressure: number;
  gatePressure: number;
} {
  let duplicatePressure = 0;
  let gatePressure = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (
      k.startsWith("pre_dedup_softpass:") ||
      k.startsWith("topic_gate_softpass:") ||
      k.startsWith("publish_gate_softpass:")
    ) {
      duplicatePressure += v;
    } else if (k.startsWith("cluster_gate:")) {
      gatePressure += v;
    } else if (k.startsWith("topic_gate:") && !k.startsWith("topic_gate_softpass:")) {
      gatePressure += v;
    } else if (k.startsWith("publish_gate:") && !k.startsWith("publish_gate_softpass:")) {
      gatePressure += v;
    } else if (k.startsWith("final_audit:")) {
      const sub = k.slice("final_audit:".length).toLowerCase();
      if (/duplicate|body_template|repetitive|similar|jaccard|title_near/.test(sub)) duplicatePressure += v;
      else gatePressure += v;
    }
  }
  return { duplicatePressure, gatePressure };
}

function writeClusterPublishDailySummary(opts: {
  runAt: string;
  stagedFilesWrittenThisRun: number;
  mainlineWritten: number;
  fallbackWritten: number;
  runHealth: "healthy" | "degraded" | "blocked";
}): void {
  const day = opts.runAt.slice(0, 10);
  type Row = {
    date: string;
    runsCount: number;
    totalStagedFilesWritten: number;
    totalMainlineWritten: number;
    totalFallbackWritten: number;
    healthyRuns: number;
    degradedRuns: number;
    blockedRuns: number;
    latestRunHealth: "healthy" | "degraded" | "blocked";
  };
  let prev: Row | null = null;
  try {
    if (fs.existsSync(CLUSTER_PUBLISH_DAILY_SUMMARY_JSON)) {
      prev = JSON.parse(fs.readFileSync(CLUSTER_PUBLISH_DAILY_SUMMARY_JSON, "utf8")) as Row;
    }
  } catch {
    prev = null;
  }
  const same = prev && prev.date === day;
  const next: Row = {
    date: day,
    runsCount: (same ? prev!.runsCount : 0) + 1,
    totalStagedFilesWritten: (same ? prev!.totalStagedFilesWritten : 0) + opts.stagedFilesWrittenThisRun,
    totalMainlineWritten: (same ? prev!.totalMainlineWritten : 0) + opts.mainlineWritten,
    totalFallbackWritten: (same ? prev!.totalFallbackWritten : 0) + opts.fallbackWritten,
    healthyRuns: (same ? prev!.healthyRuns : 0) + (opts.runHealth === "healthy" ? 1 : 0),
    degradedRuns: (same ? prev!.degradedRuns : 0) + (opts.runHealth === "degraded" ? 1 : 0),
    blockedRuns: (same ? prev!.blockedRuns : 0) + (opts.runHealth === "blocked" ? 1 : 0),
    latestRunHealth: opts.runHealth
  };
  fs.mkdirSync(path.dirname(CLUSTER_PUBLISH_DAILY_SUMMARY_JSON), { recursive: true });
  fs.writeFileSync(CLUSTER_PUBLISH_DAILY_SUMMARY_JSON, JSON.stringify(next, null, 2), "utf8");
  console.log("[cluster-publish] wrote generated/cluster-publish-daily-summary.json");
}

function writeClusterPublishArtifacts(payload: ClusterPublishLastRunFile, health: SeoGuidesPublishHealth): void {
  fs.mkdirSync(path.dirname(CLUSTER_PUBLISH_LAST_RUN_JSON), { recursive: true });
  fs.writeFileSync(CLUSTER_PUBLISH_LAST_RUN_JSON, JSON.stringify(payload, null, 2), "utf8");

  const minimal = {
    runAt: payload.runAt,
    success: payload.success,
    failed: payload.failed,
    clustersGenerated: payload.clustersGenerated,
    topicsPassed: payload.topicsPassed,
    articlesPassed: payload.articlesPassed,
    articlesPassedByCluster: payload.articlesPassedByCluster,
    error: payload.error,
    source: payload.source
  };
  fs.writeFileSync(CLUSTER_PUBLISH_DAILY_STATUS_JSON, JSON.stringify(minimal, null, 2), "utf8");
  fs.writeFileSync(SEO_GUIDES_PUBLISH_HEALTH_JSON, JSON.stringify(health, null, 2), "utf8");
}

/**
 * Full pipeline. Always writes `cluster-publish-last-run.json` and `cluster-publish-daily-status.json`.
 * Does not throw: returns `success: false` and `error` on failure (daily-engine stays non-fatal).
 */
export async function runClusterPublishPipeline(options?: {
  source?: string;
  /** With `source: "content-batch"`, cap articles to stage this invocation (e.g. batch EN target). */
  contentBatchStagedTarget?: number;
}): Promise<ClusterPublishLastRunFile> {
  const source = options?.source ?? process.env.SEO_CLUSTER_PUBLISH_SOURCE ?? "cli";
  const runAt = new Date().toISOString();
  const isContentBatch = source === "content-batch";

  try {
    const MIN_STAGED_TARGET = 10;
    /** Stopping target: same as `MIN_FILES_PER_RUN` in topic-engine (single source; env may override). */
    const MIN_FILES_DEFAULT = Math.max(
      1,
      parseInt(process.env.MIN_FILES_WRITTEN_PER_RUN ?? String(MIN_FILES_PER_RUN), 10) || MIN_FILES_PER_RUN
    );
    const MIN_FILES_INV = Math.max(
      1,
      parseInt(process.env.MIN_FILES_WRITTEN_PER_RUN_INVENTORY_LOW ?? String(MIN_FILES_PER_RUN), 10) ||
        MIN_FILES_PER_RUN
    );
    const stagedCountBeforeRun = await getStagedGuideCount();
    const inventoryLow = stagedCountBeforeRun < MIN_STAGED_TARGET;
    const minFilesWrittenThisRun = inventoryLow ? MIN_FILES_INV : MIN_FILES_DEFAULT;
    const batchCap =
      isContentBatch &&
      typeof options?.contentBatchStagedTarget === "number" &&
      options.contentBatchStagedTarget > 0
        ? options.contentBatchStagedTarget
        : 0;
    const MIN_SUCCESS =
      batchCap > 0 ? Math.min(batchCap, minFilesWrittenThisRun) : minFilesWrittenThisRun;
    const MAINLINE_MIN_BEFORE_BROAD_FALLBACK = 2;
    const MAX_TOPIC_ATTEMPTS = inventoryLow ? Math.max(32, minFilesWrittenThisRun * 24) : Math.max(20, minFilesWrittenThisRun * 16);
    const MAX_CLUSTER_ROUNDS = inventoryLow ? Math.max(6, minFilesWrittenThisRun + 4) : Math.max(5, minFilesWrittenThisRun + 3);

    const [diskPosts, stagedPosts] = await Promise.all([getAllAutoPosts(), getAllStagedPosts()]);
    /** diskPosts = legacy auto-posts ∪ sent-guides; with staged = full dedup corpus for title/body/slug. */
    const autoTitles = diskPosts.map((p) => p.title);
    const stagedTitles = stagedPosts.map((p) => p.title);
    const knownStagedBodyHashes = new Set<string>();
    for (const p of [...stagedPosts, ...diskPosts]) {
      knownStagedBodyHashes.add(hashStagedGuideBody(p.body));
    }
    const knownGuideSlugs = new Set<string>();
    for (const p of [...stagedPosts, ...diskPosts]) {
      if (p.slug) knownGuideSlugs.add(p.slug);
    }

    const initialStagedKeys = new Set<string>();
    const usedTopicKeys = new Set<string>();
    /** Keys we already skipped as topic_already_staged this run — do not bump/retry again. */
    const topicAlreadyStagedSkipKeysThisRun = new Set<string>();
    /** Manual batch: allow pool topics that already exist as staged files so new bodies can ship for review. */
    if (!isContentBatch) {
      for (const p of stagedPosts) {
        addTopicKeyVariants(p.title, usedTopicKeys);
        addTopicKeyVariants(p.title, initialStagedKeys);
      }
    }
    for (const p of diskPosts) {
      addTopicKeyVariants(p.title, usedTopicKeys);
      addTopicKeyVariants(p.title, initialStagedKeys);
    }

    const sessionArticleTitles: string[] = [];
    const sessionTopicStrings: string[] = [];
    const topicsSeenThisRun: string[] = [];

    const topicGateCorpus = () => [...autoTitles, ...stagedTitles, ...sessionTopicStrings];

    let anyFallbackUsed = false;
    let fallbackReleaseUsed = false;
    let fallbackReleaseTopic: string | null = null;
    const publishErrors: string[] = [];
    const PRE_DEDUP_THRESHOLD_EN = 0.93;
    const PUBLISH_GATE_SIMILAR_TITLE_THRESHOLD_EN = 0.7;

    let languageGatePassed = 0;
    let languageGateFailedCount = 0;

    let finalAuditPassed = 0;
    let finalAuditFailed = 0;
    const finalAuditReasonCounts: Record<string, number> = {};

    let topicsPassed = 0;
    let articlesPassed = 0;
    const topicsPassedByContentType = { guide: 0, ideas: 0 };
    const articlesPassedByContentType = { guide: 0, ideas: 0 };
    const articlesPassedByCluster: Record<string, number> = {};

    let attemptsUsed = 0;
    let topicPreDedupDropped = 0;
    let clusterRound = 0;
    let topicsGenerated = 0;
    let clustersGenerated = 0;
    let clustersPassed = 0;
    const skippedClusters: SkippedCluster[] = [];
    let priorityChoicesLast: ClusterPriorityMeta[] = [];

    const enAssetIndex = loadContentAssetIndexEntries(process.cwd(), "en");
    let preIndexDedupDropped = 0;

    /** Normalized keys for blocker top-N (strip numeric =… tails). */
    const blockerReasonCounts: Record<string, number> = {};
    function normalizeBlockerKey(raw: string): string {
      return raw
        .trim()
        .replace(/=[\d.]+/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 140);
    }
    function bumpBlocker(prefix: string, raw: string) {
      const nk = normalizeBlockerKey(raw) || "(empty)";
      const key = `${prefix}:${nk}`;
      blockerReasonCounts[key] = (blockerReasonCounts[key] ?? 0) + 1;
    }

    /** Diagnostics only (strategy unchanged): per-layer counts for zero-yield triage. */
    let diagTopicPoolSkip = 0;
    let diagTopicGateFail = 0;
    let diagTopicGatePass = 0;
    let diagAssetIndexReject = 0;
    let diagRebuildAttempts = 0;
    let diagRebuildSuccess = 0;
    let diagRebuildThrows = 0;
    let diagLangPassAttempts = 0;
    let diagLangFailAttempts = 0;
    let diagPreStagedQgRejectAttempts = 0;
    let diagPreStagedQgFinalTopicFail = 0;
    let diagPublishGateReject = 0;
    let diagComposeFail = 0;
    let diagWriteStagedBlock = 0;

    /** EN admission diagnostics (before / at pipeline entry; content-batch topic supply). */
    let enTopicCandidatesTotal = 0;
    let enTopicSkippedAlreadyStaged = 0;
    let enTopicSkippedPrededupTitleJaccard = 0;
    let enTopicRejectedLengthOutOfRange = 0;
    let enTopicAdmittedToPipeline = 0;

    function exactCorpusTitleMatch(topicStr: string): boolean {
      const n = topicStr.replace(/\s+/g, " ").trim().toLowerCase();
      for (const t of [...stagedTitles, ...autoTitles]) {
        if (t.replace(/\s+/g, " ").trim().toLowerCase() === n) return true;
      }
      return false;
    }

    function topBlockerEntries(n: number): [string, number][] {
      return Object.entries(blockerReasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n) as [string, number][];
    }

    function logClusterPublishDiag(lang: "EN", label: string): void {
      const line = {
        lang,
        label,
        topicsGenerated,
        passedTopicGateCount: diagTopicGatePass,
        passedTopicGateAndAssetCount: topicsPassed,
        topicGateRejectedCount: diagTopicGateFail,
        assetIndexRejectedCount: diagAssetIndexReject,
        topicPoolSkippedCount: diagTopicPoolSkip,
        rebuildSuccessCount: diagRebuildSuccess,
        rebuildThrowCount: diagRebuildThrows,
        rebuildAttemptCount: diagRebuildAttempts,
        languageGatePassAttemptCount: diagLangPassAttempts,
        languageGateFailAttemptCount: diagLangFailAttempts,
        preStagedQualityGateRejectedAttemptCount: diagPreStagedQgRejectAttempts,
        preStagedQualityGateFinalTopicFailCount: diagPreStagedQgFinalTopicFail,
        publishGateRejectedCount: diagPublishGateReject,
        finalAuditRejectedCount: finalAuditFailed,
        composeFailedCount: diagComposeFail,
        writeStagedBlockedCount: diagWriteStagedBlock,
        topicPreDedupDropped,
        stagedFilesWrittenThisRun,
        en_topic_candidates_total: enTopicCandidatesTotal,
        en_topic_skipped_already_staged: enTopicSkippedAlreadyStaged,
        en_topic_skipped_prededup_title_jaccard: enTopicSkippedPrededupTitleJaccard,
        en_topic_rejected_length_out_of_range: enTopicRejectedLengthOutOfRange,
        en_topic_admitted_to_pipeline: enTopicAdmittedToPipeline
      };
      console.log(`[cluster-publish-diag] ${JSON.stringify(line)}`);
      if (stagedFilesWrittenThisRun === 0) {
        const top5 = topBlockerEntries(5);
        console.log(
          `[cluster-publish-diag] dominant_blocker_top5 lang=${lang} ${JSON.stringify(Object.fromEntries(top5))}`
        );
      }
    }

    function maybeBumpPreDedupSoftpass(
      pre: ReturnType<typeof shouldPreDropTopicBeforeModel>,
      cluster: string
    ) {
      if (!pre.drop && pre.preDedupSoftpassNote) {
        if (pre.preDedupSoftpassNote.includes("content_jaccard")) {
          enTopicSkippedPrededupTitleJaccard++;
        }
        bumpBlocker("pre_dedup_softpass", pre.preDedupSoftpassNote);
        console.log(`[pre-dedup] cluster="${cluster}" pre_dedup_softpass:${pre.preDedupSoftpassNote}`);
      }
    }

    function preDedupCorpus(): string[] {
      return [
        ...autoTitles,
        ...stagedTitles,
        ...sessionTopicStrings,
        ...sessionArticleTitles,
        ...topicsSeenThisRun
      ];
    }

    /** Count of staged files written this run (same meaning as metrics field `stagedFilesWrittenThisRun`). */
    let stagedFilesWrittenThisRun = 0;
    let mainlineWritten = 0;
    let fallbackWritten = 0;
    /** Set when rebuild throws rebuild_provider_insufficient_balance — exit main topic loop immediately. */
    let enProviderQuotaExhaustedAbort = false;

    type PipelineOpts = { fromMainlineCluster?: boolean; publishRetryUsed?: boolean };

    async function processTopicThroughPipeline(
      topicStr: string,
      cluster: string,
      keyword: string,
      angle: string,
      opts?: PipelineOpts
    ): Promise<boolean> {
      const topicKey = normalizeTopicKey(topicStr);
      if (topicAlreadyStagedSkipKeysThisRun.has(topicKey)) {
        return false;
      }
      if (usedTopicKeys.has(topicKey)) {
        const reason = initialStagedKeys.has(topicKey) ? "topic_already_staged" : "topic_reused_recently";
        if (reason === "topic_already_staged" && !exactCorpusTitleMatch(topicStr)) {
          console.log(
            `[topic-pool] cluster="${cluster}" admit_near_duplicate_key (not exact title) topic="${topicStr.slice(0, 80)}"`
          );
        } else {
          if (reason === "topic_already_staged") {
            topicAlreadyStagedSkipKeysThisRun.add(topicKey);
          }
          diagTopicPoolSkip++;
          if (reason === "topic_already_staged") enTopicSkippedAlreadyStaged++;
          bumpBlocker("topic_pool", reason);
          console.log(`[topic-pool] cluster="${cluster}" skip ${reason} topic="${topicStr.slice(0, 80)}"`);
          return false;
        }
      }

      const tr = evaluateTopicReadiness({
        topic: topicStr,
        existingTitles: topicGateCorpus()
      });

      if (tr.decision !== "pass") {
        diagTopicGateFail++;
        if (tr.reasons.some((r) => r === "length_out_of_range")) {
          enTopicRejectedLengthOutOfRange++;
        }
        for (const r of tr.reasons) bumpBlocker("topic_gate", r);
        console.log(
          `[topic-gate] cluster="${cluster}" skipped decision=${tr.decision} score=${tr.score} reasons=${tr.reasons.join(" | ")}`
        );
        return false;
      }
      diagTopicGatePass++;
      for (const r of tr.reasons) {
        if (r.startsWith("topic_gate_softpass:")) {
          bumpBlocker("topic_gate_softpass", r.slice("topic_gate_softpass:".length));
          console.log(`[topic-gate] cluster="${cluster}" ${r}`);
        }
      }

      const assetHit = describeEnAssetIndexHit(topicStr, enAssetIndex);
      if (assetHit) {
        diagAssetIndexReject++;
        preIndexDedupDropped++;
        bumpBlocker("asset_index", String(assetHit));
        console.log(`[asset-index] cluster="${cluster}" skip ${assetHit} topic="${topicStr.slice(0, 96)}"`);
        return false;
      }

      topicsPassed++;
      sessionTopicStrings.push(topicStr);
      topicsPassedByContentType.guide++;
      console.log(`[topic-gate] cluster="${cluster}" pass topic="${topicStr}" contentType=guide`);

      const PRESTAGED_QG_MAX = 3;
      let article!: Awaited<ReturnType<typeof rebuildToSeoArticle>>;
      for (let genAttempt = 0; genAttempt < PRESTAGED_QG_MAX; genAttempt++) {
        diagRebuildAttempts++;
        try {
          article = await rebuildToSeoArticle({
            title: topicStr,
            context: `Keyword: ${keyword}. Angle: ${angle}. Cluster theme: ${cluster}.`,
            contentType: "guide"
          });
          diagRebuildSuccess++;
        } catch (rebuildErr) {
          diagRebuildThrows++;
          const m = rebuildErr instanceof Error ? rebuildErr.message : String(rebuildErr);
          bumpBlocker("rebuild_throw", m.slice(0, 160));
          console.log(
            `[rebuild-error] cluster="${cluster}" topic="${topicStr.slice(0, 80)}" ${m.slice(0, 240)}`
          );
          if (m.includes("rebuild_provider_insufficient_balance")) {
            console.log("[cluster-publish-pipeline] provider quota exhausted, aborting pipeline");
            enProviderQuotaExhaustedAbort = true;
            return false;
          }
          return false;
        }
        if (article.fallbackUsed) anyFallbackUsed = true;

        const enText = [
          article.title,
          article.body,
          article.aiSummary,
          ...article.faqs.flatMap((f) => [f.question, f.answer]),
          ...article.hashtags
        ].join("\n");
        const lang = evaluateEnContentLanguage(enText);
        if (!lang.passed) {
          diagLangFailAttempts++;
          languageGateFailedCount++;
          bumpBlocker("language_gate", lang.reason ?? "unknown");
          console.log(
            `[language-gate] cluster="${cluster}" skipped reason=${lang.reason ?? "unknown"} topic="${topicStr.slice(0, 80)}"`
          );
          return false;
        }
        diagLangPassAttempts++;

        const qg = evaluatePreStagedQualityGate({
          body: article.body,
          cluster,
          title: article.title,
          aiSummary: article.aiSummary,
          faqs: article.faqs
        });
        if (qg.ok) break;
        diagPreStagedQgRejectAttempts++;
        console.log(`[quality-gate] rejected reason=${qg.reason}`);
        if (genAttempt === PRESTAGED_QG_MAX - 1) {
          diagPreStagedQgFinalTopicFail++;
          bumpBlocker("quality_gate", qg.reason);
          return false;
        }
      }
      languageGatePassed++;

      const pr = evaluatePublishReadiness({
        title: article.title,
        body: article.body,
        existingTitles: [...autoTitles, ...stagedTitles, ...sessionArticleTitles]
      });

      if (pr.decision !== "pass") {
        diagPublishGateReject++;
        const titleDup = pr.reasons.some((r) => r.includes("title_duplicate"));
        if (
          titleDup &&
          opts?.fromMainlineCluster &&
          !opts?.publishRetryUsed
        ) {
          const tryV1 = rewriteMainlineTopicTitleForDedupV1(topicStr);
          if (tryV1 && tryV1 !== topicStr) {
            console.log(
              `[mainline-title-rewrite] mainline-title-rewrite-v1 publish_retry original="${topicStr.slice(0, 96)}" rewritten="${tryV1.slice(0, 96)}"`
            );
            const trRw = evaluateTopicReadiness({ topic: tryV1, existingTitles: topicGateCorpus() });
            const assetRw = describeEnAssetIndexHit(tryV1, enAssetIndex);
            const preRw = shouldPreDropTopicBeforeModel(tryV1, preDedupCorpus());
            maybeBumpPreDedupSoftpass(preRw, cluster);
            if (trRw.decision === "pass" && !assetRw && !preRw.drop) {
              topicsPassed--;
              sessionTopicStrings.pop();
              topicsPassedByContentType.guide--;
              console.log(
                `[mainline-title-rewrite] publish_retry original="${topicStr.slice(0, 96)}" retry_ok=true`
              );
              return processTopicThroughPipeline(tryV1, cluster, keyword, angle, {
                fromMainlineCluster: true,
                publishRetryUsed: true
              });
            }
          }
          const tryV2 = rewriteMainlineTopicTitleForDedupV2(topicStr);
          if (tryV2 && tryV2 !== topicStr) {
            console.log(
              `[mainline-title-rewrite] mainline-title-rewrite-v2 publish_retry original="${topicStr.slice(0, 96)}" rewritten="${tryV2.slice(0, 96)}"`
            );
            const trRw2 = evaluateTopicReadiness({ topic: tryV2, existingTitles: topicGateCorpus() });
            const assetRw2 = describeEnAssetIndexHit(tryV2, enAssetIndex);
            const preRw2 = shouldPreDropTopicBeforeModel(tryV2, preDedupCorpus());
            maybeBumpPreDedupSoftpass(preRw2, cluster);
            if (trRw2.decision === "pass" && !assetRw2 && !preRw2.drop) {
              topicsPassed--;
              sessionTopicStrings.pop();
              topicsPassedByContentType.guide--;
              console.log(
                `[mainline-title-rewrite] publish_retry original="${topicStr.slice(0, 96)}" retry_ok=true`
              );
              return processTopicThroughPipeline(tryV2, cluster, keyword, angle, {
                fromMainlineCluster: true,
                publishRetryUsed: true
              });
            }
          }
          console.log(
            `[mainline-title-rewrite] publish_retry original="${topicStr.slice(0, 96)}" retry_ok=false`
          );
        }

        for (const r of pr.reasons) bumpBlocker("publish_gate", r);
        console.log(
          `[publish-gate] cluster="${cluster}" skipped decision=${pr.decision} score=${pr.score} reasons=${pr.reasons.join(" | ")}`
        );
        return false;
      }
      for (const r of pr.reasons) {
        if (r.startsWith("publish_gate_softpass:")) {
          bumpBlocker("publish_gate_softpass", r.slice("publish_gate_softpass:".length));
          console.log(`[publish-gate] cluster="${cluster}" ${r}`);
        }
      }

      const plainDesc = article.body.replace(/#{1,6}\s+/g, "").replace(/\n+/g, " ").trim().slice(0, 220);
      let composed: Awaited<ReturnType<typeof composeStagedGuide>>;
      try {
        composed = await composeStagedGuide({
          title: article.title,
          body: article.body,
          hashtags: article.hashtags,
          seoTitle: article.title,
          seoDescription: plainDesc,
          aiSummary: article.aiSummary,
          faqs: article.faqs,
          contentType: "guide",
          clusterTheme: cluster
        });
      } catch (err) {
        diagComposeFail++;
        const m = err instanceof Error ? err.message : String(err);
        bumpBlocker("compose_failed", m.slice(0, 120));
        publishErrors.push(`composeStagedGuide "${article.title.slice(0, 72)}": ${m}`);
        return false;
      }

      const fin = auditPublishedGuideMarkdown(composed.filename, composed.markdown);
      if (fin.decision !== "pass") {
        finalAuditFailed++;
        for (const r of fin.reasons) finalAuditReasonCounts[r] = (finalAuditReasonCounts[r] ?? 0) + 1;
        for (const r of fin.reasons) bumpBlocker("final_audit", r);
        console.log(
          `[final-audit] cluster="${cluster}" skipped decision=${fin.decision} reasons=${fin.reasons.join(" | ")}`
        );
        return false;
      }

      if (knownGuideSlugs.has(composed.slug)) {
        diagWriteStagedBlock++;
        usedTopicKeys.add(topicKey);
        bumpBlocker("write_staged", "duplicate_slug");
        console.log(`[write-staged] cluster="${cluster}" skip duplicate_slug slug=${composed.slug}`);
        return false;
      }

      const bodyHash = hashStagedGuideBody(article.body);
      if (knownStagedBodyHashes.has(bodyHash)) {
        diagWriteStagedBlock++;
        usedTopicKeys.add(topicKey);
        bumpBlocker("write_staged", "duplicate_body_hash");
        console.log(
          `[write-staged] cluster="${cluster}" skip duplicate_body_hash topic="${topicStr.slice(0, 80)}"`
        );
        return false;
      }

      try {
        await mkdir(STAGED_GUIDES_DIR, { recursive: true });
        await writeFile(composed.fullPath, composed.markdown, "utf8");
      } catch (err) {
        diagWriteStagedBlock++;
        const m = err instanceof Error ? err.message : String(err);
        bumpBlocker("write_staged", m.slice(0, 120));
        publishErrors.push(`write staged "${article.title.slice(0, 72)}": ${m}`);
        return false;
      }
      knownStagedBodyHashes.add(bodyHash);
      knownGuideSlugs.add(composed.slug);
      usedTopicKeys.add(topicKey);
      finalAuditPassed++;

      sessionArticleTitles.push(article.title);
      articlesPassed++;
      stagedFilesWrittenThisRun++;
      if (opts?.fromMainlineCluster) mainlineWritten++;
      else fallbackWritten++;
      articlesPassedByCluster[cluster] = (articlesPassedByCluster[cluster] ?? 0) + 1;
      articlesPassedByContentType.guide++;
      console.log(
        `[rebuild-and-publish] cluster="${cluster}" staged`,
        articlesPassed,
        composed.stagedRelativePath,
        `planned=${composed.plannedUrlPath}`
      );
      return true;
    }

    /** Extra cluster rounds while mainline yield is low, before relying on SEO / min-yield fallback. */
    const MAINLINE_STRETCH_EXTRA_ROUNDS = 5;

    /** One extra mainline round when 1 short of target at round cap (avoids a single fallback slot). */
    let mainlineLastSlotTried = false;

    enPipelineRun: while (articlesPassed < MIN_SUCCESS && attemptsUsed < MAX_TOPIC_ATTEMPTS) {
      const maxClusterRoundsAllowed =
        mainlineWritten < MAINLINE_MIN_BEFORE_BROAD_FALLBACK && articlesPassed < MIN_SUCCESS
          ? MAX_CLUSTER_ROUNDS + MAINLINE_STRETCH_EXTRA_ROUNDS
          : MAX_CLUSTER_ROUNDS;
      if (clusterRound >= maxClusterRoundsAllowed) {
        const lastSlotEligible =
          minFilesWrittenThisRun >= 8 &&
          stagedFilesWrittenThisRun >= minFilesWrittenThisRun - 1 &&
          articlesPassed < MIN_SUCCESS &&
          mainlineWritten >= fallbackWritten &&
          attemptsUsed < MAX_TOPIC_ATTEMPTS &&
          !mainlineLastSlotTried;
        if (lastSlotEligible) {
          mainlineLastSlotTried = true;
          console.log("[cluster-publish] mainline_last_slot_retry");
        } else {
          break;
        }
      }
      clusterRound++;
      if (
        clusterRound === MAX_CLUSTER_ROUNDS + 1 &&
        mainlineWritten < MAINLINE_MIN_BEFORE_BROAD_FALLBACK &&
        articlesPassed < MIN_SUCCESS
      ) {
        console.log("[cluster-publish] fallback_deferred_for_mainline cluster_round_stretch");
      }
      const { clusters: rawClusters, priorityChoices } = await generateTopicClusters({
        clusterCount: Math.min(4 + clusterRound - 1, 14),
        topicsPerCluster: 3
      });
      priorityChoicesLast = priorityChoices;
      clustersGenerated = Math.max(clustersGenerated, rawClusters.length);

      const clusters: (typeof rawClusters)[number][] = [];
      for (const c of rawClusters) {
        const cr = evaluateClusterReadiness({ cluster: c.cluster });
        if (cr.decision !== "pass") {
          skippedClusters.push({
            cluster: c.cluster,
            decision: cr.decision,
            score: cr.score,
            reasons: cr.reasons
          });
          for (const r of cr.reasons) bumpBlocker("cluster_gate", r);
          console.log(
            `[cluster-gate] cluster="${c.cluster}" skipped decision=${cr.decision} score=${cr.score} reasons=${cr.reasons.join(" | ")}`
          );
          continue;
        }
        console.log(`[cluster-gate] cluster="${c.cluster}" pass score=${cr.score}`);
        clusters.push(c);
      }

      clustersPassed = clusters.length;
      topicsGenerated += clusters.reduce((n, c) => n + c.topics.length, 0);

      for (const cl of clusters) {
        if (articlesPassed >= MIN_SUCCESS) break;
        for (let ti = 0; ti < cl.topics.length; ti++) {
          const topicStr = cl.topics[ti]!;
          const rowMeta = cl.meta?.[ti];
          const pipelineKeyword = rowMeta?.keyword ?? cl.cluster;
          const pipelineAngle = rowMeta ? `intent:${rowMeta.intent}` : `cluster:${cl.cluster}`;
          if (articlesPassed >= MIN_SUCCESS) break;
          if (attemptsUsed >= MAX_TOPIC_ATTEMPTS) break;

          enTopicCandidatesTotal++;

          let workTopic = topicStr;
          let pre = shouldPreDropTopicBeforeModel(workTopic, preDedupCorpus());
          if (pre.drop && pre.reason?.includes("title_duplicate")) {
            const rw1 = rewriteMainlineTopicTitleForDedupV1(topicStr);
            if (rw1) {
              const pre2 = shouldPreDropTopicBeforeModel(rw1, preDedupCorpus());
              const tr2 = evaluateTopicReadiness({ topic: rw1, existingTitles: topicGateCorpus() });
              if (!pre2.drop && tr2.decision === "pass") {
                workTopic = rw1;
                pre = pre2;
                console.log(
                  `[mainline-title-rewrite] mainline-title-rewrite-v1 pre_dedup original="${topicStr.slice(0, 96)}" rewritten="${rw1.slice(0, 96)}"`
                );
              }
            }
            if (pre.drop && pre.reason?.includes("title_duplicate")) {
              const rw2 = rewriteMainlineTopicTitleForDedupV2(topicStr);
              if (rw2) {
                const pre3 = shouldPreDropTopicBeforeModel(rw2, preDedupCorpus());
                const tr3 = evaluateTopicReadiness({ topic: rw2, existingTitles: topicGateCorpus() });
                if (!pre3.drop && tr3.decision === "pass") {
                  workTopic = rw2;
                  pre = pre3;
                  console.log(
                    `[mainline-title-rewrite] mainline-title-rewrite-v2 pre_dedup original="${topicStr.slice(0, 96)}" rewritten="${rw2.slice(0, 96)}"`
                  );
                }
              }
            }
          }
          if (!pre.drop) {
            let tr0 = evaluateTopicReadiness({ topic: workTopic, existingTitles: topicGateCorpus() });
            if (tr0.decision !== "pass" && tr0.reasons.some((r) => r.includes("title_duplicate"))) {
              const rw1 = rewriteMainlineTopicTitleForDedupV1(topicStr);
              if (rw1) {
                const pre2 = shouldPreDropTopicBeforeModel(rw1, preDedupCorpus());
                const tr2 = evaluateTopicReadiness({ topic: rw1, existingTitles: topicGateCorpus() });
                if (!pre2.drop && tr2.decision === "pass") {
                  workTopic = rw1;
                  pre = pre2;
                  console.log(
                    `[mainline-title-rewrite] mainline-title-rewrite-v1 topic_gate original="${topicStr.slice(0, 96)}" rewritten="${rw1.slice(0, 96)}"`
                  );
                }
              }
              tr0 = evaluateTopicReadiness({ topic: workTopic, existingTitles: topicGateCorpus() });
              if (tr0.decision !== "pass" && tr0.reasons.some((r) => r.includes("title_duplicate"))) {
                const rw2 = rewriteMainlineTopicTitleForDedupV2(topicStr);
                if (rw2) {
                  const pre3 = shouldPreDropTopicBeforeModel(rw2, preDedupCorpus());
                  const tr3 = evaluateTopicReadiness({ topic: rw2, existingTitles: topicGateCorpus() });
                  if (!pre3.drop && tr3.decision === "pass") {
                    workTopic = rw2;
                    pre = pre3;
                    console.log(
                      `[mainline-title-rewrite] mainline-title-rewrite-v2 topic_gate original="${topicStr.slice(0, 96)}" rewritten="${rw2.slice(0, 96)}"`
                    );
                  }
                }
              }
            }
          }

          topicsSeenThisRun.push(workTopic);
          if (pre.drop) {
            topicPreDedupDropped++;
            bumpBlocker("pre_dedup", (pre.reason ?? "drop").replace(/^pre_dedup:/, ""));
            console.log(`[pre-dedup] cluster="${cl.cluster}" ${pre.reason ?? "drop"}`);
            continue;
          }
          maybeBumpPreDedupSoftpass(pre, cl.cluster);

          const workTopicKey = normalizeTopicKey(workTopic);
          if (topicAlreadyStagedSkipKeysThisRun.has(workTopicKey)) {
            const admitNearDuplicateTopic =
              usedTopicKeys.has(workTopicKey) &&
              initialStagedKeys.has(workTopicKey) &&
              !exactCorpusTitleMatch(workTopic);
            if (!admitNearDuplicateTopic) {
              continue;
            }
          }

          enTopicAdmittedToPipeline++;
          attemptsUsed++;
          await processTopicThroughPipeline(workTopic, cl.cluster, pipelineKeyword, pipelineAngle, {
            fromMainlineCluster: true
          });
          if (enProviderQuotaExhaustedAbort) break enPipelineRun;
        }
      }
    }

    const retryCount = Math.max(0, clusterRound - 1);
    const forcedSuccessTarget = MIN_SUCCESS;

    recordClusterRunOutcome(
      Object.entries(articlesPassedByCluster).map(([cluster, n]) => ({
        cluster,
        articlesPassed: n
      }))
    );

    const prioritySnapshot = priorityChoicesLast.map((p: ClusterPriorityMeta) => ({
      cluster: p.cluster,
      score: Math.round(p.score * 10) / 10,
      reason: p.reason
    }));

    const runResult: ClusterPublishRunResult = {
      runAt,
      clustersGenerated,
      clustersPassed,
      topicsGenerated,
      topicsPassed,
      articlesPassed,
      topicsPassedByContentType: { ...topicsPassedByContentType },
      articlesPassedByContentType: { ...articlesPassedByContentType },
      articlesPassedByCluster: { ...articlesPassedByCluster },
      priorityChoices: prioritySnapshot,
      skippedClusters,
      languageGatePassed,
      languageGateFailedCount,
      finalAuditPassed,
      finalAuditFailed,
      finalAuditFailedReasonsTop: topFailedReasons(finalAuditReasonCounts),
      retryCount,
      topicPreDedupDropped,
      preIndexDedupDropped,
      inventoryLow,
      forcedSuccessTarget,
      attemptsUsed,
      minStagedTarget: MIN_STAGED_TARGET,
      stagedFilesWrittenThisRun: 0,
      publishedFilesWrittenThisRun: 0,
      minFilesWrittenPerRun: minFilesWrittenThisRun,
      fileThroughputSatisfied: false,
      throughputFailureReason: null,
      mainlineWritten,
      fallbackWritten
    };

    const stagedCountAfterRun = await getStagedGuideCount();
    const publishedFilesWrittenThisRun = 0;
    const fileThroughputSatisfied = stagedFilesWrittenThisRun >= minFilesWrittenThisRun;
    const throughputFailureReason = fileThroughputSatisfied
      ? null
      : `low_throughput: staged_files_written=${stagedFilesWrittenThisRun} min_required=${minFilesWrittenThisRun} (this-run counter)`;

    const metForcedTarget = fileThroughputSatisfied;
    const forcedFailMsg = metForcedTarget
      ? null
      : throughputFailureReason ??
        `forced_success_target_not_met: articlesPassed=${articlesPassed} min_files=${minFilesWrittenThisRun} attemptsUsed=${attemptsUsed} maxTopicAttempts=${MAX_TOPIC_ATTEMPTS} maxClusterRounds=${MAX_CLUSTER_ROUNDS}`;

    const { runHealth, runHealthReason } = computeClusterPublishRunHealth({
      stagedFilesWrittenThisRun,
      mainlineWritten,
      fallbackWritten,
      clustersPassed
    });

    const runResultAug: ClusterPublishRunResult = {
      ...runResult,
      stagedFilesWrittenThisRun,
      publishedFilesWrittenThisRun,
      minFilesWrittenPerRun: minFilesWrittenThisRun,
      fileThroughputSatisfied,
      throughputFailureReason: throughputFailureReason,
      mainlineWritten,
      fallbackWritten,
      runHealth,
      runHealthReason
    };

    const payload: ClusterPublishLastRunFile = {
      ...runResultAug,
      success: metForcedTarget,
      failed: !metForcedTarget,
      error: forcedFailMsg,
      source
    };

    const stagedTotal = stagedCountAfterRun;
    const health: SeoGuidesPublishHealth = {
      runAt: payload.runAt,
      success: metForcedTarget,
      clustersGenerated: payload.clustersGenerated,
      topicsPassed: payload.topicsPassed,
      articlesPassed: payload.articlesPassed,
      articlesPassedByCluster: payload.articlesPassedByCluster,
      fallbackUsed: anyFallbackUsed,
      publishErrors,
      error: forcedFailMsg,
      source,
      stagedCount: stagedTotal,
      remainingStagedCount: stagedTotal,
      publishedCountThisRun: 0,
      publishedFiles: [],
      languageGatePassed: payload.languageGatePassed,
      languageGateFailedCount: payload.languageGateFailedCount,
      finalAuditPassed: payload.finalAuditPassed,
      finalAuditFailed: payload.finalAuditFailed,
      finalAuditFailedReasonsTop: payload.finalAuditFailedReasonsTop,
      retryCount: payload.retryCount,
      topicPreDedupDropped: payload.topicPreDedupDropped,
      assetIndexEntries: enAssetIndex.length,
      preIndexDedupDropped: payload.preIndexDedupDropped,
      inventoryLow: payload.inventoryLow,
      forcedSuccessTarget: payload.forcedSuccessTarget,
      attemptsUsed: payload.attemptsUsed,
      minStagedTarget: payload.minStagedTarget,
      stagedFilesWrittenThisRun,
      publishedFilesWrittenThisRun,
      minFilesWrittenPerRun: minFilesWrittenThisRun,
      fileThroughputSatisfied,
      throughputFailureReason
      ,
      preDedupThresholdEn: PRE_DEDUP_THRESHOLD_EN,
      publishGateThresholdEn: PUBLISH_GATE_SIMILAR_TITLE_THRESHOLD_EN,
      fallbackReleaseUsed,
      fallbackReleaseTopic,
      mainlineWritten,
      fallbackWritten,
      runHealth,
      runHealthReason
    };

    writeClusterPublishArtifacts(payload, health);

    const topBlockers: [string, number][] = Object.entries(blockerReasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([k, v]) => [k, v]);

    const clustersConsidered = clustersGenerated;
    const clusterPassRate =
      clustersConsidered === 0 ? 0 : Math.round((clustersPassed / clustersConsidered) * 10000) / 10000;
    const { duplicatePressure, gatePressure } = computeSupplyPressureFromBlockers(blockerReasonCounts);

    try {
      fs.mkdirSync(path.dirname(CLUSTER_PUBLISH_RUN_HEALTH_JSON), { recursive: true });
      const runHealthPayload = {
        timestamp: payload.runAt,
        success: payload.success,
        stagedFilesWrittenThisRun,
        mainlineWritten,
        fallbackWritten,
        clustersConsidered,
        clustersPassed,
        clusterPassRate,
        runHealth,
        runHealthReason,
        blockerReasonCounts,
        topBlockers,
        duplicatePressure,
        gatePressure,
        diagEn: {
          topicsGenerated,
          passedTopicGateCount: diagTopicGatePass,
          passedTopicGateAndAssetCount: topicsPassed,
          topicGateRejectedCount: diagTopicGateFail,
          assetIndexRejectedCount: diagAssetIndexReject,
          topicPoolSkippedCount: diagTopicPoolSkip,
          rebuildSuccessCount: diagRebuildSuccess,
          rebuildThrowCount: diagRebuildThrows,
          rebuildAttemptCount: diagRebuildAttempts,
          languageGatePassAttemptCount: diagLangPassAttempts,
          languageGateFailAttemptCount: diagLangFailAttempts,
          preStagedQualityGateRejectedAttemptCount: diagPreStagedQgRejectAttempts,
          preStagedQualityGateFinalTopicFailCount: diagPreStagedQgFinalTopicFail,
          publishGateRejectedCount: diagPublishGateReject,
          finalAuditRejectedCount: finalAuditFailed,
          composeFailedCount: diagComposeFail,
          writeStagedBlockedCount: diagWriteStagedBlock,
          topicPreDedupDropped,
          stagedFilesWrittenThisRun,
          en_topic_candidates_total: enTopicCandidatesTotal,
          en_topic_skipped_already_staged: enTopicSkippedAlreadyStaged,
          en_topic_skipped_prededup_title_jaccard: enTopicSkippedPrededupTitleJaccard,
          en_topic_rejected_length_out_of_range: enTopicRejectedLengthOutOfRange,
          en_topic_admitted_to_pipeline: enTopicAdmittedToPipeline
        }
      };
      fs.writeFileSync(CLUSTER_PUBLISH_RUN_HEALTH_JSON, JSON.stringify(runHealthPayload, null, 2), "utf8");
      console.log("[cluster-publish] wrote generated/cluster-publish-run-health.json");
      console.log("[cluster-publish] topBlockers:", JSON.stringify(topBlockers));
      console.log(`[cluster-publish] pressure: duplicate=${duplicatePressure} gate=${gatePressure}`);
    } catch (healthWriteErr) {
      console.warn(
        "[cluster-publish] health json write failed:",
        healthWriteErr instanceof Error ? healthWriteErr.message : String(healthWriteErr)
      );
    }

    try {
      if (runHealth === "healthy" && mainlineWritten >= fallbackWritten) {
        fs.mkdirSync(path.dirname(CLUSTER_PUBLISH_BASELINE_JSON), { recursive: true });
        const baselinePayload = {
          timestamp: payload.runAt,
          targetMinFilesPerRun: MIN_FILES_PER_RUN,
          stagedFilesWrittenThisRun,
          mainlineWritten,
          fallbackWritten,
          runHealth,
          runHealthReason,
          baselineVersion: "v2"
        };
        fs.writeFileSync(CLUSTER_PUBLISH_BASELINE_JSON, JSON.stringify(baselinePayload, null, 2), "utf8");
        console.log("[cluster-publish] wrote generated/cluster-publish-baseline.json");
      } else if (runHealth !== "healthy") {
        console.log("[cluster-publish] baseline_not_updated");
      }
    } catch (baselineErr) {
      console.warn(
        "[cluster-publish] baseline json write failed:",
        baselineErr instanceof Error ? baselineErr.message : String(baselineErr)
      );
    }

    try {
      writeClusterPublishDailySummary({
        runAt: payload.runAt,
        stagedFilesWrittenThisRun,
        mainlineWritten,
        fallbackWritten,
        runHealth
      });
    } catch (dailySummaryErr) {
      console.warn(
        "[cluster-publish] daily summary write failed:",
        dailySummaryErr instanceof Error ? dailySummaryErr.message : String(dailySummaryErr)
      );
    }

    console.log(
      "[rebuild-and-publish] clustersGenerated:",
      clustersGenerated,
      "clustersPassed:",
      clustersPassed,
      "topicsGenerated:",
      topicsGenerated,
      "topicsPassed:",
      topicsPassed,
      "attemptsUsed:",
      attemptsUsed,
      "topicPreDedupDropped:",
      topicPreDedupDropped,
      "retryCount:",
      retryCount,
      "inventoryLow:",
      inventoryLow,
      "languageGatePassed:",
      languageGatePassed,
      "languageGateFailedCount:",
      languageGateFailedCount,
      "articlesPassed:",
      articlesPassed,
      "stagedFilesWrittenThisRun:",
      stagedFilesWrittenThisRun,
      "targetMinFilesPerRun:",
      MIN_FILES_PER_RUN,
      "minFilesWrittenThisRun:",
      minFilesWrittenThisRun,
      "success:",
      metForcedTarget,
      "topicsPassedByContentType:",
      JSON.stringify(topicsPassedByContentType),
      "articlesPassedByContentType:",
      JSON.stringify(articlesPassedByContentType),
      "articlesPassedByCluster:",
      JSON.stringify(articlesPassedByCluster),
      "clusterPriorityChoices:",
      JSON.stringify(prioritySnapshot),
      "skippedClusters:",
      JSON.stringify(skippedClusters),
      "lastRunJson:",
      CLUSTER_PUBLISH_LAST_RUN_JSON,
      "dailyStatusJson:",
      CLUSTER_PUBLISH_DAILY_STATUS_JSON,
      "healthJson:",
      SEO_GUIDES_PUBLISH_HEALTH_JSON,
      "mainlineWritten:",
      mainlineWritten,
      "fallbackWritten:",
      fallbackWritten,
      "runHealth:",
      runHealth,
      "runHealthReason:",
      runHealthReason
    );

    logClusterPublishDiag("EN", "end_of_run");

    return payload;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const payload: ClusterPublishLastRunFile = {
      ...emptyMetrics(runAt),
      success: false,
      failed: true,
      error: msg,
      source
    };
    let stagedOnFail = 0;
    try {
      stagedOnFail = await getStagedGuideCount();
    } catch {
      stagedOnFail = 0;
    }
    const health: SeoGuidesPublishHealth = {
      runAt,
      success: false,
      clustersGenerated: 0,
      topicsPassed: 0,
      articlesPassed: 0,
      articlesPassedByCluster: {},
      fallbackUsed: false,
      publishErrors: [],
      error: msg,
      source,
      stagedCount: stagedOnFail,
      remainingStagedCount: stagedOnFail,
      publishedCountThisRun: 0,
      publishedFiles: [],
      languageGatePassed: 0,
      languageGateFailedCount: 0,
      finalAuditPassed: 0,
      finalAuditFailed: 0,
      finalAuditFailedReasonsTop: {},
      retryCount: 0,
      topicPreDedupDropped: 0,
      assetIndexEntries: 0,
      preIndexDedupDropped: 0,
      inventoryLow: false,
      forcedSuccessTarget: 1,
      attemptsUsed: 0,
      minStagedTarget: 10,
      stagedFilesWrittenThisRun: 0,
      publishedFilesWrittenThisRun: 0,
      minFilesWrittenPerRun: 1,
      fileThroughputSatisfied: false,
      throughputFailureReason: msg
      ,
      preDedupThresholdEn: 0.93,
      publishGateThresholdEn: 0.7,
      fallbackReleaseUsed: false,
      fallbackReleaseTopic: null,
      mainlineWritten: 0,
      fallbackWritten: 0,
      runHealth: "blocked",
      runHealthReason: "no_files_written"
    };
    writeClusterPublishArtifacts(payload, health);
    try {
      writeClusterPublishDailySummary({
        runAt,
        stagedFilesWrittenThisRun: 0,
        mainlineWritten: 0,
        fallbackWritten: 0,
        runHealth: "blocked"
      });
    } catch {
      /* ignore */
    }
    console.error("[cluster-publish-pipeline] failed:", msg);
    return payload;
  }
}
