/**
 * Writes generated/asset-seo-publish-queue.json from ZH keywords + EN topic registry.
 * Run: npx tsx scripts/build-asset-seo-publish-queue.ts
 */
import fs from "fs";
import path from "path";
import { buildAssetSeoPublishQueueArtifact } from "../src/lib/seo/asset-seo-publish-queue";
import { isSeoDryRunEnv, seoSandboxDir } from "../src/lib/seo/seo-sandbox";

const baseDir = isSeoDryRunEnv() ? seoSandboxDir(process.cwd()) : path.join(process.cwd(), "generated");
const out = path.join(baseDir, "asset-seo-publish-queue.json");

const data = buildAssetSeoPublishQueueArtifact();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data, null, 2), "utf8");
console.log("[build-asset-seo-publish-queue]", out, "items:", data.items.length);
