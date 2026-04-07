/**
 * 读取 content/zh-guides 下正式中文指南（与 auto-posts-reader 隔离）。
 * Frontmatter 键名为中文（见 seo-zh/zh-frontmatter-keys）。
 *
 * 公开 URL 的 slug 唯一来源：frontmatter「别名」；若为空则回退为文件名（不含 .md），
 * 全链路 trim + Unicode NFC，与列表 / generateStaticParams / getZhGuideBySlug 一致。
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
  slug: string;
  publishedAt: string;
  platform?: string;
  hashtags: string[];
  body: string;
  aiSummary?: string;
  faqs?: FaqItem[];
  updatedAt?: string;
};

/** 与路由 param、href 比较时统一使用（避免 NFC/NFD、首尾空白差异导致 404）。 */
export function normalizeZhGuideSlug(raw: string): string {
  return raw.trim().normalize("NFC");
}

function mapDataToRecord(data: Record<string, unknown>): Omit<ZhGuideRecord, "body"> {
  const m = mapZhGuideDataToRecordFields(data);
  return {
    title: m.title,
    description: m.description,
    slug: m.slug,
    publishedAt: m.publishedAt,
    platform: m.platform,
    hashtags: m.hashtags,
    aiSummary: m.aiSummary,
    faqs: m.faqs,
    updatedAt: m.updatedAt
  };
}

/**
 * 单篇 canonical slug：优先 frontmatter「别名」，否则文件名（不含 .md）。
 * 全站列表 / [slug] / generateStaticParams 必须使用此值。
 */
function canonicalSlugForFile(file: string, data: Record<string, unknown>): string {
  const m = mapZhGuideDataToRecordFields(data);
  const fromFm = normalizeZhGuideSlug(m.slug);
  if (fromFm) return fromFm;
  return normalizeZhGuideSlug(path.basename(file, ".md"));
}

const loadZhGuideRecords = cache(async (): Promise<ZhGuideRecord[]> => {
  const files = await fs.readdir(ZH_GUIDES_DIR).catch(() => [] as string[]);
  const posts: ZhGuideRecord[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(ZH_GUIDES_DIR, f), "utf8");
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    const slug = canonicalSlugForFile(f, d);
    const mapped = mapDataToRecord(d);
    posts.push({
      ...mapped,
      slug,
      body: content.trim()
    });
  }
  return posts;
});

export async function getZhGuideSlugs(): Promise<string[]> {
  const posts = await loadZhGuideRecords();
  logContentSourceZhOnce(posts.length);
  const slugs = [...new Set(posts.map((p) => p.slug).filter(Boolean))];
  return slugs;
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
