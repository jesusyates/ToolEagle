/**
 * V171.1 — Load generated/zh-content-cleanup.json for sitemap / ops (optional).
 */

import fs from "fs";
import path from "path";

export type ZhCleanupIssue = {
  path: string;
  issue_type: string;
  source: string;
  action: string;
};

export type ZhContentCleanupFile = {
  version: string;
  generatedAt: string;
  zh_content_cleaner: "active" | "partially_active";
  issues: ZhCleanupIssue[];
  excludedSitemapPaths: string[];
};

let cached: ZhContentCleanupFile | null | undefined;

export function loadZhContentCleanup(cwd = process.cwd()): ZhContentCleanupFile | null {
  if (cached !== undefined) return cached;
  const p = path.join(cwd, "generated", "zh-content-cleanup.json");
  try {
    if (!fs.existsSync(p)) {
      cached = null;
      return null;
    }
    cached = JSON.parse(fs.readFileSync(p, "utf8")) as ZhContentCleanupFile;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function clearZhContentCleanupCache() {
  cached = undefined;
}

export function isZhPathExcludedFromSitemap(urlPath: string, doc: ZhContentCleanupFile | null): boolean {
  if (!doc?.excludedSitemapPaths?.length) return false;
  return doc.excludedSitemapPaths.includes(urlPath);
}
