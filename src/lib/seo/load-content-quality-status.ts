/**
 * V171 / V171.2 — Runtime load of generated/content-quality-status.json (optional artifact).
 */

import fs from "fs";
import path from "path";
import type { V171QualityAction } from "@/lib/seo/content-quality-evaluate";

export type ContentQualityStatusFile = {
  version: string;
  generatedAt: string;
  summary?: Record<string, number | string>;
  pages: Array<{
    path: string;
    pageType: string;
    score: number;
    signals: string[];
    actions: V171QualityAction[];
  }>;
  excludedSitemapPaths: string[];
  noindexPaths: string[];
  /** V171.2 — hard remove from internal linking (not soft deprioritization). */
  internalLinkExcludePaths: string[];
  /** Paths that require Supabase examples at runtime (sitemap/metadata). */
  runtimeExampleGatedPaths?: string[];
  /** @deprecated V171.2 — always empty in new builds; use internalLinkExcludePaths */
  linkPoolSoftPaths?: string[];
};

let cached: ContentQualityStatusFile | null | undefined;

export function loadContentQualityStatus(cwd = process.cwd()): ContentQualityStatusFile | null {
  if (cached !== undefined) return cached;
  const p = path.join(cwd, "generated", "content-quality-status.json");
  try {
    if (!fs.existsSync(p)) {
      cached = null;
      return null;
    }
    cached = JSON.parse(fs.readFileSync(p, "utf8")) as ContentQualityStatusFile;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

/** Call in tests if file is regenerated in-process. */
export function clearContentQualityStatusCache() {
  cached = undefined;
}

export function getInternalLinkExcludePaths(status: ContentQualityStatusFile | null): string[] {
  if (!status) return [];
  const hard = status.internalLinkExcludePaths ?? [];
  if (hard.length) return hard;
  /** Legacy file: fall back to noindex paths (V171.2 triad was written together). */
  return status.noindexPaths ?? [];
}

export function shouldExcludePathFromSitemap(urlPath: string, status: ContentQualityStatusFile | null): boolean {
  if (!status?.excludedSitemapPaths?.length) return false;
  return status.excludedSitemapPaths.includes(urlPath);
}

export function shouldNoindexPath(urlPath: string, status: ContentQualityStatusFile | null): boolean {
  if (!status?.noindexPaths?.length) return false;
  return status.noindexPaths.includes(urlPath);
}

export function shouldHardExcludeFromInternalLinks(urlPath: string, status: ContentQualityStatusFile | null): boolean {
  const paths = getInternalLinkExcludePaths(status);
  return paths.includes(urlPath);
}

export function isRuntimeExampleGatedPath(urlPath: string, status: ContentQualityStatusFile | null): boolean {
  const g = status?.runtimeExampleGatedPaths;
  if (g?.length) return g.includes(urlPath);
  return (
    urlPath.startsWith("/captions-for/") || urlPath.startsWith("/hooks-for/") || urlPath.startsWith("/hashtags-for/")
  );
}
