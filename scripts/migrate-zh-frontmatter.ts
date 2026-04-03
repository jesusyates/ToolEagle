#!/usr/bin/env npx tsx
/**
 * 将 content/zh-guides 与 content/zh-staged-guides 下 md 的 frontmatter 键名统一为中文（值不变）。
 */

import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { mapZhGuideDataToRecordFields, serializeZhGuideMarkdown } from "../src/lib/seo-zh/zh-frontmatter-keys";

const require = createRequire(import.meta.url);
const { resolveRepoRoot } = require("./lib/repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

const ROOT = resolveRepoRoot(path.dirname(fileURLToPath(import.meta.url)));

async function migrateDir(dir: string): Promise<number> {
  let n = 0;
  const files = (await fs.readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const full = path.join(dir, f);
    const raw = await fs.readFile(full, "utf8");
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    const m = mapZhGuideDataToRecordFields(d);
    const desc = (m.description || m.aiSummary?.slice(0, 220) || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
    const faqs = m.faqs?.map((x) => ({ question: x.question, answer: x.answer })) ?? [];
    const out = serializeZhGuideMarkdown({
      title: m.title,
      description: desc,
      slug: m.slug,
      publishedAt: m.publishedAt || new Date().toISOString(),
      platform: m.platform || "douyin",
      aiSummary: m.aiSummary || "",
      hashtags: m.hashtags,
      faqs,
      body: content.trim(),
      updatedAt: m.updatedAt
    });
    if (out.trim() !== raw.trim()) {
      await fs.writeFile(full, out, "utf8");
      n++;
      console.log("[migrate-zh-frontmatter]", full);
    }
  }
  return n;
}

async function main() {
  const a = await migrateDir(path.join(ROOT, "content", "zh-guides"));
  const b = await migrateDir(path.join(ROOT, "content", "zh-staged-guides"));
  console.log("[migrate-zh-frontmatter] done", { zhGuides: a, zhStaged: b });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
