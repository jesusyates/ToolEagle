/**
 * Manual batch: optional EN then optional ZH (sequential).
 * - Only runs a pipeline when its target > 0 (no default 50/50; omit flag ⇒ 0).
 * - No scheduler / setInterval; outer while advances toward --en/--zh caps.
 * - Stops a language after **2 consecutive rounds with stagedFilesWrittenThisRun=0**, or max rounds cap.
 */
import fs from "node:fs";
import path from "node:path";
import { runClusterPublishPipeline } from "./cluster-publish-pipeline";
import { runZhClusterPublishPipeline } from "./zh-cluster-publish-pipeline";

console.log("[content-batch] disabled by manual override (diagnosis mode)");
process.exit(0);

const CLUSTER_PUBLISH_HEALTH_JSON = path.join(process.cwd(), "generated", "cluster-publish-run-health.json");
const ZH_HEALTH_JSON = path.join(process.cwd(), "generated", "seo-zh-publish-health.json");

/** Safety valve: max invocations per language (not consecutive-zero rounds). */
const MAX_OUTER_ROUNDS_PER_LANG = 500;
/** Require two consecutive zero-output rounds before giving up on that language. */
const CONSECUTIVE_NO_PROGRESS_TO_STOP = 2;

function parseTargets(argv: string[]): { en: number; zh: number } {
  let en = 0;
  let zh = 0;
  for (const a of argv) {
    if (a.startsWith("--en=")) en = Math.max(0, parseInt(a.slice(5), 10) || 0);
    if (a.startsWith("--zh=")) zh = Math.max(0, parseInt(a.slice(5), 10) || 0);
  }
  return { en, zh };
}

function readJsonSafe<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

/** After a pipeline run with 0 staged, echo cluster-publish-run-health.json diag + blockers. */
function logEnRoundDiagnostics(stagedThisRun: number, round: number, cumulative: number, target: number): void {
  const health = readJsonSafe<{
    blockerReasonCounts?: Record<string, number>;
    topBlockers?: [string, number][];
    diagEn?: Record<string, unknown>;
  }>(CLUSTER_PUBLISH_HEALTH_JSON);
  const blockers = health?.blockerReasonCounts ?? null;
  const qg = blockers ? Object.entries(blockers).filter(([k]) => k.startsWith("quality_gate:")).reduce((s, [, v]) => s + v, 0) : 0;
  const top = health?.topBlockers ?? [];
  let diagnosis: string;
  if (qg > 0) {
    diagnosis = "likely_pre_staged_quality_gate_or_quality_gate_prefix";
  } else if (blockers && Object.keys(blockers).length > 0) {
    diagnosis = "pipeline_gates_or_supply_not_quality_gate_only";
  } else {
    diagnosis = "no_blocker_snapshot_or_rebuild_failed_see_cluster_logs";
  }
  console.log(
    `[content-batch] EN round=${round} stagedThisRun=${stagedThisRun} cumulative=${cumulative}/${target} successCount_this_round=${stagedThisRun}`
  );
  console.log(
    `[content-batch] EN diagnostic round=${round} ${diagnosis} quality_gate_key_hits=${qg} topBlockers=${JSON.stringify(top.slice(0, 8))}`
  );
  if (health?.diagEn) {
    console.log(`[content-batch] EN diagEn=${JSON.stringify(health.diagEn)}`);
  }
  if (blockers && Object.keys(blockers).length > 0) {
    console.log(`[content-batch] EN blockerReasonCounts=${JSON.stringify(blockers)}`);
  }
}

/** True when last pipeline run recorded rebuild_provider_insufficient_balance (DeepSeek quota). */
function enHealthIndicatesProviderInsufficientBalance(): boolean {
  const health = readJsonSafe<{
    blockerReasonCounts?: Record<string, number>;
  }>(CLUSTER_PUBLISH_HEALTH_JSON);
  const b = health?.blockerReasonCounts;
  if (!b) return false;
  for (const k of Object.keys(b)) {
    if (k.includes("rebuild_provider_insufficient_balance")) return true;
  }
  return false;
}

/** True when cluster-publish-run-health.json blockers point at topic pool / pre-dedup supply. */
function enLastRunLooksLikeTopicSupplyPressure(): boolean {
  const health = readJsonSafe<{
    blockerReasonCounts?: Record<string, number>;
  }>(CLUSTER_PUBLISH_HEALTH_JSON);
  const b = health?.blockerReasonCounts;
  if (!b) return false;
  for (const k of Object.keys(b)) {
    if (k.startsWith("topic_pool:") || k.startsWith("pre_dedup_softpass:")) return true;
  }
  return false;
}

/** Top 5 blocker keys by count from cluster-publish-run-health.json; none / unavailable if absent. */
function enHealthTopFiveBlockersFormatted(): string {
  const health = readJsonSafe<{
    blockerReasonCounts?: Record<string, number>;
  }>(CLUSTER_PUBLISH_HEALTH_JSON);
  if (health === null) return "unavailable";
  const b = health.blockerReasonCounts;
  if (!b || Object.keys(b).length === 0) return "none";
  return Object.entries(b)
    .sort((a, z) => z[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
}

function logEnOuterRunSummary(stagedFilesWrittenThisRun: number): void {
  console.log("[content-batch][EN summary]");
  console.log(`stagedFilesWrittenThisRun=${stagedFilesWrittenThisRun}`);
  console.log(`topicSupplyPressure=${enLastRunLooksLikeTopicSupplyPressure()}`);
  console.log(`topBlockers=${enHealthTopFiveBlockersFormatted()}`);
}

function logZhRoundDiagnostics(
  stagedThisRun: number,
  round: number,
  cumulative: number,
  target: number,
  r: Awaited<ReturnType<typeof runZhClusterPublishPipeline>>
): void {
  const zhHealth = readJsonSafe<{
    error?: string | null;
    success?: boolean;
    diagZh?: Record<string, unknown>;
  }>(ZH_HEALTH_JSON);
  console.log(
    `[content-batch] ZH round=${round} stagedThisRun=${stagedThisRun} cumulative=${cumulative}/${target} articlesStaged=${r.articlesStaged} success=${r.success}`
  );
  let diagnosis: string;
  if (stagedThisRun > 0) {
    diagnosis = "n/a_progress";
  } else {
    diagnosis =
      zhHealth?.error != null && zhHealth.error !== ""
        ? "zh_pipeline_error_see_logs"
        : "zh_no_staged_see_zh_cluster_logs_for_gate_audit";
  }
  console.log(`[content-batch] ZH diagnostic round=${round} ${diagnosis}`);
  if (zhHealth?.diagZh) {
    console.log(`[content-batch] ZH diagZh=${JSON.stringify(zhHealth.diagZh)}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const { en: targetEn, zh: targetZh } = parseTargets(argv);

  console.log(
    `[content-batch] parsed argv=${JSON.stringify(argv)} → --en=${targetEn} --zh=${targetZh} (unspecified flags count as 0; no fallback to the other language)`
  );

  if (targetEn === 0 && targetZh === 0) {
    console.error(
      "[content-batch] nothing to do: pass --en=N and/or --zh=N (e.g. npm run content:batch -- --zh=2). Exiting."
    );
    process.exit(1);
  }

  let successEn = 0;
  let enMet = targetEn === 0;
  if (targetEn > 0) {
    console.log(
      `[content-batch] running EN pipeline until staged += ${targetEn} or ${CONSECUTIVE_NO_PROGRESS_TO_STOP} consecutive no-progress rounds`
    );
    let outer = 0;
    let consecutiveZero = 0;
    let enProviderQuotaExhausted = false;
    while (successEn < targetEn && outer < MAX_OUTER_ROUNDS_PER_LANG && !enProviderQuotaExhausted) {
      outer++;
      const r = await runClusterPublishPipeline({
        source: "content-batch",
        contentBatchStagedTarget: targetEn
      });
      let added = r.stagedFilesWrittenThisRun ?? 0;

      if (enHealthIndicatesProviderInsufficientBalance()) {
        console.log("[content-batch] EN provider quota exhausted, stopping batch");
        enProviderQuotaExhausted = true;
        break;
      }

      /**
       * Topic pool exhaustion from topic_already_staged / pre_dedup_softpass happens inside one pipeline run.
       * We cannot push replacement topics from here (that lives in cluster-publish). Mitigation: when the
       * last run shows supply-side blockers only, immediately re-invoke the full EN pipeline (fresh clusters)
       * a few times before counting a no-progress round — refill-style retries, EN-only.
       */
      if (added === 0) {
        const maxSupplyRefills = 3;
        let refill = 0;
        while (
          added === 0 &&
          refill < maxSupplyRefills &&
          enLastRunLooksLikeTopicSupplyPressure() &&
          !enProviderQuotaExhausted
        ) {
          refill++;
          console.log(
            `[content-batch] EN topic-supply refill attempt ${refill}/${maxSupplyRefills} (topic_pool / pre_dedup_softpass → fresh cluster generation)`
          );
          const rRefill = await runClusterPublishPipeline({
            source: "content-batch",
            contentBatchStagedTarget: targetEn
          });
          added = rRefill.stagedFilesWrittenThisRun ?? 0;
          if (enHealthIndicatesProviderInsufficientBalance()) {
            console.log("[content-batch] EN provider quota exhausted, stopping batch");
            enProviderQuotaExhausted = true;
            break;
          }
        }
        if (enProviderQuotaExhausted) break;
        if (added === 0 && refill >= maxSupplyRefills && enLastRunLooksLikeTopicSupplyPressure()) {
          console.log("[topic-pool] exhausted cluster topics, no replacement available");
        }
      }

      logEnOuterRunSummary(added);

      if (added === 0) {
        logEnRoundDiagnostics(added, outer, successEn, targetEn);
        consecutiveZero++;
        console.log(
          `[content-batch] EN stop: stagedFilesWrittenThisRun=0 (success=${successEn}/${targetEn}) consecutive_no_progress=${consecutiveZero}/${CONSECUTIVE_NO_PROGRESS_TO_STOP}`
        );
        if (consecutiveZero >= CONSECUTIVE_NO_PROGRESS_TO_STOP) {
          console.log(
            `[content-batch] EN stopped after consecutive no-progress rounds=${consecutiveZero} (see [quality-gate] / cluster-publish logs if quality_gate blockers)`
          );
          break;
        }
        continue;
      }
      consecutiveZero = 0;
      successEn += added;
      console.log(
        `[content-batch] EN round ${outer} target=${targetEn} cumulative=${successEn} added_this_call=${added} successCount_this_round=${added}`
      );
      if (successEn >= targetEn) break;
    }
    if (outer >= MAX_OUTER_ROUNDS_PER_LANG && successEn < targetEn) {
      console.error(`[content-batch] EN aborted: exceeded MAX_OUTER_ROUNDS_PER_LANG=${MAX_OUTER_ROUNDS_PER_LANG}`);
      process.exit(1);
    }
    enMet = successEn >= targetEn;
  } else {
    console.log("[content-batch] skip EN pipeline (--en=0 or omitted)");
  }

  let successZh = 0;
  let zhMet = targetZh === 0;
  if (targetZh > 0) {
    console.log(
      `[content-batch] running ZH pipeline until staged += ${targetZh} or ${CONSECUTIVE_NO_PROGRESS_TO_STOP} consecutive no-progress rounds`
    );
    let outer = 0;
    let consecutiveZero = 0;
    while (successZh < targetZh && outer < MAX_OUTER_ROUNDS_PER_LANG) {
      outer++;
      const r = await runZhClusterPublishPipeline();
      const added = r.stagedFilesWrittenThisRun ?? 0;
      if (added === 0) {
        logZhRoundDiagnostics(added, outer, successZh, targetZh, r);
        consecutiveZero++;
        console.log(
          `[content-batch] ZH stop: stagedFilesWrittenThisRun=0 (success=${successZh}/${targetZh}) consecutive_no_progress=${consecutiveZero}/${CONSECUTIVE_NO_PROGRESS_TO_STOP}`
        );
        if (consecutiveZero >= CONSECUTIVE_NO_PROGRESS_TO_STOP) {
          console.log(
            `[content-batch] ZH stopped after consecutive no-progress rounds=${consecutiveZero} (check zh-cluster-publish logs for gate/audit)`
          );
          break;
        }
        continue;
      }
      consecutiveZero = 0;
      successZh += added;
      console.log(
        `[content-batch] ZH round ${outer} target=${targetZh} cumulative=${successZh} added_this_call=${added} successCount_this_round=${added}`
      );
      if (successZh >= targetZh) break;
    }
    if (outer >= MAX_OUTER_ROUNDS_PER_LANG && successZh < targetZh) {
      console.error(`[content-batch] ZH aborted: exceeded MAX_OUTER_ROUNDS_PER_LANG=${MAX_OUTER_ROUNDS_PER_LANG}`);
      process.exit(1);
    }
    zhMet = successZh >= targetZh;
  } else {
    console.log("[content-batch] skip ZH pipeline (--zh=0 or omitted)");
  }

  console.log(
    `[content-batch] done EN=${successEn}/${targetEn} met=${enMet} ZH=${successZh}/${targetZh} met=${zhMet}`
  );
  process.exit(enMet && zhMet ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
