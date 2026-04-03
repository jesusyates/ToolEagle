#!/usr/bin/env npx tsx
/**
 * Read-only audit of content/auto-posts (EN). No deletions.
 */

import fs from "fs/promises";
import path from "path";
import { auditPublishedGuideMarkdown } from "../src/lib/seo/published-guide-audit";

const ROOT = process.cwd();
const AUTO = path.join(ROOT, "content", "auto-posts");
const OUT = path.join(ROOT, "generated", "published-guides-audit.json");

async function main() {
  const names = (await fs.readdir(AUTO).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();
  const items = [];
  for (const name of names) {
    const raw = await fs.readFile(path.join(AUTO, name), "utf8");
    items.push(auditPublishedGuideMarkdown(name, raw));
  }

  let passCount = 0;
  let repairCount = 0;
  let freezeCount = 0;
  for (const it of items) {
    if (it.decision === "pass") passCount++;
    else if (it.decision === "repair") repairCount++;
    else freezeCount++;
  }

  const doc = {
    generatedAt: new Date().toISOString(),
    total: items.length,
    passCount,
    repairCount,
    freezeCount,
    items
  };
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[audit-published-guides]", OUT, { total: doc.total, passCount, repairCount, freezeCount });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
