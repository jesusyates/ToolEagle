#!/usr/bin/env npx tsx
/**
 * 扫描 content/zh-guides，输出 pass / repair / freeze（最小审计）。
 */

import fs from "fs/promises";
import path from "path";
import { auditZhGuideMarkdown } from "../src/lib/seo-zh/zh-guide-audit";

const ROOT = process.cwd();
const ZH_GUIDES = path.join(ROOT, "content", "zh-guides");
const OUT = path.join(ROOT, "generated", "zh-guides-audit.json");

async function main() {
  const names = (await fs.readdir(ZH_GUIDES).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();
  const items: ReturnType<typeof auditZhGuideMarkdown>[] = [];
  for (const name of names) {
    const raw = await fs.readFile(path.join(ZH_GUIDES, name), "utf8");
    items.push(auditZhGuideMarkdown(name, raw));
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
  console.log("[zh-audit-published-guides]", OUT, { total: doc.total, passCount, repairCount, freezeCount });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
