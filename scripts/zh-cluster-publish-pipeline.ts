/**
 * V300 中文 cluster → staged：语言隔离 → publish-gate → 终审 → 仅 pass 写入 zh-staged-guides。
 * 多轮重试：首轮 0 产出时自动换批 topic，直至最小成功目标或达到轮次上限。
 */

import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { generateZhTopicClusters } from "../src/lib/seo-zh/topic-engine";
import { evaluateZhClusterReadiness } from "../src/lib/seo-zh/cluster-gate";
import { evaluateZhTopicReadiness } from "../src/lib/seo-zh/topic-gate";
import { rebuildToZhGuideArticle } from "../src/lib/seo-zh/rebuild-article";
import { evaluateZhContentLanguage } from "../src/lib/seo-zh/language-gate";
import { evaluateZhPublishReadiness } from "../src/lib/seo-zh/publish-gate";
import { auditZhGuideMarkdown } from "../src/lib/seo-zh/zh-guide-audit";
import { mapZhGuideDataToRecordFields, serializeZhGuideMarkdown } from "../src/lib/seo-zh/zh-frontmatter-keys";
import {
  countZhAssetIndexSourceMdFiles,
  findZhTopicAssetIndexHit,
  scanZhContentAssetIndexFromDisk
} from "../src/lib/seo/content-asset-index";

const ZH_STAGED = path.join(process.cwd(), "content", "zh-staged-guides");
const ZH_GUIDES = path.join(process.cwd(), "content", "zh-guides");
const HEALTH_JSON = path.join(process.cwd(), "generated", "seo-zh-publish-health.json");

const MIN_STAGED_TARGET = 10;
const MIN_FILES_DEFAULT = Math.max(
  1,
  parseInt(process.env.ZH_MIN_FILES_WRITTEN_PER_RUN ?? process.env.MIN_FILES_WRITTEN_PER_RUN ?? "2", 10) || 1
);
const MIN_FILES_INV = Math.max(
  1,
  parseInt(
    process.env.ZH_MIN_FILES_WRITTEN_PER_RUN_INVENTORY_LOW ?? process.env.MIN_FILES_WRITTEN_PER_RUN_INVENTORY_LOW ?? "3",
    10
  ) || 1
);
const MAX_ROUNDS = Math.max(1, parseInt(process.env.ZH_PIPELINE_MAX_ROUNDS ?? "8", 10) || 8);
const MAX_TOPIC_ATTEMPTS_PER_ROUND = Math.max(20, parseInt(process.env.ZH_MAX_TOPIC_ATTEMPTS_PER_ROUND ?? "120", 10) || 120);

function slugifyZh(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\u4e00-\u9fff\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "zh-guide";
}

function loadExistingGuideTitles(): string[] {
  const titles: string[] = [];
  for (const dir of [ZH_GUIDES, ZH_STAGED]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      try {
        const raw = fs.readFileSync(path.join(dir, f), "utf8");
        const { data } = matter(raw);
        const m = mapZhGuideDataToRecordFields(data as Record<string, unknown>);
        if (m.title) titles.push(m.title);
      } catch {
        /* skip */
      }
    }
  }
  return titles;
}

function countZhStagedMdFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).length;
}

function buildZhStagedMarkdown(payload: {
  title: string;
  body: string;
  aiSummary: string;
  faqs: { question: string; answer: string }[];
  hashtags: string[];
  platform: string;
  slug: string;
}): string {
  const publishedAt = new Date().toISOString();
  const desc = payload.aiSummary.replace(/\s+/g, " ").trim().slice(0, 220);
  return serializeZhGuideMarkdown({
    title: payload.title,
    description: desc,
    slug: payload.slug,
    publishedAt,
    platform: payload.platform,
    aiSummary: payload.aiSummary,
    hashtags: payload.hashtags,
    faqs: payload.faqs,
    body: payload.body
  });
}

export async function runZhClusterPublishPipeline(): Promise<{
  stagedFilesWrittenThisRun: number;
  success: boolean;
  articlesStaged: number;
}> {
  const runAt = new Date().toISOString();
  const cwd = process.cwd();
  const zhStagedBeforeRun = countZhStagedMdFiles(ZH_STAGED);
  const inventoryLow = zhStagedBeforeRun < MIN_STAGED_TARGET;
  const minFilesWrittenThisRun = inventoryLow ? MIN_FILES_INV : MIN_FILES_DEFAULT;
  const MIN_SUCCESS = minFilesWrittenThisRun;
  const maxRoundsEffective = Math.max(MAX_ROUNDS, minFilesWrittenThisRun + 6);
  const srcCounts = countZhAssetIndexSourceMdFiles(cwd);
  const zhScanBoot = scanZhContentAssetIndexFromDisk(cwd);
  console.log(
    `[asset-index] zh live scan: entries=${zhScanBoot.length} zh-guides_md=${srcCounts.zhGuides} zh-staged-guides_md=${srcCounts.zhStaged}`
  );

  let preIndexDedupDropped = 0;
  let articlesStaged = 0;
  let languageGatePassed = 0;
  let languageGateFailedCount = 0;
  let publishGatePassed = 0;
  let publishGateSkipped = 0;
  let topicsPassed = 0;
  let finalAuditPassed = 0;
  let finalAuditFailed = 0;
  const finalAuditFailedReasonsTop: Record<string, number> = {};
  const sessionTopicStrings: string[] = [];
  const sessionArticleTitles: string[] = [];
  let attemptsUsed = 0;
  let roundsExecuted = 0;
  let clustersGeneratedTotal = 0;
  /** Diagnostics only: topic strings emitted from clusters (per round + total). */
  let topicsGeneratedThisRound = 0;
  let topicsGeneratedTotal = 0;
  let diagZhTopicGateFail = 0;
  let diagZhTopicGatePass = 0;
  let diagZhClusterGateSkip = 0;
  let diagZhRebuildAttempts = 0;
  let diagZhRebuildSuccess = 0;
  let diagZhRebuildThrows = 0;
  let diagZhPurityFail = 0;
  let diagZhLanguageGateFail = 0;
  let diagZhLanguageGatePass = 0;
  const zhPipelineBlockers: Record<string, number> = {};
  function bumpZhPipelineBlocker(prefix: string, raw: string) {
    const nk = raw.replace(/\s+/g, " ").trim().slice(0, 120) || "(empty)";
    const key = `${prefix}:${nk}`;
    zhPipelineBlockers[key] = (zhPipelineBlockers[key] ?? 0) + 1;
  }
  function topZhPipelineBlockers(n: number): [string, number][] {
    return Object.entries(zhPipelineBlockers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n) as [string, number][];
  }
  function logZhDiag(label: string, roundNum: number): void {
    const stagedDelta = Math.max(0, countZhStagedMdFiles(ZH_STAGED) - zhStagedBeforeRun);
    const line = {
      lang: "ZH",
      label,
      round: roundNum,
      topicsGeneratedCount: topicsGeneratedThisRound,
      topicsGeneratedTotalSoFar: topicsGeneratedTotal,
      passedTopicGateCount: diagZhTopicGatePass,
      topicGateRejectedCount: diagZhTopicGateFail,
      clusterGateSkippedClusters: diagZhClusterGateSkip,
      assetIndexRejectedCount: preIndexDedupDropped,
      rebuildSuccessCount: diagZhRebuildSuccess,
      rebuildThrowCount: diagZhRebuildThrows,
      rebuildAttemptCount: diagZhRebuildAttempts,
      languagePurityFailCount: diagZhPurityFail,
      languageGatePassCount: diagZhLanguageGatePass,
      languageGateFailCount: diagZhLanguageGateFail,
      preStagedQualityGateRejectedCount: 0,
      publishGateRejectedCount: publishGateSkipped,
      finalAuditRejectedCount: finalAuditFailed,
      stagedFilesWrittenThisRun: stagedDelta
    };
    console.log(`[zh-cluster-publish-diag] ${JSON.stringify(line)}`);
    if (stagedDelta === 0) {
      const mergedTop = [
        ...topZhPipelineBlockers(8),
        ...Object.entries(finalAuditFailedReasonsTop).map(([k, v]) => [`final_audit:${k}`, v] as [string, number])
      ]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      console.log(
        `[zh-cluster-publish-diag] dominant_blocker_top5 lang=ZH ${JSON.stringify(Object.fromEntries(mergedTop))}`
      );
    }
  }
  const PRE_DEDUP_THRESHOLD_ZH = 0.93;
  const PUBLISH_GATE_THRESHOLD_ZH = 0.7;
  let fallbackReleaseUsed = false;
  let fallbackReleaseTopic: string | null = null;
  type FallbackReleaseCandidate = {
    topic: string;
    platform: "douyin" | "xiaohongshu";
    score: number;
  };
  let fallbackReleaseCandidate: FallbackReleaseCandidate | null = null;

  let round = 0;
  while (articlesStaged < MIN_SUCCESS && round < maxRoundsEffective) {
    round++;
    roundsExecuted = round;

    const zhAssetIndexRound = scanZhContentAssetIndexFromDisk(cwd);
    const indexTitles = zhAssetIndexRound.map((e) => e.title).filter(Boolean);
    const liveCounts = countZhAssetIndexSourceMdFiles(cwd);
    console.log(
      `[asset-index] round ${round} zh entries=${zhAssetIndexRound.length} zh-guides_md=${liveCounts.zhGuides} zh-staged-guides_md=${liveCounts.zhStaged}`
    );

    const existingForEngine = [
      ...loadExistingGuideTitles(),
      ...sessionArticleTitles,
      ...indexTitles,
      ...sessionTopicStrings
    ];

    const { clusters } = generateZhTopicClusters({
      existingTitles: existingForEngine,
      roundSeed: round
    });
    clustersGeneratedTotal += clusters.length;
    topicsGeneratedThisRound = clusters.reduce((n, c) => n + c.topics.length, 0);
    topicsGeneratedTotal += topicsGeneratedThisRound;

    if (clusters.length === 0) {
      console.log(`[zh-cluster-publish-pipeline] round ${round} no clusters after filter, retry`);
      logZhDiag(`round_${round}_no_clusters`, round);
      continue;
    }

    let roundAttempts = 0;
    for (const cl of clusters) {
      if (articlesStaged >= MIN_SUCCESS || roundAttempts >= MAX_TOPIC_ATTEMPTS_PER_ROUND) break;
      const cr = evaluateZhClusterReadiness({ cluster: cl.cluster });
      if (cr.decision !== "pass") {
        diagZhClusterGateSkip++;
        for (const r of cr.reasons) bumpZhPipelineBlocker("cluster_gate", r);
        console.log(
          `[zh-cluster-gate] skip cluster="${cl.cluster.slice(0, 96)}" decision=${cr.decision} score=${cr.score} reasons=${cr.reasons.join(";") || "(none)"}`
        );
        continue;
      }
      for (const topicStr of cl.topics) {
        if (articlesStaged >= MIN_SUCCESS || roundAttempts >= MAX_TOPIC_ATTEMPTS_PER_ROUND) break;
        roundAttempts++;
        attemptsUsed++;

        const tr = evaluateZhTopicReadiness({
          topic: topicStr,
          existingTitles: sessionTopicStrings
        });
        if (tr.decision !== "pass") {
          diagZhTopicGateFail++;
          for (const r of tr.reasons) bumpZhPipelineBlocker("topic_gate", r);
          console.log(
            `[zh-topic-gate] skip topic="${topicStr.slice(0, 80)}" decision=${tr.decision} score=${tr.score} reasons=${tr.reasons.join(";") || "(none)"}`
          );
          continue;
        }
        topicsPassed++;
        diagZhTopicGatePass++;

        const zhAssetIndexNow = scanZhContentAssetIndexFromDisk(cwd);
        const zhHit = findZhTopicAssetIndexHit(topicStr, zhAssetIndexNow);
        if (zhHit) {
          preIndexDedupDropped++;
          bumpZhPipelineBlocker(
            "asset_index",
            `${zhHit.kind}:${zhHit.entry.title ?? ""}`
          );
          const src =
            zhHit.entry.status === "published" ? "content/zh-guides" : "content/zh-staged-guides";
          console.log(
            `[asset-index] skip duplicate_or_similar kind=${zhHit.kind} topic="${topicStr.slice(0, 64)}" matchedTitle="${zhHit.entry.title}" slug="${zhHit.entry.slug}" file="${zhHit.entry.filename}" source=${src}`
          );
          continue;
        }

        sessionTopicStrings.push(topicStr);

        diagZhRebuildAttempts++;
        let article: Awaited<ReturnType<typeof rebuildToZhGuideArticle>>;
        try {
          article = await rebuildToZhGuideArticle({
            title: topicStr,
            context: `平台:${cl.platform} 聚类:${cl.cluster}`,
            platform: cl.platform,
            contentType: tr.contentType
          });
          diagZhRebuildSuccess++;
        } catch (rebuildErr) {
          diagZhRebuildThrows++;
          const m = rebuildErr instanceof Error ? rebuildErr.message : String(rebuildErr);
          bumpZhPipelineBlocker("rebuild_throw", m);
          console.log(`[zh-rebuild-error] topic="${topicStr.slice(0, 64)}" ${m.slice(0, 240)}`);
          continue;
        }

        if (!article.languagePurity.pass) {
          diagZhPurityFail++;
          languageGateFailedCount++;
          bumpZhPipelineBlocker("language_purity", article.languagePurity.reason ?? "unknown");
          console.log(
            `[zh-rebuild-purity] skipped reason=${article.languagePurity.reason ?? "unknown"} topic="${topicStr.slice(0, 64)}"`
          );
          continue;
        }

        const zhText = [
          article.title,
          article.body,
          article.aiSummary,
          ...article.faqs.flatMap((f) => [f.question, f.answer]),
          ...article.hashtags
        ].join("\n");
        const zg = evaluateZhContentLanguage(zhText);
        if (!zg.passed) {
          diagZhLanguageGateFail++;
          languageGateFailedCount++;
          bumpZhPipelineBlocker("language_gate", zg.reason ?? "unknown");
          console.log(
            `[zh-language-gate] skipped reason=${zg.reason ?? "unknown"} topic="${topicStr.slice(0, 64)}"`
          );
          continue;
        }
        languageGatePassed++;
        diagZhLanguageGatePass++;

        const existingTitles = [...loadExistingGuideTitles(), ...sessionArticleTitles];
        const pr = evaluateZhPublishReadiness({
          title: article.title,
          body: article.body,
          existingTitles
        });
        if (pr.decision !== "pass") {
          publishGateSkipped++;
          for (const r of pr.reasons) bumpZhPipelineBlocker("publish_gate", r);
          const similarReason = pr.reasons.find((r) => r.startsWith("similar_title:jaccard_zh="));
          if (similarReason) {
            const scorePart = similarReason.split("=").pop() ?? "0";
            const score = Number.parseFloat(scorePart);
            if (Number.isFinite(score) && (!fallbackReleaseCandidate || score > fallbackReleaseCandidate.score)) {
              fallbackReleaseCandidate = {
                topic: topicStr,
                platform: cl.platform,
                score
              };
            }
          }
          console.log(
            `[zh-publish-gate] skipped decision=${pr.decision} topic="${article.title.slice(0, 48)}" ${pr.reasons.join(",")}`
          );
          continue;
        }
        publishGatePassed++;

        const slug = `${slugifyZh(article.title)}-${articlesStaged + 1}`;
        const fname = `zh-${Date.now()}-${slugifyZh(article.title).slice(0, 36)}.md`;
        const md = buildZhStagedMarkdown({
          title: article.title,
          body: article.body,
          aiSummary: article.aiSummary,
          faqs: article.faqs,
          hashtags: article.hashtags,
          platform: cl.platform,
          slug
        });

        const audit = auditZhGuideMarkdown(fname, md);
        if (audit.decision !== "pass") {
          finalAuditFailed++;
          for (const r of audit.reasons) {
            finalAuditFailedReasonsTop[r] = (finalAuditFailedReasonsTop[r] ?? 0) + 1;
            bumpZhPipelineBlocker("final_audit", r);
          }
          console.log(
            `[zh-final-audit] skip decision=${audit.decision} file=${fname} ${audit.reasons.join(",")}`
          );
          continue;
        }

        fs.mkdirSync(ZH_STAGED, { recursive: true });
        fs.writeFileSync(path.join(ZH_STAGED, fname), md, "utf8");
        finalAuditPassed++;
        articlesStaged++;
        sessionArticleTitles.push(article.title);
        console.log(`[zh-cluster-publish-pipeline] staged ${fname} (round ${round})`);
      }
    }

    if (articlesStaged < MIN_SUCCESS && round < maxRoundsEffective) {
      console.log(
        `[zh-cluster-publish-pipeline] round ${round} done articlesStaged=${articlesStaged} target=${MIN_SUCCESS}, retrying`
      );
    }
    logZhDiag(`round_${round}_end`, round);
  }

  if (topicsPassed > 0 && articlesStaged === 0 && fallbackReleaseCandidate) {
    const candidate = fallbackReleaseCandidate;
    const article = await rebuildToZhGuideArticle({
      title: candidate.topic,
      context: `平台:${candidate.platform} 兜底放行`,
      platform: candidate.platform,
      contentType: "guide"
    });
    if (article.languagePurity.pass) {
      const zhText = [
        article.title,
        article.body,
        article.aiSummary,
        ...article.faqs.flatMap((f) => [f.question, f.answer]),
        ...article.hashtags
      ].join("\n");
      const zg = evaluateZhContentLanguage(zhText);
      if (zg.passed) {
        const slug = `${slugifyZh(article.title)}-fallback-1`;
        const fname = `zh-${Date.now()}-${slugifyZh(article.title).slice(0, 36)}.md`;
        const md = buildZhStagedMarkdown({
          title: article.title,
          body: article.body,
          aiSummary: article.aiSummary,
          faqs: article.faqs,
          hashtags: article.hashtags,
          platform: candidate.platform,
          slug
        });
        const audit = auditZhGuideMarkdown(fname, md);
        if (audit.decision === "pass") {
          fs.mkdirSync(ZH_STAGED, { recursive: true });
          fs.writeFileSync(path.join(ZH_STAGED, fname), md, "utf8");
          finalAuditPassed++;
          publishGatePassed++;
          articlesStaged++;
          fallbackReleaseUsed = true;
          fallbackReleaseTopic = candidate.topic;
          console.log(`[zh-fallback-release] staged ${fname} topic="${candidate.topic}"`);
        }
      }
    }
  }

  const retryCount = Math.max(0, roundsExecuted - 1);
  const zhAssetIndexFinal = scanZhContentAssetIndexFromDisk(cwd);
  const zhStagedAfterRun = countZhStagedMdFiles(ZH_STAGED);
  const stagedFilesWrittenThisRun = Math.max(0, zhStagedAfterRun - zhStagedBeforeRun);
  const publishedFilesWrittenThisRun = 0;
  const fileThroughputSatisfied = stagedFilesWrittenThisRun >= minFilesWrittenThisRun;
  const throughputFailureReason = fileThroughputSatisfied
    ? null
    : `low_throughput: staged_files_written=${stagedFilesWrittenThisRun} min_required=${minFilesWrittenThisRun} (directory delta; articlesStaged=${articlesStaged})`;

  const health = {
    runAt,
    success: fileThroughputSatisfied,
    clustersGenerated: clustersGeneratedTotal,
    roundsExecuted,
    articlesStaged,
    languageGatePassed,
    languageGateFailedCount,
    publishGatePassed,
    publishGateSkipped,
    finalAuditPassed,
    finalAuditFailed,
    finalAuditFailedReasonsTop,
    assetIndexEntries: zhAssetIndexFinal.length,
    preIndexDedupDropped,
    assetIndexDedupDropped: preIndexDedupDropped,
    retryCount,
    attemptsUsed,
    minSuccessTarget: MIN_SUCCESS,
    maxRounds: maxRoundsEffective,
    minFilesWrittenPerRun: minFilesWrittenThisRun,
    stagedFilesWrittenThisRun,
    publishedFilesWrittenThisRun,
    fileThroughputSatisfied,
    throughputFailureReason,
    inventoryLow,
    error: null as string | null,
    engine: "v300-zh-main-chain",
    preDedupThresholdZh: PRE_DEDUP_THRESHOLD_ZH,
    publishGateThresholdZh: PUBLISH_GATE_THRESHOLD_ZH,
    fallbackReleaseUsed,
    fallbackReleaseTopic,
    diagZh: {
      topicsGeneratedTotal,
      passedTopicGateCount: diagZhTopicGatePass,
      topicGateRejectedCount: diagZhTopicGateFail,
      clusterGateSkippedClusters: diagZhClusterGateSkip,
      assetIndexRejectedCount: preIndexDedupDropped,
      rebuildSuccessCount: diagZhRebuildSuccess,
      rebuildThrowCount: diagZhRebuildThrows,
      rebuildAttemptCount: diagZhRebuildAttempts,
      languagePurityFailCount: diagZhPurityFail,
      languageGatePassCount: diagZhLanguageGatePass,
      languageGateFailCount: diagZhLanguageGateFail,
      preStagedQualityGateRejectedCount: 0,
      publishGateRejectedCount: publishGateSkipped,
      finalAuditRejectedCount: finalAuditFailed,
      stagedFilesWrittenThisRun,
      dominantBlockerTop5: topZhPipelineBlockers(5)
    }
  };
  fs.mkdirSync(path.dirname(HEALTH_JSON), { recursive: true });
  fs.writeFileSync(HEALTH_JSON, JSON.stringify(health, null, 2), "utf8");
  logZhDiag("end_of_run_after_health", roundsExecuted);
  console.log(
    "[zh-cluster-publish-pipeline] articlesStaged:",
    articlesStaged,
    "stagedFilesWrittenThisRun:",
    stagedFilesWrittenThisRun,
    "minFilesWrittenThisRun:",
    minFilesWrittenThisRun,
    "rounds:",
    roundsExecuted,
    "attemptsUsed:",
    attemptsUsed,
    "health:",
    HEALTH_JSON
  );
  return {
    stagedFilesWrittenThisRun,
    success: fileThroughputSatisfied,
    articlesStaged
  };
}

async function main() {
  const r = await runZhClusterPublishPipeline();
  process.exit(r.success ? 0 : 1);
}

function isZhPipelineCliEntry(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(entry);
}

if (isZhPipelineCliEntry()) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
