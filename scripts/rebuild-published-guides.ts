#!/usr/bin/env npx tsx
/**
 * Rebuild repair-tier EN auto-posts via rebuild-article → final audit → replace (slug preserved).
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { rebuildToSeoArticle } from "../src/lib/seo/rebuild-article";
import { auditPublishedGuideMarkdown } from "../src/lib/seo/published-guide-audit";
import type { FaqItem } from "../src/lib/seo/rebuild-article";

const ROOT = process.cwd();
const AUDIT_JSON = path.join(ROOT, "generated", "published-guides-audit.json");
const AUTO = path.join(ROOT, "content", "auto-posts");
const OUT = path.join(ROOT, "generated", "rebuild-published-run.json");

function parseLimit(): number | undefined {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  if (!a) return undefined;
  const n = parseInt(a.slice("--limit=".length), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function buildAutoPostMd(params: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  body: string;
  hashtags: string[];
  aiSummary: string;
  faqs: FaqItem[];
}): string {
  const faqsYaml =
    "faqs:\n" +
    params.faqs
      .map((f) => `  - question: ${JSON.stringify(f.question)}\n    answer: ${JSON.stringify(f.answer)}`)
      .join("\n");
  const tags =
    params.hashtags.length > 0
      ? "hashtags:\n" + params.hashtags.map((h) => `  - ${JSON.stringify(h)}`).join("\n")
      : "hashtags: []";
  return [
    "---",
    `title: ${JSON.stringify(params.title)}`,
    `description: ${JSON.stringify(params.description)}`,
    `slug: ${JSON.stringify(params.slug)}`,
    `publishedAt: ${JSON.stringify(params.publishedAt)}`,
    tags,
    `aiSummary: ${JSON.stringify(params.aiSummary)}`,
    faqsYaml,
    `contentType: ${JSON.stringify("guide")}`,
    "---",
    "",
    params.body.trim() + "\n"
  ].join("\n");
}

async function main() {
  const limit = parseLimit();
  const audit = JSON.parse(await fs.readFile(AUDIT_JSON, "utf8")) as {
    items: { filename: string; decision: string }[];
  };
  const repair = audit.items.filter((x) => x.decision === "repair");
  const batch = limit != null ? repair.slice(0, limit) : repair;

  let attempted = 0;
  let passed = 0;
  let replaced = 0;
  let skipped = 0;

  for (const row of batch) {
    attempted++;
    const filename = row.filename;
    const full = path.join(AUTO, filename);
    let raw: string;
    try {
      raw = await fs.readFile(full, "utf8");
    } catch {
      skipped++;
      console.error("[rebuild-published] missing file", filename);
      continue;
    }

    const { data } = matter(raw);
    const slug = typeof data.slug === "string" ? data.slug : "";
    const publishedAt = typeof data.publishedAt === "string" ? data.publishedAt : new Date().toISOString();
    const oldTitle = typeof data.title === "string" ? data.title : filename;
    const descHint = typeof data.description === "string" ? data.description : "";
    const ctx = `Rebuild published guide. Original description hint: ${descHint.slice(0, 400)}`;

    const article = await rebuildToSeoArticle({
      title: oldTitle,
      context: ctx,
      contentType: "guide"
    });

    const plainDesc = article.body
      .replace(/#{1,6}\s+/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 220);

    const newMd = buildAutoPostMd({
      title: article.title,
      description: plainDesc || article.aiSummary.slice(0, 200),
      slug: slug || String(data.slug ?? ""),
      publishedAt,
      body: article.body,
      hashtags: article.hashtags,
      aiSummary: article.aiSummary,
      faqs: article.faqs
    });

    if (!slug) {
      skipped++;
      console.error("[rebuild-published] skip (no slug)", filename);
      continue;
    }

    const finalAudit = auditPublishedGuideMarkdown(filename, newMd);
    if (finalAudit.decision !== "pass") {
      skipped++;
      console.log(
        "[rebuild-published] final audit skip",
        filename,
        finalAudit.decision,
        finalAudit.reasons.join(", ")
      );
      continue;
    }

    passed++;
    try {
      await fs.writeFile(full, newMd, "utf8");
      replaced++;
      console.log("[rebuild-published] replaced", filename);
    } catch (e) {
      skipped++;
      console.error("[rebuild-published] write failed", filename, e);
    }
  }

  const doc = {
    runAt: new Date().toISOString(),
    limit: limit ?? null,
    attempted,
    passed,
    replaced,
    skipped
  };
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[rebuild-published]", OUT, doc);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
