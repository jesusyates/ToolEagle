/**
 * v59 Keyword page content - store and retrieve for /zh/search/[slug]
 */
import * as fs from "fs";
import * as path from "path";

export type ZhKeywordContent = {
  title: string;
  description: string;
  h1: string;
  directAnswer: string;
  intro: string;
  guide: string;
  stepByStep: string;
  faq: string;
  strategy: string;
  tips: string;
  /** v61: Result preview block (2 examples) */
  resultPreview?: string[];
  /** v61: Title pattern used (A/B/C/D) */
  titlePattern?: string;
  /** v63: platform, goal, audience, format, time */
  platform?: string;
  goal?: string;
  audience?: string;
  format?: string;
  time?: string;
  published?: boolean;
  createdAt?: number;
  lastModified?: number;
};

const CACHE_PATH = path.join(process.cwd(), "data", "zh-keywords.json");

function loadCache(): Record<string, ZhKeywordContent> {
  try {
    const raw = fs.readFileSync(CACHE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, ZhKeywordContent>): void {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

export function getKeywordContent(slug: string): ZhKeywordContent | null {
  const cache = loadCache();
  const content = cache[slug];
  if (!content) return null;
  if (content.published === false) return null;
  return content;
}

export function setKeywordContent(slug: string, content: ZhKeywordContent): void {
  const cache = loadCache();
  cache[slug] = {
    ...content,
    lastModified: Date.now(),
    createdAt: content.createdAt ?? cache[slug]?.createdAt ?? Date.now()
  };
  saveCache(cache);
}

export function getAllKeywordSlugsWithContent(): string[] {
  const cache = loadCache();
  return Object.entries(cache)
    .filter(([, c]) => c.published !== false)
    .map(([slug]) => slug);
}

export function shouldNoindexKeywordPage(content: ZhKeywordContent | null): boolean {
  if (!content) return true;
  const text = [content.intro, content.guide, content.stepByStep, content.faq].filter(Boolean).join("");
  if (text.length < 800) return true;
  return !content.intro || !content.guide;
}

/** v63: Get raw cache entry for slug (for getKeywordBySlug V63 resolution) */
export function getKeywordCacheEntry(slug: string): ZhKeywordContent | null {
  const cache = loadCache();
  const data = cache[slug];
  if (!data || data.published === false) return null;
  return data;
}

/** v63: Get all V63 entries from cache (batch, single read) */
export function getAllV63EntriesFromCache(): Array<ZhKeywordContent & { slug: string }> {
  const cache = loadCache();
  return Object.entries(cache)
    .filter(([slug, data]) => slug.startsWith("v63-") && data && data.published !== false)
    .map(([slug, data]) => ({ ...data, slug }));
}
