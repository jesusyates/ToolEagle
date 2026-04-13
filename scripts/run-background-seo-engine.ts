/**
 * V153 / V161.1 — Background SEO engine: batched ZH + optional EN, incremental state.
 * Core logic: scripts/lib/seo-background-engine-core.ts
 *
 * Usage:
 *   npx tsx scripts/run-background-seo-engine.ts --once [--zh-only | --en-only]
 *   npx tsx scripts/run-background-seo-engine.ts --watch
 *
 * Env: SEO_BG_INTERVAL_MS, SEO_BG_SKIP_EN_BLOG=1
 */

import fs from "fs";
import path from "path";
import { isPrimaryScriptEntry, sandboxPipelineStatePath, seoSandboxDir } from "../src/lib/seo/seo-sandbox";
import {
  parseBackgroundEngineArgs,
  runBackgroundSeoTick
} from "./lib/seo-background-engine-core";

console.log("[background-seo-engine] disabled by manual override (diagnosis mode)");
process.exit(0);

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** Align with run-daily-orchestrator: sandbox allocation artifact when dry-run and present. */
function trafficAllocationPath(cwd: string, dryRun: boolean): string {
  if (dryRun) {
    const sand = path.join(seoSandboxDir(cwd), "asset-seo-traffic-allocation.json");
    if (fs.existsSync(sand)) return sand;
  }
  return path.join(cwd, "generated", "asset-seo-traffic-allocation.json");
}

function tick(): number {
  const argv = process.argv.slice(2);
  const args = parseBackgroundEngineArgs(argv);
  if (args.dryRun) {
    process.env.SEO_DRY_RUN = "1";
  }
  const cwd = process.cwd();
  const statePath = args.dryRun ? sandboxPipelineStatePath(cwd) : undefined;

  const allocPath = trafficAllocationPath(cwd, args.dryRun);
  const allocExists = fs.existsSync(allocPath);
  const allocData = readJson<{
    recommended_zh_batch_scale?: number;
    recommended_en_batch_scale?: number;
  }>(allocPath, {});
  const zhScaleN = Number(allocData.recommended_zh_batch_scale);
  const enScaleN = Number(allocData.recommended_en_batch_scale);
  const allocationZhBatchScale =
    Number.isFinite(zhScaleN) && zhScaleN > 0 ? zhScaleN : undefined;
  const allocationEnBatchScale =
    Number.isFinite(enScaleN) && enScaleN > 0 ? enScaleN : undefined;

  let validation: "ok" | "invalid_or_empty" | "artifact_missing";
  if (!allocExists) validation = "artifact_missing";
  else if (allocationZhBatchScale == null && allocationEnBatchScale == null) validation = "invalid_or_empty";
  else validation = "ok";

  const loaded = allocExists && validation === "ok";
  const zhEff = allocationZhBatchScale ?? 1;
  const enEff = allocationEnBatchScale ?? 1;
  console.info(
    `[background-seo-engine] V161.1 allocation: ${loaded ? `loaded ${allocPath}` : "fallback (advisory scales omitted)"}; ` +
      `effective_zh_scale=${zhEff} effective_en_scale=${enEff}; validation=${validation}`
  );

  const { code } = runBackgroundSeoTick({
    cwd,
    zh: args.zh,
    en: args.en,
    skipEnBlog: process.env.SEO_BG_SKIP_EN_BLOG === "1",
    dryRun: args.dryRun,
    statePath,
    allocationZhBatchScale,
    allocationEnBatchScale
  });
  return code;
}

function main() {
  const argv = process.argv.slice(2);
  const args = parseBackgroundEngineArgs(argv);
  if (args.watch) {
    const run = () => {
      const code = tick();
      console.log(`[background-seo-engine] tick exit ${code}; next in ${args.intervalMs}ms`);
    };
    run();
    setInterval(run, args.intervalMs);
    return;
  }
  process.exit(tick());
}

if (isPrimaryScriptEntry("run-background-seo-engine.ts")) {
  main();
}
