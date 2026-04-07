/**
 * Manual batch: optional EN then optional ZH (sequential).
 * - Only runs a pipeline when its target > 0 (no default 50/50; omit flag ⇒ 0).
 * - No scheduler / setInterval; outer while only advances toward --en/--zh caps or stops on 0 added.
 */
import { runClusterPublishPipeline } from "./cluster-publish-pipeline";
import { runZhClusterPublishPipeline } from "./zh-cluster-publish-pipeline";

/** Safety valve: one invocation of cluster-publish-pipeline / zh-cluster-publish-pipeline per iteration. */
const MAX_OUTER_ROUNDS_PER_LANG = 500;

function parseTargets(argv: string[]): { en: number; zh: number } {
  let en = 0;
  let zh = 0;
  for (const a of argv) {
    if (a.startsWith("--en=")) en = Math.max(0, parseInt(a.slice(5), 10) || 0);
    if (a.startsWith("--zh=")) zh = Math.max(0, parseInt(a.slice(5), 10) || 0);
  }
  return { en, zh };
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
    console.log(`[content-batch] running EN pipeline (cluster-publish-pipeline) until staged += ${targetEn} or no progress`);
    let outer = 0;
    while (successEn < targetEn && outer < MAX_OUTER_ROUNDS_PER_LANG) {
      outer++;
      const r = await runClusterPublishPipeline({
        source: "content-batch",
        contentBatchStagedTarget: targetEn
      });
      const added = r.stagedFilesWrittenThisRun ?? 0;
      if (added === 0) {
        console.log(
          `[content-batch] EN stop: stagedFilesWrittenThisRun=0 (success=${successEn}/${targetEn}); not falling back to ZH`
        );
        break;
      }
      successEn += added;
      console.log(`[content-batch] EN round ${outer} target=${targetEn} cumulative=${successEn} added_this_call=${added}`);
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
      `[content-batch] running ZH pipeline (zh-cluster-publish-pipeline) until staged += ${targetZh} or no progress (EN not used unless --en>0)`
    );
    let outer = 0;
    while (successZh < targetZh && outer < MAX_OUTER_ROUNDS_PER_LANG) {
      outer++;
      const r = await runZhClusterPublishPipeline();
      const added = r.stagedFilesWrittenThisRun ?? 0;
      if (added === 0) {
        console.log(
          `[content-batch] ZH stop: stagedFilesWrittenThisRun=0 (success=${successZh}/${targetZh}); check logs above for cluster-gate / topic-gate / language-gate / publish-gate / audit`
        );
        break;
      }
      successZh += added;
      console.log(`[content-batch] ZH round ${outer} target=${targetZh} cumulative=${successZh} added_this_call=${added}`);
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
