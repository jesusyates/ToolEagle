/**

 * Long-running ZH guides factory: periodic zh cluster → staged, periodic publish → zh-guides.

 * Run: npm run seo:zh:factory:watch

 * Does not embed 主链 logic — shells out to zh-cluster-publish-pipeline / zh-publish-staged-guides.

 */



import fs from "fs/promises";

import path from "path";

import { spawn } from "child_process";



const ZH_STAGED = path.join(process.cwd(), "content", "zh-staged-guides");

const HEALTH_JSON = path.join(process.cwd(), "generated", "seo-zh-publish-health.json");

const FACTORY_STATUS_JSON = path.join(process.cwd(), "generated", "seo-zh-factory-status.json");



const DEFAULT_GEN_MS = 5 * 60 * 1000;

const DEFAULT_PUBLISH_MS = 24 * 60 * 60 * 1000;

const MIN_STAGED_TARGET = 10;



const MIN_FILES_DEFAULT = Math.max(

  1,

  parseInt(process.env.ZH_MIN_FILES_WRITTEN_PER_RUN ?? process.env.MIN_FILES_WRITTEN_PER_RUN ?? "1", 10) || 1

);

const MIN_FILES_INV = Math.max(

  1,

  parseInt(

    process.env.ZH_MIN_FILES_WRITTEN_PER_RUN_INVENTORY_LOW ?? process.env.MIN_FILES_WRITTEN_PER_RUN_INVENTORY_LOW ?? "2",

    10

  ) || 1

);

const MAX_FACTORY_PASSES = Math.max(1, parseInt(process.env.ZH_FACTORY_MAX_GENERATE_PASSES ?? "8", 10) || 1);



function resolveMinFilesForFactory(inventoryLow: boolean): number {

  return inventoryLow ? MIN_FILES_INV : MIN_FILES_DEFAULT;

}



function intervalFromEnv(primary: string, fallback: string, defaultMs: number): number {

  const raw = process.env[primary] ?? process.env[fallback];

  if (raw == null || raw === "") return defaultMs;

  const n = parseInt(raw, 10);

  if (!Number.isFinite(n) || n < 1) return defaultMs;

  return n;

}



const GEN_MS = intervalFromEnv("ZH_GENERATE_INTERVAL_MS", "GENERATE_INTERVAL_MS", DEFAULT_GEN_MS);

const PUBLISH_MS = intervalFromEnv("ZH_PUBLISH_INTERVAL_MS", "PUBLISH_INTERVAL_MS", DEFAULT_PUBLISH_MS);

const PUBLISH_BATCH = 1;



export type SeoZhFactoryStatus = {

  startedAt: string;

  lastGenerateRunAt: string | null;

  lastPublishRunAt: string | null;

  stagedCount: number;

  lastGeneratedCount: number;

  lastPublishedCount: number;

  running: boolean;

  lastError: string | null;

  pipelineSpawnCount?: number;

  retryCount?: number;

  attemptsUsed?: number;

  assetIndexDedupDropped?: number;

  finalAuditFailedReasonsTop?: Record<string, number>;

  roundsExecuted?: number;

  currentGenerateIntervalMs?: number;

  currentPublishIntervalMs?: number;

  minStagedTarget?: number;

  inventoryLow?: boolean;

  refillTriggered?: boolean;

  refillAttempts?: number;

  generateRunning?: boolean;

  stagedFilesWrittenThisRun?: number;

  publishedFilesWrittenThisRun?: number;

  minFilesWrittenPerRun?: number;

  fileThroughputSatisfied?: boolean;

  throughputFailureReason?: string | null;

};



let status: SeoZhFactoryStatus = {

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



async function getZhStagedCount(): Promise<number> {

  const files = await fs.readdir(ZH_STAGED).catch(() => [] as string[]);

  return files.filter((f) => f.endsWith(".md")).length;

}



async function writeFactoryStatus(): Promise<void> {

  status.stagedCount = await getZhStagedCount();

  status.currentGenerateIntervalMs = GEN_MS;

  status.currentPublishIntervalMs = PUBLISH_MS;

  status.minStagedTarget = MIN_STAGED_TARGET;

  status.inventoryLow = status.stagedCount < MIN_STAGED_TARGET;

  await mergeZhHealthIntoStatus();

  await fs.mkdir(path.dirname(FACTORY_STATUS_JSON), { recursive: true });

  await fs.writeFile(FACTORY_STATUS_JSON, JSON.stringify(status, null, 2), "utf8");

}



function spawnScriptExitCode(scriptRel: string, extraArgs: string[] = []): Promise<number> {

  return new Promise((resolve, reject) => {

    const child = spawn("npx", ["tsx", scriptRel, ...extraArgs], {

      cwd: process.cwd(),

      stdio: "inherit",

      shell: true,

      env: process.env

    });

    child.on("error", reject);

    child.on("close", (code) => resolve(code ?? 0));

  });

}



async function readArticlesStagedFromHealth(): Promise<number> {

  try {

    const raw = await fs.readFile(HEALTH_JSON, "utf8");

    const j = JSON.parse(raw) as { articlesStaged?: number };

    return typeof j.articlesStaged === "number" ? j.articlesStaged : 0;

  } catch {

    return 0;

  }

}



async function mergeZhHealthIntoStatus(): Promise<void> {

  try {

    const raw = await fs.readFile(HEALTH_JSON, "utf8");

    const j = JSON.parse(raw) as Record<string, unknown>;

    if (typeof j.retryCount === "number") status.retryCount = j.retryCount;

    if (typeof j.attemptsUsed === "number") status.attemptsUsed = j.attemptsUsed;

    if (typeof j.assetIndexDedupDropped === "number") status.assetIndexDedupDropped = j.assetIndexDedupDropped;

    if (typeof j.preIndexDedupDropped === "number" && status.assetIndexDedupDropped === undefined) {

      status.assetIndexDedupDropped = j.preIndexDedupDropped as number;

    }

    if (j.finalAuditFailedReasonsTop && typeof j.finalAuditFailedReasonsTop === "object") {

      status.finalAuditFailedReasonsTop = j.finalAuditFailedReasonsTop as Record<string, number>;

    }

    if (typeof j.roundsExecuted === "number") status.roundsExecuted = j.roundsExecuted;

    if (typeof j.stagedFilesWrittenThisRun === "number") status.stagedFilesWrittenThisRun = j.stagedFilesWrittenThisRun;

    if (typeof j.publishedFilesWrittenThisRun === "number") {

      status.publishedFilesWrittenThisRun = j.publishedFilesWrittenThisRun;

    }

    if (typeof j.minFilesWrittenPerRun === "number") status.minFilesWrittenPerRun = j.minFilesWrittenPerRun;

    if (typeof j.fileThroughputSatisfied === "boolean") status.fileThroughputSatisfied = j.fileThroughputSatisfied;

    if (j.throughputFailureReason === null || typeof j.throughputFailureReason === "string") {

      status.throughputFailureReason = j.throughputFailureReason as string | null;

    }

  } catch {

    /* no health yet */

  }

}



async function runGenerateCycle(): Promise<void> {

  const at = new Date().toISOString();

  console.log(`[seo-zh-guides-factory] generate cycle at ${at}`);



  const stagedAtCycleStart = await getZhStagedCount();

  const inventoryLow = stagedAtCycleStart < MIN_STAGED_TARGET;

  const minFiles = resolveMinFilesForFactory(inventoryLow);

  status.minFilesWrittenPerRun = minFiles;

  status.refillTriggered = false;

  status.refillAttempts = 0;

  status.stagedFilesWrittenThisRun = 0;

  status.fileThroughputSatisfied = false;

  status.throughputFailureReason = null;



  try {

    let spawnTotal = 0;

    for (let pass = 0; pass < MAX_FACTORY_PASSES; pass++) {

      spawnTotal++;

      const code = await spawnScriptExitCode("scripts/zh-cluster-publish-pipeline.ts");

      status.pipelineSpawnCount = spawnTotal;

      await mergeZhHealthIntoStatus();

      const stagedNow = await getZhStagedCount();

      const totalDelta = Math.max(0, stagedNow - stagedAtCycleStart);

      status.stagedFilesWrittenThisRun = totalDelta;

      status.lastGeneratedCount = await readArticlesStagedFromHealth();

      status.fileThroughputSatisfied = totalDelta >= minFiles;

      status.throughputFailureReason = status.fileThroughputSatisfied

        ? null

        : `staged_files_written_this_cycle=${totalDelta} min_required=${minFiles}`;

      status.lastError =

        code !== 0

          ? `zh-cluster-publish-pipeline exited ${code}`

          : status.fileThroughputSatisfied

            ? null

            : status.throughputFailureReason;

      await writeFactoryStatus();



      if (totalDelta >= minFiles) break;

      if (pass < MAX_FACTORY_PASSES - 1) {

        status.refillTriggered = true;

        status.refillAttempts = (status.refillAttempts ?? 0) + 1;

        console.log(

          `[seo-zh-guides-factory] refill pass ${pass + 2}/${MAX_FACTORY_PASSES} disk_delta=${totalDelta}/${minFiles}`

        );

      }

    }



    if (!status.fileThroughputSatisfied) {

      status.lastError = status.throughputFailureReason ?? "throughput_target_not_met";

    } else {

      status.lastError = null;

    }

    await mergeZhHealthIntoStatus();

    await writeFactoryStatus();

  } catch (e) {

    status.lastError = e instanceof Error ? e.message : String(e);

    status.throughputFailureReason = status.lastError;

    status.fileThroughputSatisfied = false;

    await writeFactoryStatus();

    console.error("[seo-zh-guides-factory] generate cycle error", e);

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

  const n = await getZhStagedCount();

  if (n === 0) {

    console.log("[seo-zh-guides-factory] publish cycle skipped (no staged files)");

    status.lastPublishRunAt = new Date().toISOString();

    status.lastPublishedCount = 0;

    status.publishedFilesWrittenThisRun = 0;

    await writeFactoryStatus();

    return;

  }

  const at = new Date().toISOString();

  console.log(`[seo-zh-guides-factory] publish cycle at ${at}`);

  try {

    const code = await spawnScriptExitCode("scripts/zh-publish-staged-guides.ts", [`--count=${PUBLISH_BATCH}`]);

    if (code !== 0) {

      status.lastError = `zh-publish-staged-guides exited ${code}`;

    } else {

      status.lastError = null;

    }

    status.lastPublishRunAt = at;

    await mergeZhHealthIntoStatus();

    try {

      const raw = await fs.readFile(HEALTH_JSON, "utf8");

      const j = JSON.parse(raw) as { lastPublishedCount?: number; publishedFilesWrittenThisRun?: number };

      status.lastPublishedCount =

        typeof j.lastPublishedCount === "number" ? j.lastPublishedCount : PUBLISH_BATCH;

      if (typeof j.publishedFilesWrittenThisRun === "number") {

        status.publishedFilesWrittenThisRun = j.publishedFilesWrittenThisRun;

      } else {

        status.publishedFilesWrittenThisRun = status.lastPublishedCount;

      }

    } catch {

      status.lastPublishedCount = PUBLISH_BATCH;

      status.publishedFilesWrittenThisRun = PUBLISH_BATCH;

    }

    await writeFactoryStatus();

  } catch (e) {

    status.lastError = e instanceof Error ? e.message : String(e);

    await writeFactoryStatus();

    console.error("[seo-zh-guides-factory] publish cycle error", e);

  }

}



async function main() {

  status.startedAt = new Date().toISOString();

  status.running = true;

  status.lastError = null;

  await writeFactoryStatus();



  const genLabel =

    GEN_MS === DEFAULT_GEN_MS ? formatIntervalLabel(DEFAULT_GEN_MS) : `${formatIntervalLabel(GEN_MS)} (ZH_GENERATE_INTERVAL_MS)`;

  const pubLabel =

    PUBLISH_MS === DEFAULT_PUBLISH_MS

      ? formatIntervalLabel(DEFAULT_PUBLISH_MS)

      : `${formatIntervalLabel(PUBLISH_MS)} (ZH_PUBLISH_INTERVAL_MS)`;

  console.log(

    `[seo-zh-guides-factory] [factory] started; generate every ${genLabel}, publish every ${pubLabel}, min staged target=${MIN_STAGED_TARGET}; timers keep process alive`

  );



  await scheduleGenerateTick();



  const stagedAfterGen = await getZhStagedCount();

  if (stagedAfterGen > 0) {

    console.log("[seo-zh-guides-factory] initial publish check (staged > 0)");

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

    console.log("[seo-zh-guides-factory] shutdown");

    process.exit(0);

  };

  process.on("SIGINT", shutdown);

  process.on("SIGTERM", shutdown);



  await new Promise<void>(() => {});

}



main().catch(async (e) => {

  status.lastError = e instanceof Error ? e.message : String(e);

  status.running = false;

  await writeFactoryStatus();

  console.error(e);

  process.exit(1);

});


