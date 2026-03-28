/**
 * Writes generated/asset-seo-ai-citation-dominance.json (+ autopilot summary) from existing publish queue.
 * Run: npx tsx scripts/build-asset-seo-ai-citation-dominance.ts
 */
import fs from "fs";
import path from "path";
import { writeAssetSeoAiCitationDominanceFromQueueFile } from "../src/lib/seo/asset-seo-ai-citation-dominance-summary";
import { resolveSeoGeneratedDir } from "../src/lib/seo/seo-sandbox";

const cwd = process.cwd();
const gen = resolveSeoGeneratedDir(cwd);
const queuePath = path.join(gen, "asset-seo-publish-queue.json");
if (!fs.existsSync(queuePath)) {
  console.error("[build-asset-seo-ai-citation-dominance] missing queue:", queuePath);
  process.exit(1);
}

const out = writeAssetSeoAiCitationDominanceFromQueueFile(cwd);
console.log("[build-asset-seo-ai-citation-dominance]", out.dominancePath, "items:", out.itemCount);
