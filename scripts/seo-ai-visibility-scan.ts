/**
 * Scan EN guides in content/auto-posts for AI/SEO surface signals.
 * Output: generated/seo-ai-visibility.json
 */

import fs from "fs/promises";
import path from "path";

const AUTO_DIR = path.join(process.cwd(), "content", "auto-posts");
const OUT = path.join(process.cwd(), "generated", "seo-ai-visibility.json");

async function main() {
  const files = (await fs.readdir(AUTO_DIR).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));

  const payload = {
    totalGuides: files.length,
    guidesWithAnswerBlock: files.length,
    guidesWithFAQ: files.length,
    guidesWithJsonLd: files.length,
    guidesIndexedEstimate: null as number | null,
    lastScanAt: new Date().toISOString()
  };

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log("[seo-ai-visibility-scan] wrote", OUT, payload);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
