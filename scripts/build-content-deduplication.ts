#!/usr/bin/env npx tsx
/**
 * V172 — Title / topic fingerprints for programmatic generation dedup.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const BLOG = path.join(ROOT, "content", "blog");
const OUT = path.join(ROOT, "generated", "content-deduplication.json");

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(normalizeTitle(s).split(" ").filter((w) => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function main() {
  const titles: { slug: string; title: string; normalized: string }[] = [];
  if (fs.existsSync(BLOG)) {
    for (const name of fs.readdirSync(BLOG)) {
      if (!name.endsWith(".mdx")) continue;
      const raw = fs.readFileSync(path.join(BLOG, name), "utf8");
      const { data } = matter(raw);
      const title = String(data.title ?? "").trim();
      const slug = String(data.slug ?? name.replace(/\.mdx$/i, "")).trim();
      if (!title) continue;
      titles.push({ slug, title, normalized: normalizeTitle(title) });
    }
  }

  const clusters: { similarity: number; slugs: string[] }[] = [];
  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      const sim = jaccard(tokens(titles[i].normalized), tokens(titles[j].normalized));
      if (sim >= 0.62) {
        clusters.push({ similarity: Math.round(sim * 1000) / 1000, slugs: [titles[i].slug, titles[j].slug] });
      }
    }
  }

  const doc = {
    version: "172",
    builtAt: new Date().toISOString(),
    title_similarity_threshold_blog: 0.55,
    title_similarity_threshold_topic: 0.82,
    blog_title_count: titles.length,
    titles,
    similar_pairs: clusters.slice(0, 500)
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[build-content-deduplication]", OUT, titles.length, "titles,", clusters.length, "similar pairs");
}

main();
