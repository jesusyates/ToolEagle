/**

 * Long-running EN guides factory: periodic cluster → staged, periodic publish → auto-posts.

 * Run: npm run seo:factory:watch

 */



import fs from "fs/promises";

import path from "path";

import { runClusterPublishPipeline } from "./cluster-publish-pipeline";

import { runPublishStagedGuides } from "./publish-staged-guides";

import { getStagedGuideCount } from "../src/lib/auto-posts-reader";



const FACTORY_STATUS_JSON = path.join(process.cwd(), "generated", "seo-guides-factory-status.json");



const DEFAULT_GEN_MS = 5 * 60 * 1000;

const DEFAULT_PUBLISH_MS = 24 * 60 * 60 * 1000;



/** Optional env overrides for local stability tests only (defaults unchanged). */

function intervalFromEnv(name: string, defaultMs: number): number {

  const raw = process.env[name];

  if (raw == null || raw === "") return defaultMs;

  const n = parseInt(raw, 10);

  if (!Number.isFinite(n) || n < 1) return defaultMs;

  return n;

}



const GEN_MS = intervalFromEnv("GENERATE_INTERVAL_MS", DEFAULT_GEN_MS);

const PUBLISH_MS = intervalFromEnv("PUBLISH_INTERVAL_MS", DEFAULT_PUBLISH_MS);

const PUBLISH_BATCH = 1;

const MIN_STAGED_TARGET = 10;



const MIN_FILES_DEFAULT = Math.max(1, parseInt(process.env.MIN_FILES_WRITTEN_PER_RUN ?? "1", 10) || 1);

const MIN_FILES_INV = Math.max(1, parseInt(process.env.MIN_FILES_WRITTEN_PER_RUN_INVENTORY_LOW ?? "2", 10) || 1);

const MAX_FACTORY_PASSES = Math.max(1, parseInt(process.env.EN_FACTORY_MAX_GENERATE_PASSES ?? "8", 10) || 1);



function resolveMinFilesForFactory(inventoryLow: boolean): number {

  return inventoryLow ? MIN_FILES_INV : MIN_FILES_DEFAULT;

}



export type SeoGuidesFactoryStatus = {

  startedAt: string;

  lastGenerateRunAt: string | null;

  lastPublishRunAt: string | null;

  stagedCount: number;

  lastGeneratedCount: number;

  lastPublishedCount: number;

  running: boolean;

  lastError: string | null;

  inventoryLow?: boolean;

  lastAttemptsUsed?: number;

  lastRetryCount?: number;

  currentGenerateIntervalMs?: number;

  currentPublishIntervalMs?: number;

  minStagedTarget?: number;

  refillTriggered?: boolean;

  refillAttempts?: number;

  generateRunning?: boolean;

  stagedFilesWrittenThisRun?: number;

  publishedFilesWrittenThisRun?: number;

  minFilesWrittenPerRun?: number;

  fileThroughputSatisfied?: boolean;

  throughputFailureReason?: string | null;

};



let status: SeoGuidesFactoryStatus = {

  startedAt: new Date().toISOString(),

  lastGenerateRunAt: null,

  lastPublishRunAt: null,

  stagedCount: 0,

  lastGeneratedCount: 0,

  lastPublishedCount: 0,

  running: true,

  lastError: null

};



let generateCycleBusy = false;



function formatIntervalLabel(ms: number): string {

  if (ms >= 60 * 60 * 1000 && ms % (60 * 60 * 1000) === 0) return `${ms / (60 * 60 * 1000)}h`;

  if (ms >= 60 * 1000 && ms % (60 * 1000) === 0) return `${ms / (60 * 1000)}m`;

  return `${ms}ms`;

}



async function writeFactoryStatus(): Promise<void> {

  status.stagedCount = await getStagedGuideCount();

  status.currentGenerateIntervalMs = GEN_MS;

  status.currentPublishIntervalMs = PUBLISH_MS;

  status.minStagedTarget = MIN_STAGED_TARGET;

  status.inventoryLow = status.stagedCount < MIN_STAGED_TARGET;

  await fs.mkdir(path.dirname(FACTORY_STATUS_JSON), { recursive: true });

  await fs.writeFile(FACTORY_STATUS_JSON, JSON.stringify(status, null, 2), "utf8");

}



async function runGenerateCycle(): Promise<void> {

  const at = new Date().toISOString();

  console.log(`[seo-guides-factory] generate cycle at ${at}`);



  const stagedAtCycleStart = await getStagedGuideCount();

  const inventoryLow = stagedAtCycleStart < MIN_STAGED_TARGET;

  const minFiles = resolveMinFilesForFactory(inventoryLow);

  status.minFilesWrittenPerRun = minFiles;

  status.refillTriggered = false;

  status.refillAttempts = 0;

  status.stagedFilesWrittenThisRun = 0;

  status.fileThroughputSatisfied = false;

  status.throughputFailureReason = null;



  let attemptsSum = 0;

  let lastRetry = 0;



  try {

    for (let pass = 0; pass < MAX_FACTORY_PASSES; pass++) {

      const r = await runClusterPublishPipeline({

        source: pass === 0 ? "seo-guides-factory" : `seo-guides-factory-refill-${pass}`

      });

      attemptsSum += r.attemptsUsed ?? 0;

      lastRetry = r.retryCount ?? 0;

      const stagedNow = await getStagedGuideCount();

      const totalStagedDelta = Math.max(0, stagedNow - stagedAtCycleStart);



      status.lastGenerateRunAt = at;

      status.lastGeneratedCount = r.articlesPassed;

      status.lastAttemptsUsed = attemptsSum;

      status.lastRetryCount = lastRetry;

      status.stagedFilesWrittenThisRun = totalStagedDelta;

      status.fileThroughputSatisfied = totalStagedDelta >= minFiles;

      status.throughputFailureReason = status.fileThroughputSatisfied

        ? null

        : `staged_files_written_this_cycle=${totalStagedDelta} min_required=${minFiles}`;

      status.lastError = status.fileThroughputSatisfied ? null : status.throughputFailureReason;



      await writeFactoryStatus();



      if (totalStagedDelta >= minFiles) break;

      if (pass < MAX_FACTORY_PASSES - 1) {

        status.refillTriggered = true;

        status.refillAttempts = (status.refillAttempts ?? 0) + 1;

        console.log(

          `[seo-guides-factory] refill pass ${pass + 2}/${MAX_FACTORY_PASSES} disk_delta=${totalStagedDelta}/${minFiles}`

        );

      }

    }



    if (!status.fileThroughputSatisfied) {

      status.lastError = status.throughputFailureReason ?? "throughput_target_not_met";

    } else {

      status.lastError = null;

    }

    await writeFactoryStatus();

  } catch (e) {

    const msg = e instanceof Error ? e.message : String(e);

    status.lastError = msg;

    status.throughputFailureReason = msg;

    status.fileThroughputSatisfied = false;

    await writeFactoryStatus();

    console.error("[seo-guides-factory] generate cycle error", e);

  }

}



async function scheduleGenerateTick(): Promise<void> {

  if (generateCycleBusy) {

    console.log("[generate] skipped: previous cycle still running");

    return;

  }

  generateCycleBusy = true;

  status.generateRunning = true;

  await writeFactoryStatus();

  try {

    await runGenerateCycle();

  } finally {

    generateCycleBusy = false;

    status.generateRunning = false;

    await writeFactoryStatus();

  }

}



async function runPublishCycle(): Promise<void> {

  const n = await getStagedGuideCount();

  if (n === 0) {

    console.log("[seo-guides-factory] publish cycle skipped (no staged files)");

    status.lastPublishRunAt = new Date().toISOString();

    status.lastPublishedCount = 0;

    status.publishedFilesWrittenThisRun = 0;

    await writeFactoryStatus();

    return;

  }

  const at = new Date().toISOString();

  console.log(`[seo-guides-factory] publish cycle at ${at}`);

  try {

    const r = await runPublishStagedGuides(PUBLISH_BATCH);

    status.lastPublishRunAt = at;

    status.lastPublishedCount = r.publishedCount;

    status.publishedFilesWrittenThisRun = r.publishedCount;

    status.lastError = null;

    await writeFactoryStatus();

  } catch (e) {

    status.lastError = e instanceof Error ? e.message : String(e);

    await writeFactoryStatus();

    console.error("[seo-guides-factory] publish cycle error", e);

  }

}



async function main() {

  status.startedAt = new Date().toISOString();

  status.running = true;

  status.lastError = null;

  await writeFactoryStatus();



  const genLabel =

    GEN_MS === DEFAULT_GEN_MS ? formatIntervalLabel(DEFAULT_GEN_MS) : `${formatIntervalLabel(GEN_MS)} (GENERATE_INTERVAL_MS)`;

  const pubLabel =

    PUBLISH_MS === DEFAULT_PUBLISH_MS

      ? formatIntervalLabel(DEFAULT_PUBLISH_MS)

      : `${formatIntervalLabel(PUBLISH_MS)} (PUBLISH_INTERVAL_MS)`;

  console.log(

    `[seo-guides-factory] [factory] started; generate every ${genLabel}, publish every ${pubLabel}, min staged target=${MIN_STAGED_TARGET} (1 article when staged); timers keep process alive`

  );

  await scheduleGenerateTick();



  const stagedAfterGen = await getStagedGuideCount();

  if (stagedAfterGen > 0) {

    console.log("[seo-guides-factory] initial publish check (staged > 0)");

    await runPublishCycle();

  }



  setInterval(() => {

    scheduleGenerateTick().catch((e) => console.error(e));

  }, GEN_MS);



  setInterval(() => {

    runPublishCycle().catch((e) => console.error(e));

  }, PUBLISH_MS);



  const shutdown = async () => {

    status.running = false;

    await writeFactoryStatus();

    console.log("[seo-guides-factory] shutdown");

    process.exit(0);

  };

  process.on("SIGINT", shutdown);

  process.on("SIGTERM", shutdown);



  // Hold the process open: some runners (e.g. tsx) may exit when the async main() promise

  // settles even while setInterval is scheduled; an unsettled await keeps the event loop alive.

  await new Promise<void>(() => {});

}



main().catch(async (e) => {

  status.lastError = e instanceof Error ? e.message : String(e);

  status.running = false;

  await writeFactoryStatus();

  console.error(e);

  process.exit(1);

});


