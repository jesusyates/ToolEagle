/**
 * 发布门禁：去重覆盖 staged / sent / zh-staged / zh-guides，以及可选线上 sitemap。
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { zhGuideStemToSlugMap } from "../../src/lib/zh-guides-reader";

const ROOT = process.cwd();

const EN_STAGED = path.join(ROOT, "content", "staged-guides");
const EN_SENT = path.join(ROOT, "content", "sent-guides");
const ZH_STAGED = path.join(ROOT, "content", "zh-staged-guides");
const ZH_GUIDES = path.join(ROOT, "content", "zh-guides");

async function enSlugsFromDir(dir: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const files = (await fs.readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    try {
      const raw = await fs.readFile(path.join(dir, f), "utf8");
      const { data } = matter(raw);
      const slug = typeof data.slug === "string" ? data.slug.trim() : "";
      if (slug) out.set(slug, f);
    } catch {
      /* skip */
    }
  }
  return out;
}

async function zhPublicSlugsFromDir(dir: string): Promise<Map<string, string>> {
  const files = (await fs.readdir(dir).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "en"));
  if (files.length === 0) return new Map();
  const map = zhGuideStemToSlugMap(files);
  const out = new Map<string, string>();
  for (const f of files) {
    const stem = path.basename(f, ".md");
    const slug = map.get(stem);
    if (slug) out.set(slug, f);
  }
  return out;
}

export type GuideDedupReport = {
  enStaged: Map<string, string>;
  enSent: Map<string, string>;
  zhStaged: Map<string, string>;
  zhGuides: Map<string, string>;
  liveEnSlugs?: Set<string>;
  liveZhSlugs?: Set<string>;
};

/** 扫描本地四个目录的 slug → 文件名。 */
export async function collectLocalGuideDedup(): Promise<GuideDedupReport> {
  const [enStaged, enSent, zhStaged, zhGuides] = await Promise.all([
    enSlugsFromDir(EN_STAGED),
    enSlugsFromDir(EN_SENT),
    zhPublicSlugsFromDir(ZH_STAGED),
    zhPublicSlugsFromDir(ZH_GUIDES)
  ]);
  return { enStaged, enSent, zhStaged, zhGuides };
}

/** 从线上 sitemap 拉取已索引的 guides slug（best-effort，失败则返回空 Set）。 */
export async function fetchLiveGuideSlugsFromSitemaps(
  siteUrl: string
): Promise<{ en: Set<string>; zh: Set<string> }> {
  const base = siteUrl.replace(/\/$/, "");
  const en = new Set<string>();
  const zh = new Set<string>();
  const tryFetch = async (url: string, locale: "en" | "zh") => {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) return;
      const text = await res.text();
      const locRe = /<loc>([^<]+)<\/loc>/gi;
      let m: RegExpExecArray | null;
      while ((m = locRe.exec(text)) !== null) {
        const u = m[1].trim();
        if (locale === "en" && /\/guides\/[^/]+/.test(u) && !u.includes("/zh/")) {
          const s = u.split("/guides/")[1]?.split(/[?#]/)[0];
          if (s) en.add(decodeURIComponent(s));
        }
        if (locale === "zh" && u.includes("/zh/guides/")) {
          const s = u.split("/zh/guides/")[1]?.split(/[?#]/)[0];
          if (s) zh.add(decodeURIComponent(s));
        }
      }
    } catch {
      /* ignore */
    }
  };
  await Promise.all([
    tryFetch(`${base}/sitemap-guides.xml`, "en"),
    tryFetch(`${base}/sitemap-zh.xml`, "zh")
  ]);
  return { en, zh };
}

/**
 * 检查待 promote 的 slug 是否与已存在池冲突（含可选线上）。
 * 返回冲突列表；空数组表示可继续。
 */
export function findDuplicateSlugConflicts(
  report: GuideDedupReport,
  opts?: { locale?: "en" | "zh" | "both" }
): string[] {
  const locale = opts?.locale ?? "both";
  const conflicts: string[] = [];

  if (locale === "en" || locale === "both") {
    for (const slug of report.enStaged.keys()) {
      if (report.enSent.has(slug)) {
        conflicts.push(`[en] slug "${slug}" already in sent-guides (file ${report.enSent.get(slug)})`);
      }
      if (report.liveEnSlugs?.has(slug)) {
        conflicts.push(`[en] slug "${slug}" already on live sitemap`);
      }
    }
  }

  if (locale === "zh" || locale === "both") {
    for (const slug of report.zhStaged.keys()) {
      if (report.zhGuides.has(slug)) {
        conflicts.push(`[zh] slug "${slug}" already in zh-guides (file ${report.zhGuides.get(slug)})`);
      }
      if (report.liveZhSlugs?.has(slug)) {
        conflicts.push(`[zh] slug "${slug}" already on live sitemap`);
      }
    }
  }

  return conflicts;
}
