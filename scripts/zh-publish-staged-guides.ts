/**
 * 中文 staged → zh-guides：发布前再次终审，仅 pass 移动。
 */

import fs from "fs/promises";
import path from "path";
import { auditZhGuideMarkdown } from "../src/lib/seo-zh/zh-guide-audit";

const ZH_STAGED = path.join(process.cwd(), "content", "zh-staged-guides");
const ZH_GUIDES = path.join(process.cwd(), "content", "zh-guides");
const HEALTH_JSON = path.join(process.cwd(), "generated", "seo-zh-publish-health.json");
const HISTORY_JSON = path.join(process.cwd(), "generated", "seo-zh-publish-history.json");

function parseCount(): number {
  const a = process.argv.find((x) => x.startsWith("--count="));
  if (!a) return 1;
  const n = parseInt(a.slice("--count=".length), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

type HistoryFile = {
  runs: Array<{ publishedAt: string; filenames: string[]; count: number }>;
};

async function loadHistory(): Promise<HistoryFile> {
  try {
    const raw = await fs.readFile(HISTORY_JSON, "utf8");
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (Array.isArray(j.runs)) return { runs: j.runs as HistoryFile["runs"] };
    const entries = j.entries as Array<{ at: string; files: string[]; count: number }> | undefined;
    if (entries?.length) {
      return {
        runs: entries.map((e) => ({
          publishedAt: e.at,
          filenames: e.files,
          count: e.count
        }))
      };
    }
  } catch {
    /* first run */
  }
  return { runs: [] };
}

async function main() {
  const count = parseCount();
  const files = (await fs.readdir(ZH_STAGED).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();
  const candidates = files.slice(0, Math.min(count, files.length));
  await fs.mkdir(ZH_GUIDES, { recursive: true });

  const toMove: string[] = [];
  let finalAuditPassed = 0;
  let finalAuditFailed = 0;
  const finalAuditFailedReasonsTop: Record<string, number> = {};

  for (const name of candidates) {
    const full = path.join(ZH_STAGED, name);
    const raw = await fs.readFile(full, "utf8");
    const audit = auditZhGuideMarkdown(name, raw);
    if (audit.decision !== "pass") {
      finalAuditFailed++;
      for (const r of audit.reasons) {
        finalAuditFailedReasonsTop[r] = (finalAuditFailedReasonsTop[r] ?? 0) + 1;
      }
      console.log(`[zh-publish-staged-guides] skip audit decision=${audit.decision} ${name} ${audit.reasons.join(",")}`);
      continue;
    }
    await fs.rename(full, path.join(ZH_GUIDES, name));
    toMove.push(name);
    finalAuditPassed++;
  }

  let prev: Record<string, unknown> = {};
  try {
    prev = JSON.parse(await fs.readFile(HEALTH_JSON, "utf8")) as Record<string, unknown>;
  } catch {
    /* no file */
  }
  const runAt = new Date().toISOString();
  const hadStaged = candidates.length > 0;
  const publishThroughputOk = !hadStaged || toMove.length > 0;
  const health = {
    ...prev,
    runAt,
    success: publishThroughputOk,
    lastPublishedCount: toMove.length,
    lastPublishedFiles: toMove,
    publishedFilesWrittenThisRun: toMove.length,
    publishFinalAuditPassed: finalAuditPassed,
    publishFinalAuditFailed: finalAuditFailed,
    publishFinalAuditFailedReasonsTop: finalAuditFailedReasonsTop,
    fileThroughputSatisfied: publishThroughputOk,
    throughputFailureReason: publishThroughputOk
      ? null
      : `publish_low_throughput: had_staged=${hadStaged} published_files_written=${toMove.length}`,
    engine: "v300-zh-main-chain"
  };
  await fs.mkdir(path.dirname(HEALTH_JSON), { recursive: true });
  await fs.writeFile(HEALTH_JSON, JSON.stringify(health, null, 2), "utf8");

  const hist = await loadHistory();
  if (toMove.length > 0) {
    hist.runs.push({
      publishedAt: runAt,
      filenames: toMove,
      count: toMove.length
    });
  }
  await fs.writeFile(HISTORY_JSON, JSON.stringify({ runs: hist.runs }, null, 2), "utf8");

  console.log("[zh-publish-staged-guides] moved", toMove.length, "→ content/zh-guides; audit failed:", finalAuditFailed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
