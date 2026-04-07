/**
 * 读取 content/zh-guides 下正式中文指南（与 auto-posts-reader 隔离）。
 * Frontmatter 键名为中文（见 seo-zh/zh-frontmatter-keys）。
 *
 * 公开 URL 段（ZhGuideRecord.slug）仅使用 ASCII-safe public slug：
 * 从文件名提取 `zh-<数字>` 前缀为 base；同 base 多文件时，字典序最小的 stem 使用纯 base，其余使用 base + '-' + sha256(stem) 前 8 位（与排序无关、跨平台稳定）。
 */

import { createHash } from "node:crypto";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";
import type { FaqItem } from "@/lib/seo/rebuild-article";
import { mapZhGuideDataToRecordFields } from "@/lib/seo-zh/zh-frontmatter-keys";

const ZH_GUIDES_DIR = path.join(process.cwd(), "content", "zh-guides");

/** Temporary: one log per Node process for Vercel build / function visibility. */
let contentSourceZhLogged = false;

function logContentSourceZhOnce(zhGuides: number) {
  if (contentSourceZhLogged) return;
  contentSourceZhLogged = true;
  console.log(`[content-source] zh-guides=${zhGuides}`);
}

export type ZhGuideRecord = {
  title: string;
  description: string;
  /** ASCII-safe 公开路由段，与 /zh/guides/[slug]、getZhGuideSlugs 一致 */
  slug: string;
  publishedAt: string;
  platform?: string;
  hashtags: string[];
  body: string;
  aiSummary?: string;
  faqs?: FaqItem[];
  updatedAt?: string;
};

/** 路由与 param 比较：ASCII slug 仅 trim。 */
export function normalizeZhGuideSlug(raw: string): string {
  return raw.trim();
}

/**
 * 从 md 文件名得到 base 段（ASCII-only）。
 * 现有文件多为 `zh-<timestamp>-<中文标题>.md` → 取 `zh-<timestamp>`。
 */
export function publicSlugFromMdBasename(file: string): string {
  const stem = path.basename(file, ".md");
  const prefix = /^zh-\d+/.exec(stem);
  if (prefix) return prefix[0];
  const ascii = stem
    .replace(/[^\u0000-\u007F]+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "zh-guide";
}

/**
 * 与 loadZhGuideRecords / sitemap 共用：同一批 md 文件名（basename）→ stem → 公开 slug。
 * 文件名排序使用 localeCompare('en')，保证跨环境稳定。
 */
export function zhGuideStemToSlugMap(mdBasenames: string[]): Map<string, string> {
  const sorted = [...mdBasenames].sort((a, b) => a.localeCompare(b, "en"));
  const baseOf = (f: string) => publicSlugFromMdBasename(f);
  const byBase = new Map<string, string[]>();
  for (const f of sorted) {
    const stem = path.basename(f, ".md");
    const b = baseOf(f);
    if (!byBase.has(b)) byBase.set(b, []);
    byBase.get(b)!.push(stem);
  }
  for (const stems of byBase.values()) {
    stems.sort((a, b) => a.localeCompare(b, "en"));
  }
  const out = new Map<string, string>();
  for (const [base, stemList] of byBase) {
    const primary = stemList[0];
    for (const stem of stemList) {
      const slug =
        stemList.length === 1
          ? base
          : stem === primary
            ? base
            : `${base}-${createHash("sha256").update(stem).digest("hex").slice(0, 8)}`;
      out.set(stem, slug);
    }
  }
  return out;
}

function mapDataToRecord(data: Record<string, unknown>): Omit<ZhGuideRecord, "body" | "slug"> {
  const m = mapZhGuideDataToRecordFields(data);
  return {
    title: m.title,
    description: m.description,
    publishedAt: m.publishedAt,
    platform: m.platform,
    hashtags: m.hashtags,
    aiSummary: m.aiSummary,
    faqs: m.faqs,
    updatedAt: m.updatedAt
  };
}

const loadZhGuideRecords = cache(async (): Promise<ZhGuideRecord[]> => {
  const files = (await fs.readdir(ZH_GUIDES_DIR).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "en"));
  const stemToSlug = zhGuideStemToSlugMap(files);
  const posts: ZhGuideRecord[] = [];
  for (const f of files) {
    const stem = path.basename(f, ".md");
    const slug = stemToSlug.get(stem)!;
    const raw = await fs.readFile(path.join(ZH_GUIDES_DIR, f), "utf8");
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    posts.push({
      ...mapDataToRecord(d),
      slug,
      body: content.trim()
    });
  }
  return posts;
});

export async function getZhGuideSlugs(): Promise<string[]> {
  const posts = await loadZhGuideRecords();
  logContentSourceZhOnce(posts.length);
  return [...new Set(posts.map((p) => p.slug).filter(Boolean))];
}

export async function getAllZhGuides(): Promise<ZhGuideRecord[]> {
  const posts = await loadZhGuideRecords();
  posts.sort((a, b) => {
    const ta = Date.parse(a.publishedAt) || 0;
    const tb = Date.parse(b.publishedAt) || 0;
    return tb - ta;
  });
  logContentSourceZhOnce(posts.length);
  return posts;
}

export async function getZhGuideBySlug(slug: string): Promise<ZhGuideRecord | null> {
  const key = normalizeZhGuideSlug(slug);
  const all = await getAllZhGuides();
  return all.find((p) => normalizeZhGuideSlug(p.slug) === key) ?? null;
}
