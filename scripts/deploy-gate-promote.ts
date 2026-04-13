/**
 * 生产级发布门禁：部署成功且表面可访问后，才 staged → 正式目录（move）。
 *
 * 流程（默认）：
 * 1) 去重检查（本地 staged/sent/zh + 可选线上 sitemap）
 * 2) 可选 git add/commit/push（仅 staged 目录）
 * 3) 轮询 SITE_URL 可达
 * 4) 冒烟：/guides、/zh/guides、guides/zh sitemap
 * 5) 调用 runPublishStagedGuides / runZhPublishStagedGuides（move）
 *
 * 失败：不 move；staged 保留；下次可重试（不重新生成）。
 *
 * Usage:
 *   npx tsx scripts/deploy-gate-promote.ts [--locale=both|en|zh] [--count-en=1] [--count-zh=1]
 *   [--commit-push] [--git-message=chore: staged guides] [--skip-git] [--skip-wait] [--skip-verify]
 *   [--skip-dedup] [--skip-live-sitemap] [--dry-run]
 */

import { execFileSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import { SITE_URL } from "../src/config/site";
import { runPublishStagedGuides } from "./publish-staged-guides";
import { runZhPublishStagedGuides } from "./zh-publish-staged-guides";
import { waitForSiteReachable, verifyPostDeployGuidesSurface } from "./lib/deploy-publish-gate";
import {
  collectLocalGuideDedup,
  fetchLiveGuideSlugsFromSitemaps,
  findDuplicateSlugConflicts
} from "./lib/guide-publish-dedup";

const STAGED_EN = path.join(process.cwd(), "content", "staged-guides");
const STAGED_ZH = path.join(process.cwd(), "content", "zh-staged-guides");

function argVal(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`${name}=`));
  return a?.slice(name.length + 1);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function parseLocale(): "en" | "zh" | "both" {
  const v = argVal("--locale");
  if (v === "en" || v === "zh" || v === "both") return v;
  return "both";
}

function parseCount(name: string, fallback: number): number {
  const v = argVal(name);
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function hasStagedFiles(dir: string): Promise<boolean> {
  const files = await fs.readdir(dir).catch(() => [] as string[]);
  return files.some((f) => f.endsWith(".md"));
}

function runGitCommitPush(message: string): void {
  try {
    execFileSync("git", ["add", "content/staged-guides", "content/zh-staged-guides"], {
      stdio: "inherit",
      cwd: process.cwd()
    });
    try {
      execFileSync("git", ["commit", "-m", message], { stdio: "inherit", cwd: process.cwd() });
    } catch {
      console.log("[deploy-gate-promote] git commit skipped (no staged changes after add)");
      return;
    }
    execFileSync("git", ["push"], { stdio: "inherit", cwd: process.cwd() });
    console.log("[deploy-gate-promote] git push completed");
  } catch (e) {
    console.error("[deploy-gate-promote] git failed", e);
    throw e;
  }
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const locale = parseLocale();
  const countEn = parseCount("--count-en", 1);
  const countZh = parseCount("--count-zh", 1);
  const skipGit = hasFlag("--skip-git");
  const commitPush = hasFlag("--commit-push");
  const skipWait = hasFlag("--skip-wait");
  const skipVerify = hasFlag("--skip-verify");
  const skipDedup = hasFlag("--skip-dedup");
  const skipLiveSitemap = hasFlag("--skip-live-sitemap");
  const gitMessage = argVal("--git-message") ?? "chore(content): staged guides before promote gate";
  const siteUrl = process.env.DEPLOY_GATE_SITE_URL ?? SITE_URL;

  console.log("[deploy-gate-promote] siteUrl=", siteUrl, "locale=", locale, "dryRun=", dryRun);

  if (!skipDedup) {
    const report = await collectLocalGuideDedup();
    if (!skipLiveSitemap) {
      const live = await fetchLiveGuideSlugsFromSitemaps(siteUrl);
      report.liveEnSlugs = live.en;
      report.liveZhSlugs = live.zh;
    }
    const conflicts = findDuplicateSlugConflicts(report, {
      locale: locale === "both" ? "both" : locale
    });
    if (conflicts.length > 0) {
      console.warn("[deploy-gate-promote] dedup warnings:\n", conflicts.join("\n"));
      console.warn("[deploy-gate-promote] continuing; resolve duplicates before expecting clean promote.");
    }
  }

  if (commitPush && !skipGit && !dryRun) {
    const hasEn = await hasStagedFiles(STAGED_EN);
    const hasZh = await hasStagedFiles(STAGED_ZH);
    if (!hasEn && !hasZh) {
      console.log("[deploy-gate-promote] no staged md files; skip git commit-push");
    } else {
      runGitCommitPush(gitMessage);
    }
  } else if (commitPush && skipGit) {
    console.log("[deploy-gate-promote] --commit-push ignored because --skip-git");
  }

  if (!skipWait && !dryRun) {
    console.log("[deploy-gate-promote] waiting for site reachable...");
    const ok = await waitForSiteReachable({ siteUrl });
    if (!ok) {
      console.error("[deploy-gate-promote] site not reachable within timeout; abort without move");
      process.exit(2);
    }
  }

  if (!skipVerify && !dryRun) {
    const v = await verifyPostDeployGuidesSurface(siteUrl);
    if (!v.ok) {
      console.error("[deploy-gate-promote] verify failed:", v.failures.join(", "));
      console.error("[deploy-gate-promote] abort without move; staged unchanged");
      process.exit(3);
    }
    console.log("[deploy-gate-promote] surface verify ok");
  }

  if (dryRun) {
    console.log("[deploy-gate-promote] dry-run: skip promote moves");
    return;
  }

  if (locale === "en" || locale === "both") {
    const r = await runPublishStagedGuides(countEn);
    console.log("[deploy-gate-promote] EN promote result", r.publishedCount, r.publishedFiles);
  }

  if (locale === "zh" || locale === "both") {
    const r = await runZhPublishStagedGuides(countZh);
    console.log("[deploy-gate-promote] ZH promote result", r.publishedCount, r.publishedFiles);
  }

  console.log("[deploy-gate-promote] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
