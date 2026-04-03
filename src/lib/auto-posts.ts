import fs from "fs/promises";
import path from "path";
import type { FaqItem } from "@/lib/seo/rebuild-article";

export type WriteAutoPostInput = {
  title?: string;
  body?: string;
  content?: string;
  article?: string;
  hashtags?: string[] | string;
  seoTitle?: string;
  seoDescription?: string;
  aiSummary?: string;
  faqs?: FaqItem[];
  contentType?: "guide" | "ideas";
  clusterTheme?: string;
};

function faqsYamlBlock(faqs: FaqItem[]): string {
  return (
    "faqs:\n" +
    faqs
      .map((f) => `  - question: ${JSON.stringify(f.question)}\n    answer: ${JSON.stringify(f.answer)}`)
      .join("\n")
  );
}

function extraFrontmatter(input: WriteAutoPostInput): string[] {
  const lines: string[] = [];
  if (input.aiSummary?.trim()) lines.push(`aiSummary: ${JSON.stringify(input.aiSummary.trim())}`);
  if (input.faqs?.length) lines.push(faqsYamlBlock(input.faqs));
  if (input.contentType) lines.push(`contentType: ${JSON.stringify(input.contentType)}`);
  if (input.clusterTheme) lines.push(`clusterTheme: ${JSON.stringify(input.clusterTheme)}`);
  return lines;
}

export const AUTO_POSTS_DIR = path.join(process.cwd(), "content", "auto-posts");
const AUTO_DIR = AUTO_POSTS_DIR;
/** Pre-live EN guides from cluster publish (not in /guides until promoted). */
export const STAGED_GUIDES_DIR = path.join(process.cwd(), "content", "staged-guides");

function slugifyBase(s: string): string {
  const t = s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return t.length > 0 ? t.slice(0, 80) : "post";
}

function normalizeHashtags(h: string[] | string | undefined): string[] {
  if (h == null) return [];
  if (Array.isArray(h)) return h.map((x) => String(x).trim()).filter(Boolean);
  return String(h)
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export type WriteAutoPostResult = {
  filename: string;
  relativePath: string;
  urlPath: string;
  slug: string;
};

/** Cluster pipeline: staged file + planned paths after promotion to auto-posts. */
export type WriteStagedGuideResult = {
  filename: string;
  /** Path under repo to staged md. */
  stagedRelativePath: string;
  /** Path under repo where this file will live after publish (same filename). */
  finalRelativePath: string;
  /** Empty until promoted; use plannedUrlPath for preview. */
  urlPath: string;
  plannedUrlPath: string;
  slug: string;
};

async function nextSeqForYmd(ymd: string): Promise<number> {
  let maxSeq = 0;
  const prefixRe = new RegExp(`^${ymd}-(\\d+)-`);
  for (const dir of [AUTO_DIR, STAGED_GUIDES_DIR]) {
    const files = await fs.readdir(dir).catch(() => [] as string[]);
    for (const f of files) {
      const m = f.match(prefixRe);
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    }
  }
  return maxSeq + 1;
}

export type ComposedStagedGuide = {
  markdown: string;
  filename: string;
  fullPath: string;
  stagedRelativePath: string;
  finalRelativePath: string;
  plannedUrlPath: string;
  slug: string;
};

/** Same bytes as writeStagedGuide would write — use for final audit before disk. */
export async function composeStagedGuide(input: WriteAutoPostInput): Promise<ComposedStagedGuide> {
  const titleRaw = input.title ?? input.seoTitle ?? "Untitled";
  const bodyText = input.body ?? input.content ?? input.article ?? "";
  const description = input.seoDescription ?? "";
  const publishedAt = new Date().toISOString();

  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  const seqNum = await nextSeqForYmd(ymd);
  const seq = String(seqNum).padStart(3, "0");

  const baseSlug = slugifyBase(titleRaw);
  const slug = `${baseSlug}-${seq}`;

  const hashtags = normalizeHashtags(input.hashtags);
  const markdown = [
    "---",
    `title: ${JSON.stringify(titleRaw)}`,
    `description: ${JSON.stringify(description)}`,
    `slug: ${JSON.stringify(slug)}`,
    `publishedAt: ${JSON.stringify(publishedAt)}`,
    hashtags.length > 0
      ? "hashtags:\n" + hashtags.map((h) => `  - ${JSON.stringify(h)}`).join("\n")
      : "hashtags: []",
    ...extraFrontmatter(input),
    "---",
    "",
    bodyText.trimEnd() ? bodyText.trimEnd() + "\n" : ""
  ].join("\n");

  const filename = `${ymd}-${seq}-${baseSlug}.md`;
  const fullPath = path.join(STAGED_GUIDES_DIR, filename);
  const stagedRelativePath = path.join("content", "staged-guides", filename).split(path.sep).join("/");
  const finalRelativePath = path.join("content", "auto-posts", filename).split(path.sep).join("/");
  const plannedUrlPath = `/guides/${slug}`;
  return {
    markdown,
    filename,
    fullPath,
    stagedRelativePath,
    finalRelativePath,
    plannedUrlPath,
    slug
  };
}

export async function writeStagedGuide(input: WriteAutoPostInput): Promise<WriteStagedGuideResult> {
  await fs.mkdir(STAGED_GUIDES_DIR, { recursive: true });
  const c = await composeStagedGuide(input);
  await fs.writeFile(c.fullPath, c.markdown, "utf8");
  return {
    filename: c.filename,
    stagedRelativePath: c.stagedRelativePath,
    finalRelativePath: c.finalRelativePath,
    urlPath: "",
    plannedUrlPath: c.plannedUrlPath,
    slug: c.slug
  };
}

export type ComposedAutoPost = {
  markdown: string;
  filename: string;
  fullPath: string;
  relativePath: string;
  urlPath: string;
  slug: string;
};

/** Same bytes as writeAutoPost would write — use for final audit before disk. */
export async function composeAutoPost(input: WriteAutoPostInput): Promise<ComposedAutoPost> {
  const titleRaw = input.title ?? input.seoTitle ?? "Untitled";
  const bodyText = input.body ?? input.content ?? input.article ?? "";
  const description = input.seoDescription ?? "";
  const publishedAt = new Date().toISOString();

  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  const seqNum = await nextSeqForYmd(ymd);
  const seq = String(seqNum).padStart(3, "0");

  const baseSlug = slugifyBase(titleRaw);
  const slug = `${baseSlug}-${seq}`;

  const hashtags = normalizeHashtags(input.hashtags);
  const markdown = [
    "---",
    `title: ${JSON.stringify(titleRaw)}`,
    `description: ${JSON.stringify(description)}`,
    `slug: ${JSON.stringify(slug)}`,
    `publishedAt: ${JSON.stringify(publishedAt)}`,
    hashtags.length > 0
      ? "hashtags:\n" + hashtags.map((h) => `  - ${JSON.stringify(h)}`).join("\n")
      : "hashtags: []",
    ...extraFrontmatter(input),
    "---",
    "",
    bodyText.trimEnd() ? bodyText.trimEnd() + "\n" : ""
  ].join("\n");

  const filename = `${ymd}-${seq}-${baseSlug}.md`;
  const fullPath = path.join(AUTO_DIR, filename);
  const relativePath = path.join("content", "auto-posts", filename).split(path.sep).join("/");
  return {
    markdown,
    filename,
    fullPath,
    relativePath,
    urlPath: `/guides/${slug}`,
    slug
  };
}

export async function writeAutoPost(input: WriteAutoPostInput): Promise<WriteAutoPostResult> {
  await fs.mkdir(AUTO_DIR, { recursive: true });
  const c = await composeAutoPost(input);
  await fs.writeFile(c.fullPath, c.markdown, "utf8");
  return {
    filename: c.filename,
    relativePath: c.relativePath,
    urlPath: c.urlPath,
    slug: c.slug
  };
}
