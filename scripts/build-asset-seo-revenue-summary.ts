/**
 * V158 — Write generated/asset-seo-revenue-summary.json
 * Run: npx tsx scripts/build-asset-seo-revenue-summary.ts
 */
import { writeAssetSeoRevenueSummary } from "../src/lib/seo/asset-seo-revenue-summary";

const out = writeAssetSeoRevenueSummary(process.cwd());
console.log("[build-asset-seo-revenue-summary]", out);
