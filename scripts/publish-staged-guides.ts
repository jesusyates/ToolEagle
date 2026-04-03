/**
 * Promote EN guides from content/staged-guides → content/auto-posts (indexing + history).
 * Usage: npx tsx scripts/publish-staged-guides.ts [--count=5]  (default 1)
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { enqueueIndexingUrl } from "../src/lib/indexing-queue";
import { SITE_URL } from "../src/config/site";
import { getStagedGuideCount } from "../src/lib/auto-posts-reader";
import { auditPublishedGuideMarkdown } from "../src/lib/seo/published-guide-audit";
import type { SeoGuidesPublishHealth } from "./cluster-publish-pipeline";

const STAGED_DIR = path.join(process.cwd(), "content", "staged-guides");
const AUTO_DIR = path.join(process.cwd(), "content", "auto-posts");
const HEALTH_JSON = path.join(process.cwd(), "generated", "seo-guides-publish-health.json");
const STAGED_STATUS_JSON = path.join(process.cwd(), "generated", "staged-guides-status.json");
const PUBLISH_HISTORY_JSON = path.join(process.cwd(), "generated", "publish-history.json");

type HistoryFile = {
  runs: Array<{ publishedAt: string; filenames: string[]; count: number }>;
};

function parseCount(): number {
  const a = process.argv.find((x) => x.startsWith("--count="));
  if (!a) return 1;
  const n = parseInt(a.slice("--count=".length), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

async function loadJson<T>(p: string, fb: T): Promise<T> {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fb;
  }
}

export type PublishStagedResult = {
  publishedCount: number;
  publishedFiles: string[];
  stagedRemaining: number;
  finalAuditPassed?: number;
  finalAuditFailed?: number;
  finalAuditFailedReasonsTop?: Record<string, number>;
};

function topFailedReasons(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15));
}

/** Core promote logic (CLI + seo-guides-factory). */
export async function runPublishStagedGuides(count: number): Promise<PublishStagedResult> {
  const files = (await fs.readdir(STAGED_DIR).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    const remaining = await getStagedGuideCount();
    await writeStatusFiles({
      stagedCount: remaining,
      remainingStagedCount: remaining,
      publishedCountThisRun: 0,
      publishedFiles: [],
      finalAuditPassed: 0,
      finalAuditFailed: 0,
      finalAuditFailedReasonsTop: {},
      publishedFilesWrittenThisRun: 0,
      fileThroughputSatisfied: true,
      throughputFailureReason: null
    });
    return {
      publishedCount: 0,
      publishedFiles: [],
      stagedRemaining: remaining,
      finalAuditPassed: 0,
      finalAuditFailed: 0,
      finalAuditFailedReasonsTop: {}
    };
  }

  await fs.mkdir(AUTO_DIR, { recursive: true });

  const publishedFiles: string[] = [];
  const baseSite = SITE_URL.replace(/\/$/, "");
  const sorted = [...files].sort();
  const reasonCounts: Record<string, number> = {};
  let finalAuditPassed = 0;
  let finalAuditFailed = 0;

  for (const name of sorted) {
    if (publishedFiles.length >= count) break;
    const from = path.join(STAGED_DIR, name);
    const raw = await fs.readFile(from, "utf8");
    const audit = auditPublishedGuideMarkdown(name, raw);
    if (audit.decision !== "pass") {
      finalAuditFailed++;
      for (const r of audit.reasons) reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
      console.log(
        "[publish-staged-guides] final audit skip",
        name,
        audit.decision,
        audit.reasons.join(", ")
      );
      continue;
    }
    finalAuditPassed++;
    const dest = path.join(AUTO_DIR, name);
    await fs.rename(from, dest);
    publishedFiles.push(name);
    const { data } = matter(raw);
    const slug = typeof data.slug === "string" ? data.slug : "";
    if (slug) {
      enqueueIndexingUrl({ url: `${baseSite}/guides/${slug}`, source: "publish-staged-guides" });
    }
  }

  const publishedAt = new Date().toISOString();
  const hist = await loadJson<HistoryFile>(PUBLISH_HISTORY_JSON, { runs: [] });
  hist.runs.push({ publishedAt, filenames: publishedFiles, count: publishedFiles.length });
  await fs.mkdir(path.dirname(PUBLISH_HISTORY_JSON), { recursive: true });
  await fs.writeFile(PUBLISH_HISTORY_JSON, JSON.stringify(hist, null, 2), "utf8");

  const remaining = await getStagedGuideCount();
  const reasonsTop = topFailedReasons(reasonCounts);
  const hadStagedToPublish = sorted.length > 0;
  const publishThroughputOk = !hadStagedToPublish || publishedFiles.length > 0;
  const publishThroughputFailureReason = publishThroughputOk
    ? null
    : `publish_low_throughput: had_staged=${hadStagedToPublish} published_files_written=${publishedFiles.length}`;
  await writeStatusFiles({
    stagedCount: remaining,
    remainingStagedCount: remaining,
    publishedCountThisRun: publishedFiles.length,
    publishedFiles,
    finalAuditPassed,
    finalAuditFailed,
    finalAuditFailedReasonsTop: reasonsTop,
    publishedFilesWrittenThisRun: publishedFiles.length,
    fileThroughputSatisfied: publishThroughputOk,
    throughputFailureReason: publishThroughputFailureReason
  });

  console.log(
    "[publish-staged-guides] moved",
    publishedFiles.length,
    "→ auto-posts;",
    "remaining staged:",
    remaining
  );

  return {
    publishedCount: publishedFiles.length,
    publishedFiles,
    stagedRemaining: remaining,
    finalAuditPassed,
    finalAuditFailed,
    finalAuditFailedReasonsTop: reasonsTop
  };
}

async function writeStatusFiles(stats: {
  stagedCount: number;
  remainingStagedCount: number;
  publishedCountThisRun: number;
  publishedFiles: string[];
  finalAuditPassed: number;
  finalAuditFailed: number;
  finalAuditFailedReasonsTop: Record<string, number>;
  publishedFilesWrittenThisRun?: number;
  fileThroughputSatisfied?: boolean;
  throughputFailureReason?: string | null;
}) {
  const updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(STAGED_STATUS_JSON), { recursive: true });
  await fs.writeFile(
    STAGED_STATUS_JSON,
    JSON.stringify({ updatedAt, ...stats }, null, 2),
    "utf8"
  );

  const prev = await loadJson<Partial<SeoGuidesPublishHealth> | Record<string, unknown>>(HEALTH_JSON, {});
  const stagedFromPrev =
    typeof prev.stagedFilesWrittenThisRun === "number" ? prev.stagedFilesWrittenThisRun : undefined;
  const merged: SeoGuidesPublishHealth = {
    runAt: updatedAt,
    success: stats.fileThroughputSatisfied !== false,
    clustersGenerated: Number(prev.clustersGenerated) || 0,
    topicsPassed: Number(prev.topicsPassed) || 0,
    articlesPassed: Number(prev.articlesPassed) || 0,
    articlesPassedByCluster:
      (prev.articlesPassedByCluster as Record<string, number>) &&
      typeof prev.articlesPassedByCluster === "object"
        ? (prev.articlesPassedByCluster as Record<string, number>)
        : {},
    fallbackUsed: Boolean(prev.fallbackUsed),
    publishErrors: Array.isArray(prev.publishErrors) ? (prev.publishErrors as string[]) : [],
    error: (prev.error as string | null) ?? null,
    source: String(prev.source || "publish-staged-guides"),
    stagedCount: stats.stagedCount,
    remainingStagedCount: stats.remainingStagedCount,
    publishedCountThisRun: stats.publishedCountThisRun,
    publishedFiles: stats.publishedFiles,
    languageGatePassed: typeof prev.languageGatePassed === "number" ? prev.languageGatePassed : undefined,
    languageGateFailedCount:
      typeof prev.languageGateFailedCount === "number" ? prev.languageGateFailedCount : undefined,
    finalAuditPassed: stats.finalAuditPassed,
    finalAuditFailed: stats.finalAuditFailed,
    finalAuditFailedReasonsTop: stats.finalAuditFailedReasonsTop,
    stagedFilesWrittenThisRun: stagedFromPrev ?? 0,
    publishedFilesWrittenThisRun: stats.publishedFilesWrittenThisRun ?? stats.publishedCountThisRun,
    minFilesWrittenPerRun: typeof prev.minFilesWrittenPerRun === "number" ? prev.minFilesWrittenPerRun : 1,
    fileThroughputSatisfied: stats.fileThroughputSatisfied ?? true,
    throughputFailureReason: stats.throughputFailureReason ?? (prev.throughputFailureReason as string | null) ?? null
  };
  await fs.writeFile(HEALTH_JSON, JSON.stringify(merged, null, 2), "utf8");
}

async function main() {
  const count = parseCount();
  try {
    await runPublishStagedGuides(count);
  } catch (e) {
    console.error(`[publish-staged-guides] failed`, e);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
