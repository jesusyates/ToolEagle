#!/usr/bin/env npx tsx
/**
 * 一次性：content/zh-staged-guides-rejected 去重 + 英文污染统计；重复稿移至 rejected-archive。
 * 不触碰 zh-guides / zh-staged-guides。
 */

import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { mapZhGuideDataToRecordFields } from "../src/lib/seo-zh/zh-frontmatter-keys";

const require = createRequire(import.meta.url);
const { resolveRepoRoot } = require("./lib/repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

const ROOT = resolveRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const REJECTED = path.join(ROOT, "content", "zh-staged-guides-rejected");
const ARCHIVE = path.join(ROOT, "content", "zh-staged-guides-rejected-archive");
const OUT_JSON = path.join(ROOT, "generated", "zh-rejected-cleanup.json");

const LATIN_RUN = /[A-Za-z]{3,}/;
const EN_PLATFORM = /\b(tiktok|instagram|youtube|facebook|twitter|linkedin|meta|reels|shorts|snapchat|pinterest)\b/i;

type Canonical = {
  slugs: Set<string>;
  titlesExact: Set<string>;
  titlesForSimilarity: string[];
};

function collectScanText(data: Record<string, unknown>, body: string): string {
  const m = mapZhGuideDataToRecordFields(data);
  const parts: string[] = [body, m.title, m.description, m.aiSummary ?? ""];
  if (m.faqs) {
    for (const f of m.faqs) {
      parts.push(f.question, f.answer);
    }
  }
  for (const h of m.hashtags) parts.push(h);
  return parts.join("\n");
}

function isEnglishContaminated(data: Record<string, unknown>, body: string): boolean {
  const scan = collectScanText(data, body);
  return LATIN_RUN.test(scan) || EN_PLATFORM.test(scan);
}

function bigramJaccard(a: string, b: string): number {
  const grams = (s: string) => {
    const t = s.replace(/\s+/g, "").slice(0, 240);
    if (t.length < 2) return new Set<string>();
    const g = new Set<string>();
    for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2));
    return g;
  };
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter++;
  }
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function filenameTs(name: string): number {
  const m = /^zh-(\d+)-/.exec(name);
  return m ? parseInt(m[1], 10) : 0;
}

function isDuplicate(slug: string, title: string, c: Canonical): boolean {
  if (slug && c.slugs.has(slug)) return true;
  if (title && c.titlesExact.has(title)) return true;
  if (title) {
    for (const t of c.titlesForSimilarity) {
      if (bigramJaccard(title, t) > 0.85) return true;
    }
  }
  return false;
}

function register(slug: string, title: string, c: Canonical) {
  if (slug) c.slugs.add(slug);
  if (title) {
    c.titlesExact.add(title);
    c.titlesForSimilarity.push(title);
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function moveToArchive(src: string, filename: string): Promise<string> {
  await fs.mkdir(ARCHIVE, { recursive: true });
  let dest = path.join(ARCHIVE, filename);
  if (await pathExists(dest)) {
    const base = filename.replace(/\.md$/i, "");
    dest = path.join(ARCHIVE, `${base}-dup-${Date.now()}.md`);
  }
  await fs.rename(src, dest);
  return path.basename(dest);
}

type Item = {
  filename: string;
  slug: string;
  title: string;
  ts: number;
  contaminated: boolean;
  fullPath: string;
};

async function main() {
  const names = (await fs.readdir(REJECTED).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  const totalBefore = names.length;

  const items: Item[] = [];
  for (const filename of names) {
    const fullPath = path.join(REJECTED, filename);
    const raw = await fs.readFile(fullPath, "utf8");
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    const slug = typeof d.slug === "string" ? d.slug : "";
    const title = typeof d.title === "string" ? d.title : "";
    items.push({
      filename,
      slug,
      title,
      ts: filenameTs(filename),
      contaminated: isEnglishContaminated(d, content),
      fullPath
    });
  }

  const englishContaminatedCount = items.filter((i) => i.contaminated).length;
  items.sort((a, b) => a.ts - b.ts);

  const canonical: Canonical = { slugs: new Set(), titlesExact: new Set(), titlesForSimilarity: [] };
  const keptFiles: string[] = [];
  const removedFiles: string[] = [];
  const archivedAs: string[] = [];

  for (const it of items) {
    if (isDuplicate(it.slug, it.title, canonical)) {
      const arcBase = await moveToArchive(it.fullPath, it.filename);
      removedFiles.push(it.filename);
      archivedAs.push(`content/zh-staged-guides-rejected-archive/${arcBase}`);
    } else {
      register(it.slug, it.title, canonical);
      keptFiles.push(it.filename);
    }
  }

  const totalAfter = keptFiles.length;
  const duplicateRemoved = removedFiles.length;

  const doc = {
    generatedAt: new Date().toISOString(),
    totalBefore,
    totalAfter,
    duplicateRemoved,
    englishContaminatedCount,
    keptFiles,
    removedFiles,
    archivedPaths: archivedAs
  };

  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify(doc, null, 2), "utf8");

  console.log("[zh-rejected-cleanup]", OUT_JSON, {
    totalBefore,
    totalAfter,
    duplicateRemoved,
    englishContaminatedCount
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
