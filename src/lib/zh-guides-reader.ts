/**
 * 读取 content/zh-guides 下正式中文指南（与 auto-posts-reader 隔离）。
 * Frontmatter 键名为中文（见 seo-zh/zh-frontmatter-keys）。
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import type { FaqItem } from "@/lib/seo/rebuild-article";
import { mapZhGuideDataToRecordFields } from "@/lib/seo-zh/zh-frontmatter-keys";

const ZH_GUIDES_DIR = path.join(process.cwd(), "content", "zh-guides");

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

export async function getZhGuideSlugs(): Promise<string[]> {
  const files = await fs.readdir(ZH_GUIDES_DIR).catch(() => [] as string[]);
  const slugs: string[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(ZH_GUIDES_DIR, f), "utf8");
    const { data } = matter(raw);
    const m = mapZhGuideDataToRecordFields(data as Record<string, unknown>);
    if (m.slug) slugs.push(m.slug);
  }
  return slugs;
}

export async function getAllZhGuides(): Promise<ZhGuideRecord[]> {
  const files = await fs.readdir(ZH_GUIDES_DIR).catch(() => [] as string[]);
  const posts: ZhGuideRecord[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(ZH_GUIDES_DIR, f), "utf8");
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    posts.push({
      ...mapDataToRecord(d),
      body: content.trim()
    });
  }
  posts.sort((a, b) => {
    const ta = Date.parse(a.publishedAt) || 0;
    const tb = Date.parse(b.publishedAt) || 0;
    return tb - ta;
  });
  return posts;
}

export async function getZhGuideBySlug(slug: string): Promise<ZhGuideRecord | null> {
  const all = await getAllZhGuides();
  return all.find((p) => p.slug === slug) ?? null;
}
