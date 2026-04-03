import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import type { FaqItem } from "@/lib/seo/rebuild-article";

const AUTO_DIR = path.join(process.cwd(), "content", "auto-posts");
const STAGED_GUIDES_DIR = path.join(process.cwd(), "content", "staged-guides");

export type AutoPostRecord = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  hashtags: string[];
  body: string;
  aiSummary?: string;
  faqs?: FaqItem[];
  contentType?: string;
  clusterTheme?: string;
};

function normalizeHashtags(data: unknown): string[] {
  if (Array.isArray(data)) return data.map((x) => String(x));
  if (typeof data === "string") return data.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
  return [];
}

function parseFaqsField(data: unknown): FaqItem[] | undefined {
  if (!Array.isArray(data)) return undefined;
  const out: FaqItem[] = [];
  for (const x of data) {
    if (x && typeof x === "object") {
      const q = String((x as { question?: string }).question ?? "").trim();
      const a = String((x as { answer?: string }).answer ?? "").trim();
      if (q && a) out.push({ question: q, answer: a });
    }
  }
  return out.length ? out : undefined;
}

function mapPostData(data: Record<string, unknown>): Omit<AutoPostRecord, "body"> {
  return {
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    publishedAt: typeof data.publishedAt === "string" ? data.publishedAt : "",
    hashtags: normalizeHashtags(data.hashtags),
    aiSummary: typeof data.aiSummary === "string" ? data.aiSummary : undefined,
    faqs: parseFaqsField(data.faqs),
    contentType: typeof data.contentType === "string" ? data.contentType : undefined,
    clusterTheme: typeof data.clusterTheme === "string" ? data.clusterTheme : undefined
  };
}

export async function getAutoPostSlugs(): Promise<string[]> {
  const files = await fs.readdir(AUTO_DIR).catch(() => [] as string[]);
  const slugs: string[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(AUTO_DIR, f), "utf8");
    const { data } = matter(raw);
    const slug = typeof data.slug === "string" ? data.slug : "";
    if (slug) slugs.push(slug);
  }
  return slugs;
}

export async function getStagedGuideCount(): Promise<number> {
  const files = await fs.readdir(STAGED_GUIDES_DIR).catch(() => [] as string[]);
  return files.filter((f) => f.endsWith(".md")).length;
}

export async function getAllStagedPosts(): Promise<AutoPostRecord[]> {
  const files = await fs.readdir(STAGED_GUIDES_DIR).catch(() => [] as string[]);
  const posts: AutoPostRecord[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(STAGED_GUIDES_DIR, f), "utf8");
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    posts.push({
      ...mapPostData(d),
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

export async function getAllAutoPosts(): Promise<AutoPostRecord[]> {
  const files = await fs.readdir(AUTO_DIR).catch(() => [] as string[]);
  const posts: AutoPostRecord[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(AUTO_DIR, f), "utf8");
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    posts.push({
      ...mapPostData(d),
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

export async function getAutoPostBySlug(slug: string): Promise<AutoPostRecord | null> {
  const all = await getAllAutoPosts();
  return all.find((p) => p.slug === slug) ?? null;
}
