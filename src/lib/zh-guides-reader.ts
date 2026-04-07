/**
 * 读取 content/zh-guides 下正式中文指南（与 auto-posts-reader 隔离）。
 * Frontmatter 键名为中文（见 seo-zh/zh-frontmatter-keys）。
 *
 * 公开 URL 段（ZhGuideRecord.slug）仅使用 ASCII-safe public slug：
 * 优先从文件名提取 `zh-<数字>` 前缀；否则将文件名 ASCII 化。不再使用 frontmatter「别名」作路由。
 */

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
 * 从 md 文件名得到公开 slug（ASCII-only）。
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
    .sort();
  const posts: ZhGuideRecord[] = [];
  const slugOrder = new Map<string, number>();
  for (const f of files) {
    const raw = await fs.readFile(path.join(ZH_GUIDES_DIR, f), "utf8");
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    const base = publicSlugFromMdBasename(f);
    const prev = slugOrder.get(base) ?? 0;
    slugOrder.set(base, prev + 1);
    const slug = prev > 0 ? `${base}-${prev + 1}` : base;
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
