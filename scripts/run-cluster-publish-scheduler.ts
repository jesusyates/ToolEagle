/**
 * Minimal scheduler: run cluster → topic → article → publish → priority state on a fixed interval.
 * No DB, no queue — process stays alive with setInterval (or use daily-engine / OS cron for once/day).
 *
 *   npx tsx scripts/run-cluster-publish-scheduler.ts --once
 *   npx tsx scripts/run-cluster-publish-scheduler.ts --watch
 */

import { runClusterPublishPipeline } from "./cluster-publish-pipeline";

console.log("[cluster-publish-scheduler] disabled by manual override (diagnosis mode)");
process.exit(0);

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function parseArgs(): { mode: "once" | "watch" } {
  const a = process.argv.slice(2);
  if (a.includes("--watch")) return { mode: "watch" };
  return { mode: "once" };
}

async function tick() {
  console.log(`[cluster-publish-scheduler] tick runAt=${new Date().toISOString()}`);
  return runClusterPublishPipeline({ source: "scheduler" });
}

async function main() {
  const { mode } = parseArgs();
  if (mode === "once") {
    const r = await tick();
    process.exit(r.success ? 0 : 1);
    return;
  }
  console.log(`[cluster-publish-scheduler] watch mode: every ${FOUR_HOURS_MS}ms (~4h); first run now`);
  await tick();
  setInterval(() => {
    tick()
      .then((r) => {
        if (!r.success) console.error("[cluster-publish-scheduler] tick reported failure", r.error);
      })
      .catch((e) => {
        console.error("[cluster-publish-scheduler] tick failed", e);
      });
  }, FOUR_HOURS_MS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
