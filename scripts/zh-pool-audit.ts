#!/usr/bin/env npx tsx
/**
 * 一次性全量：正式池 zh-guides + 待发池 zh-staged-guides，只写审计 JSON，不删文。
 */

import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { auditZhGuideMarkdown, auditZhStagedGuideMarkdown } from "../src/lib/seo-zh/zh-guide-audit";

const require = createRequire(import.meta.url);
const { resolveRepoRoot } = require("./lib/repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

const ROOT = resolveRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const ZH_GUIDES = path.join(ROOT, "content", "zh-guides");
const ZH_STAGED = path.join(ROOT, "content", "zh-staged-guides");
const OUT_GUIDES = path.join(ROOT, "generated", "zh-guides-audit.json");
const OUT_STAGED = path.join(ROOT, "generated", "zh-staged-guides-audit.json");

async function listMd(dir: string): Promise<string[]> {
  const names = (await fs.readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".md")).sort();
  return names;
}

async function main() {
  const guideNames = await listMd(ZH_GUIDES);
  const guideItems = [];
  for (const name of guideNames) {
    const raw = await fs.readFile(path.join(ZH_GUIDES, name), "utf8");
    guideItems.push(auditZhGuideMarkdown(name, raw));
  }
  let passCount = 0;
  let repairCount = 0;
  let freezeCount = 0;
  for (const it of guideItems) {
    if (it.decision === "pass") passCount++;
    else if (it.decision === "repair") repairCount++;
    else freezeCount++;
  }

  const stagedNames = await listMd(ZH_STAGED);
  const stagedItems = [];
  for (const name of stagedNames) {
    const raw = await fs.readFile(path.join(ZH_STAGED, name), "utf8");
    stagedItems.push(auditZhStagedGuideMarkdown(name, raw));
  }
  let sp = 0;
  let sr = 0;
  let sj = 0;
  for (const it of stagedItems) {
    if (it.decision === "pass") sp++;
    else if (it.decision === "rewrite") sr++;
    else sj++;
  }

  const docGuides = {
    generatedAt: new Date().toISOString(),
    pool: "zh-guides",
    total: guideItems.length,
    passCount,
    repairCount,
    freezeCount,
    items: guideItems
  };
  const docStaged = {
    generatedAt: new Date().toISOString(),
    pool: "zh-staged-guides",
    total: stagedItems.length,
    passCount: sp,
    rewriteCount: sr,
    rejectCount: sj,
    items: stagedItems
  };

  await fs.mkdir(path.dirname(OUT_GUIDES), { recursive: true });
  await fs.writeFile(OUT_GUIDES, JSON.stringify(docGuides, null, 2), "utf8");
  await fs.writeFile(OUT_STAGED, JSON.stringify(docStaged, null, 2), "utf8");

  console.log("[zh-pool-audit]", OUT_GUIDES, { total: docGuides.total, passCount, repairCount, freezeCount });
  console.log("[zh-pool-audit]", OUT_STAGED, { total: docStaged.total, passCount: sp, rewriteCount: sr, rejectCount: sj });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
