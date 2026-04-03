#!/usr/bin/env npx tsx
/**
 * One-shot repair closure for EN published guides: rebuild → final audit → replace (slug + publishedAt kept, updatedAt set) or freeze.
 * Does not touch the main generation chain. No deletions.
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
const OUT = path.join(ROOT, "generated", "rebuild-published-run-final.json");

function buildAutoPostMd(params: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
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
    `updatedAt: ${JSON.stringify(params.updatedAt)}`,
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
  const audit = JSON.parse(await fs.readFile(AUDIT_JSON, "utf8")) as {
    items: { filename: string; title: string; decision: string; reasons: string[] }[];
  };
  const repair = audit.items.filter((x) => x.decision === "repair");

  const attempted: string[] = [];
  const replaced: string[] = [];
  const frozen: Array<{ filename: string; reasons: string[] }> = [];
  const skipped: string[] = [];
  const filenames: string[] = [];

  for (const row of repair) {
    const filename = row.filename;
    filenames.push(filename);
    attempted.push(filename);
    const full = path.join(AUTO, filename);
    let raw: string;
    try {
      raw = await fs.readFile(full, "utf8");
    } catch {
      skipped.push(filename);
      continue;
    }

    const { data } = matter(raw);
    const slug = typeof data.slug === "string" ? data.slug : "";
    const publishedAt =
      typeof data.publishedAt === "string" ? data.publishedAt : new Date().toISOString();
    const oldTitle = typeof data.title === "string" ? data.title : filename;
    const descHint = typeof data.description === "string" ? data.description : "";
    const ctx = `Rebuild published guide. Original description hint: ${descHint.slice(0, 400)}`;

    if (!slug) {
      skipped.push(filename);
      continue;
    }

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

    const updatedAt = new Date().toISOString();
    const newMd = buildAutoPostMd({
      title: article.title,
      description: plainDesc || article.aiSummary.slice(0, 200),
      slug,
      publishedAt,
      updatedAt,
      body: article.body,
      hashtags: article.hashtags,
      aiSummary: article.aiSummary,
      faqs: article.faqs
    });

    const finalAudit = auditPublishedGuideMarkdown(filename, newMd);
    if (finalAudit.decision !== "pass") {
      frozen.push({ filename, reasons: finalAudit.reasons });
      continue;
    }

    try {
      await fs.writeFile(full, newMd, "utf8");
      replaced.push(filename);
    } catch {
      skipped.push(filename);
    }
  }

  let prevRun: { skipped?: number; attempted?: number } | null = null;
  try {
    prevRun = JSON.parse(await fs.readFile(path.join(ROOT, "generated", "rebuild-published-run.json"), "utf8"));
  } catch {
    prevRun = null;
  }

  const doc = {
    runAt: new Date().toISOString(),
    attempted: attempted.length,
    replaced: replaced.length,
    frozen: frozen.length,
    skipped: skipped.length,
    filenames,
    frozenDetail: frozen,
    skippedFilenames: skipped,
    replacedFilenames: replaced,
    sourceAudit: "generated/published-guides-audit.json",
    repairCountInAudit: repair.length,
    previousRebuildPublishedRun: prevRun,
    note:
      repair.length === 0
        ? "No repair-tier items in published-guides-audit.json; EN formal pool needs no further repair actions."
        : undefined
  };

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[rebuild-published-final]", OUT, {
    attempted: doc.attempted,
    replaced: doc.replaced,
    frozen: doc.frozen,
    skipped: doc.skipped
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
