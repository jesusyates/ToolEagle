#!/usr/bin/env npx tsx
/**
 * 将 legacy 审计中 decision=rebuild 的项接入 V300 重建 → zh-staged-guides（不发布、不碰 keep/freeze）。
 */

import fs from "node:fs";
import path from "node:path";
import { rebuildToZhGuideArticle } from "../src/lib/seo-zh/rebuild-article";
import { serializeZhGuideMarkdown } from "../src/lib/seo-zh/zh-frontmatter-keys";
import { evaluateZhTopicReadiness } from "../src/lib/seo-zh/topic-gate";
import { evaluateZhContentLanguage } from "../src/lib/seo-zh/language-gate";

const ROOT = process.cwd();
const AUDIT_JSON = path.join(ROOT, "generated", "seo-zh-legacy-content-audit.json");
const OUT_JSON = path.join(ROOT, "generated", "seo-zh-rebuild-run.json");
const ZH_STAGED = path.join(ROOT, "content", "zh-staged-guides");
const ZH_KEYWORDS = path.join(ROOT, "data", "zh-keywords.json");
const ZH_SEO = path.join(ROOT, "data", "zh-seo.json");

type AuditItem = {
  title: string;
  slug: string;
  path: string;
  detectedPlatform: string;
  decision: string;
};

function parseLimit(): number {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  if (!a) return 20;
  const n = parseInt(a.slice("--limit=".length), 10);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

function slugifyZh(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\u4e00-\u9fff\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "zh-guide";
}

function collectStrings(v: unknown, acc: string[]): void {
  if (v == null) return;
  if (typeof v === "string") {
    acc.push(v);
    return;
  }
  if (Array.isArray(v)) {
    for (const x of v) collectStrings(x, acc);
    return;
  }
  if (typeof v === "object") {
    for (const x of Object.values(v as Record<string, unknown>)) collectStrings(x, acc);
  }
}

function mapPlatform(detected: string): "douyin" | "xiaohongshu" {
  const d = detected.toLowerCase();
  if (d === "xiaohongshu" || d.includes("hongshu")) return "xiaohongshu";
  return "douyin";
}

function getZhSeoLeaf(obj: unknown, parts: string[]): unknown {
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function loadSourceSnippet(item: AuditItem): string | null {
  if (item.path === "data/zh-keywords.json") {
    if (!fs.existsSync(ZH_KEYWORDS)) return null;
    const raw = JSON.parse(fs.readFileSync(ZH_KEYWORDS, "utf8")) as Record<string, unknown>;
    const rec = raw[item.slug];
    if (!rec) return null;
    const acc: string[] = [];
    collectStrings(rec, acc);
    return acc.join("\n").slice(0, 1200);
  }
  if (item.path === "data/zh-seo.json") {
    if (!fs.existsSync(ZH_SEO)) return null;
    const raw = JSON.parse(fs.readFileSync(ZH_SEO, "utf8"));
    const parts = item.slug.split("/").filter(Boolean);
    const leaf = getZhSeoLeaf(raw, parts);
    if (!leaf) return null;
    const acc: string[] = [];
    collectStrings(leaf, acc);
    return acc.join("\n").slice(0, 1200);
  }
  const rel = item.path.replace(/^\//, "");
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8").slice(0, 1200);
}

function writeZhStagedMd(payload: {
  title: string;
  body: string;
  aiSummary: string;
  faqs: { question: string; answer: string }[];
  hashtags: string[];
  platform: string;
  slug: string;
}): string {
  const publishedAt = new Date().toISOString();
  const desc = payload.aiSummary.replace(/\s+/g, " ").trim().slice(0, 220);
  const fm = serializeZhGuideMarkdown({
    title: payload.title,
    description: desc,
    slug: payload.slug,
    publishedAt,
    platform: payload.platform,
    aiSummary: payload.aiSummary,
    hashtags: payload.hashtags,
    faqs: payload.faqs,
    body: payload.body
  });
  const fname = `zh-${Date.now()}-${slugifyZh(payload.title).slice(0, 40)}-${Math.random().toString(36).slice(2, 8)}.md`;
  fs.mkdirSync(ZH_STAGED, { recursive: true });
  const full = path.join(ZH_STAGED, fname);
  fs.writeFileSync(full, fm, "utf8");
  return fname;
}

function main() {
  const limit = parseLimit();
  if (!fs.existsSync(AUDIT_JSON)) {
    console.error("[zh-rebuild-legacy] missing", AUDIT_JSON);
    process.exit(1);
  }
  const audit = JSON.parse(fs.readFileSync(AUDIT_JSON, "utf8")) as { items: AuditItem[] };
  const rebuild = audit.items.filter((i) => i.decision === "rebuild");
  const batch = rebuild.slice(0, limit);

  let attempted = 0;
  let passed = 0;
  let skipped = 0;
  let writtenToStaged = 0;
  let languageGatePassed = 0;
  let languageGateFailedCount = 0;
  const sourceTitles: string[] = [];
  const sessionTitles: string[] = [];

  for (const item of batch) {
    attempted++;
    sourceTitles.push(item.title);

    const snippet = loadSourceSnippet(item);
    if (snippet == null) {
      skipped++;
      continue;
    }

    const topic = item.title.trim();
    const tr = evaluateZhTopicReadiness({ topic, existingTitles: sessionTitles });
    if (tr.decision !== "pass") {
      skipped++;
      continue;
    }

    const platform = mapPlatform(item.detectedPlatform);
    const ctx = `legacy:${item.slug} path:${item.path}\n${snippet.slice(0, 600)}`;
    const article = rebuildToZhGuideArticle({
      title: topic,
      context: ctx,
      platform,
      contentType: tr.contentType
    });
    if (!article.languagePurity.pass) {
      languageGateFailedCount++;
      skipped++;
      continue;
    }
    const zhText = [
      article.title,
      article.body,
      article.aiSummary,
      ...article.faqs.flatMap((f) => [f.question, f.answer]),
      ...article.hashtags
    ].join("\n");
    const zg = evaluateZhContentLanguage(zhText);
    if (!zg.passed) {
      languageGateFailedCount++;
      skipped++;
      continue;
    }
    languageGatePassed++;
    const slug = `legacy-${slugifyZh(topic)}-${writtenToStaged + 1}`;
    try {
      writeZhStagedMd({
        title: article.title,
        body: article.body,
        aiSummary: article.aiSummary,
        faqs: article.faqs,
        hashtags: article.hashtags,
        platform,
        slug
      });
      passed++;
      writtenToStaged++;
      sessionTitles.push(topic);
    } catch {
      skipped++;
    }
  }

  const doc = {
    runAt: new Date().toISOString(),
    limit,
    attempted,
    passed,
    skipped,
    writtenToStaged,
    languageGatePassed,
    languageGateFailedCount,
    sourceTitles
  };
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2), "utf8");
  console.log("[zh-rebuild-legacy]", OUT_JSON, doc);
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
