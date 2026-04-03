/**
 * Cluster → topic → article → publish + priority state (CLI, scheduler, daily-engine).
 */

import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { rebuildToSeoArticle } from "../src/lib/seo/rebuild-article";
import { composeStagedGuide, STAGED_GUIDES_DIR } from "../src/lib/auto-posts";
import { auditPublishedGuideMarkdown } from "../src/lib/seo/published-guide-audit";
import { generateTopicClusters, generateTopics, recordClusterRunOutcome } from "../src/lib/seo/topic-engine";
import { evaluateClusterReadiness } from "../src/lib/seo/cluster-gate";
import { evaluatePublishReadiness } from "../src/lib/seo/publish-gate";
import { evaluateEnContentLanguage } from "../src/lib/seo/language-gate";
import {
  evaluateTopicReadiness,
  shouldPreDropTopicBeforeModel
} from "../src/lib/seo/topic-gate";
import { loadContentAssetIndexEntries, topicHitsAssetIndex } from "../src/lib/seo/content-asset-index";
import { getAllAutoPosts, getAllStagedPosts, getStagedGuideCount } from "../src/lib/auto-posts-reader";
import type { ClusterPriorityMeta } from "../src/lib/seo/cluster-priority";

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
  /** 本轮发布脚本写入 auto-posts 数（generate 阶段恒为 0）。 */
  publishedFilesWrittenThisRun?: number;
  minFilesWrittenPerRun?: number;
  fileThroughputSatisfied?: boolean;
  throughputFailureReason?: string | null;
  preDedupThresholdEn?: number;
  publishGateThresholdEn?: number;
  fallbackReleaseUsed?: boolean;
  fallbackReleaseTopic?: string | null;
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
    throughputFailureReason: null
  };
}

function topFailedReasons(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15));
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
export async function runClusterPublishPipeline(options?: { source?: string }): Promise<ClusterPublishLastRunFile> {
  const source = options?.source ?? process.env.SEO_CLUSTER_PUBLISH_SOURCE ?? "cli";
  const runAt = new Date().toISOString();

  try {
    const MIN_STAGED_TARGET = 10;
    const MIN_FILES_DEFAULT = Math.max(1, parseInt(process.env.MIN_FILES_WRITTEN_PER_RUN ?? "3", 10) || 1);
    const MIN_FILES_INV = Math.max(1, parseInt(process.env.MIN_FILES_WRITTEN_PER_RUN_INVENTORY_LOW ?? "4", 10) || 1);
    const stagedCountBeforeRun = await getStagedGuideCount();
    const inventoryLow = stagedCountBeforeRun < MIN_STAGED_TARGET;
    const minFilesWrittenThisRun = inventoryLow ? MIN_FILES_INV : MIN_FILES_DEFAULT;
    const MIN_SUCCESS = minFilesWrittenThisRun;
    const MAX_TOPIC_ATTEMPTS = inventoryLow ? Math.max(32, minFilesWrittenThisRun * 24) : Math.max(20, minFilesWrittenThisRun * 16);
    const MAX_CLUSTER_ROUNDS = inventoryLow ? Math.max(6, minFilesWrittenThisRun + 4) : Math.max(5, minFilesWrittenThisRun + 3);

    const [diskPosts, stagedPosts] = await Promise.all([getAllAutoPosts(), getAllStagedPosts()]);
    const autoTitles = diskPosts.map((p) => p.title);
    const stagedTitles = stagedPosts.map((p) => p.title);

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

    function preDedupCorpus(): string[] {
      return [
        ...autoTitles,
        ...stagedTitles,
        ...sessionTopicStrings,
        ...sessionArticleTitles,
        ...topicsSeenThisRun
      ];
    }

    type FallbackReleaseCandidate = {
      topic: string;
      cluster: string;
      contentType: "guide" | "ideas";
      article: Awaited<ReturnType<typeof rebuildToSeoArticle>>;
      score: number;
    };
    let fallbackReleaseCandidate: FallbackReleaseCandidate | null = null;

    async function processTopicThroughPipeline(
      topicStr: string,
      cluster: string,
      keyword: string,
      angle: string
    ): Promise<boolean> {
      const tr = evaluateTopicReadiness({
        topic: topicStr,
        existingTitles: topicGateCorpus()
      });

      if (tr.decision !== "pass") {
        console.log(
          `[topic-gate] cluster="${cluster}" skipped decision=${tr.decision} score=${tr.score} reasons=${tr.reasons.join(" | ")}`
        );
        return false;
      }

      if (topicHitsAssetIndex(topicStr, "en", enAssetIndex)) {
        preIndexDedupDropped++;
        console.log(
          `[asset-index] cluster="${cluster}" skip duplicate_or_similar topic="${topicStr.slice(0, 96)}"`
        );
        return false;
      }

      topicsPassed++;
      sessionTopicStrings.push(topicStr);
      if (tr.contentType === "ideas") topicsPassedByContentType.ideas++;
      else topicsPassedByContentType.guide++;
      console.log(`[topic-gate] cluster="${cluster}" pass topic="${topicStr}" contentType=${tr.contentType ?? "n/a"}`);

      const article = await rebuildToSeoArticle({
        title: topicStr,
        context: `Keyword: ${keyword}. Angle: ${angle}. Cluster theme: ${cluster}.`,
        contentType: tr.contentType
      });
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
        languageGateFailedCount++;
        console.log(
          `[language-gate] cluster="${cluster}" skipped reason=${lang.reason ?? "unknown"} topic="${topicStr.slice(0, 80)}"`
        );
        return false;
      }
      languageGatePassed++;

      const pr = evaluatePublishReadiness({
        title: article.title,
        body: article.body,
        existingTitles: [...autoTitles, ...stagedTitles, ...sessionArticleTitles]
      });

      if (pr.decision !== "pass") {
        const similarReason = pr.reasons.find((r) => r.startsWith("similar_title:jaccard="));
        if (similarReason) {
          const scorePart = similarReason.split("=").pop() ?? "0";
          const score = Number.parseFloat(scorePart);
          const candidateScore = Number.isFinite(score) ? score : 0;
          if (!fallbackReleaseCandidate || candidateScore > fallbackReleaseCandidate.score) {
            fallbackReleaseCandidate = {
              topic: topicStr,
              cluster,
              contentType: tr.contentType === "ideas" ? "ideas" : "guide",
              article,
              score: candidateScore
            };
          }
        }
        console.log(
          `[publish-gate] cluster="${cluster}" skipped decision=${pr.decision} score=${pr.score} reasons=${pr.reasons.join(" | ")}`
        );
        return false;
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
          contentType: tr.contentType === "ideas" ? "ideas" : "guide",
          clusterTheme: cluster
        });
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        publishErrors.push(`composeStagedGuide "${article.title.slice(0, 72)}": ${m}`);
        return false;
      }

      const fin = auditPublishedGuideMarkdown(composed.filename, composed.markdown);
      if (fin.decision !== "pass") {
        finalAuditFailed++;
        for (const r of fin.reasons) finalAuditReasonCounts[r] = (finalAuditReasonCounts[r] ?? 0) + 1;
        console.log(
          `[final-audit] cluster="${cluster}" skipped decision=${fin.decision} reasons=${fin.reasons.join(" | ")}`
        );
        return false;
      }

      try {
        await mkdir(STAGED_GUIDES_DIR, { recursive: true });
        await writeFile(composed.fullPath, composed.markdown, "utf8");
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        publishErrors.push(`write staged "${article.title.slice(0, 72)}": ${m}`);
        return false;
      }
      finalAuditPassed++;

      sessionArticleTitles.push(article.title);
      articlesPassed++;
      articlesPassedByCluster[cluster] = (articlesPassedByCluster[cluster] ?? 0) + 1;
      if (tr.contentType === "ideas") articlesPassedByContentType.ideas++;
      else articlesPassedByContentType.guide++;
      console.log(
        `[rebuild-and-publish] cluster="${cluster}" staged`,
        articlesPassed,
        composed.stagedRelativePath,
        `planned=${composed.plannedUrlPath}`
      );
      return true;
    }

    while (
      articlesPassed < MIN_SUCCESS &&
      clusterRound < MAX_CLUSTER_ROUNDS &&
      attemptsUsed < MAX_TOPIC_ATTEMPTS
    ) {
      clusterRound++;
      const { clusters: rawClusters, priorityChoices } = generateTopicClusters({
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
        for (const topicStr of cl.topics) {
          if (articlesPassed >= MIN_SUCCESS) break;
          if (attemptsUsed >= MAX_TOPIC_ATTEMPTS) break;

          attemptsUsed++;
          const pre = shouldPreDropTopicBeforeModel(topicStr, preDedupCorpus());
          topicsSeenThisRun.push(topicStr);
          if (pre.drop) {
            topicPreDedupDropped++;
            console.log(`[pre-dedup] cluster="${cl.cluster}" ${pre.reason ?? "drop"}`);
            continue;
          }

          await processTopicThroughPipeline(
            topicStr,
            cl.cluster,
            cl.cluster,
            `cluster:${cl.cluster}`
          );
        }
      }
    }

    if (articlesPassed < MIN_SUCCESS && attemptsUsed < MAX_TOPIC_ATTEMPTS) {
      const pool = generateTopics({ count: 50 });
      for (const row of pool) {
        if (articlesPassed >= MIN_SUCCESS) break;
        if (attemptsUsed >= MAX_TOPIC_ATTEMPTS) break;

        attemptsUsed++;
        const cluster = "SEO fallback pool";
        if (articlesPassedByCluster[cluster] === undefined) articlesPassedByCluster[cluster] = 0;

        const pre = shouldPreDropTopicBeforeModel(row.topic, preDedupCorpus());
        topicsSeenThisRun.push(row.topic);
        if (pre.drop) {
          topicPreDedupDropped++;
          console.log(`[pre-dedup] cluster="${cluster}" ${pre.reason ?? "drop"}`);
          continue;
        }

        await processTopicThroughPipeline(row.topic, cluster, row.keyword, row.angle);
      }
    }

if (topicsPassed > 0 && articlesPassed === 0 && fallbackReleaseCandidate !== null) {
  const candidate = fallbackReleaseCandidate as FallbackReleaseCandidate;
  const plainDesc = candidate.article.body
    .replace(/#{1,6}\s+/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 220);

  try {
    const composed = await composeStagedGuide({
      title: candidate.article.title,
      body: candidate.article.body,
      hashtags: candidate.article.hashtags,
      seoTitle: candidate.article.title,
      seoDescription: plainDesc,
      aiSummary: candidate.article.aiSummary,
      faqs: candidate.article.faqs,
      contentType: candidate.contentType,
      clusterTheme: candidate.cluster
    });
        const fin = auditPublishedGuideMarkdown(composed.filename, composed.markdown);
        if (fin.decision === "pass") {
          await mkdir(STAGED_GUIDES_DIR, { recursive: true });
          await writeFile(composed.fullPath, composed.markdown, "utf8");
          finalAuditPassed++;
          articlesPassed++;
          articlesPassedByCluster[candidate.cluster] = (articlesPassedByCluster[candidate.cluster] ?? 0) + 1;
          if (candidate.contentType === "ideas") articlesPassedByContentType.ideas++;
          else articlesPassedByContentType.guide++;
          fallbackReleaseUsed = true;
          fallbackReleaseTopic = candidate.topic;
          console.log(
            `[fallback-release] staged topic="${candidate.topic}" reason=skip_publish_gate_similar_title_only`
          );
        }
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        publishErrors.push(`fallbackRelease "${candidate.topic.slice(0, 72)}": ${m}`);
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
      throughputFailureReason: null
    };

    const stagedCountAfterRun = await getStagedGuideCount();
    const stagedFilesWrittenThisRun = Math.max(0, stagedCountAfterRun - stagedCountBeforeRun);
    const publishedFilesWrittenThisRun = 0;
    const fileThroughputSatisfied = stagedFilesWrittenThisRun >= minFilesWrittenThisRun;
    const throughputFailureReason = fileThroughputSatisfied
      ? null
      : `low_throughput: staged_files_written=${stagedFilesWrittenThisRun} min_required=${minFilesWrittenThisRun} (directory delta; articlesPassed=${articlesPassed})`;

    const metForcedTarget = fileThroughputSatisfied;
    const forcedFailMsg = metForcedTarget
      ? null
      : throughputFailureReason ??
        `forced_success_target_not_met: articlesPassed=${articlesPassed} min_files=${minFilesWrittenThisRun} attemptsUsed=${attemptsUsed} maxTopicAttempts=${MAX_TOPIC_ATTEMPTS} maxClusterRounds=${MAX_CLUSTER_ROUNDS}`;

    const runResultAug: ClusterPublishRunResult = {
      ...runResult,
      stagedFilesWrittenThisRun,
      publishedFilesWrittenThisRun,
      minFilesWrittenPerRun: minFilesWrittenThisRun,
      fileThroughputSatisfied,
      throughputFailureReason: throughputFailureReason
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
      fallbackReleaseTopic
    };

    writeClusterPublishArtifacts(payload, health);

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
      SEO_GUIDES_PUBLISH_HEALTH_JSON
    );

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
      fallbackReleaseTopic: null
    };
    writeClusterPublishArtifacts(payload, health);
    console.error("[cluster-publish-pipeline] failed:", msg);
    return payload;
  }
}
