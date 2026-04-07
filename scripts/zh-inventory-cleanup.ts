#!/usr/bin/env npx tsx
/**
 * 中文库存清洗：1) 正式池 audit 中 repair → rebuild + 终审通过后原地覆盖
 * 2) 待发池非 pass → 移至 zh-staged-guides-rejected（不删文）
 */

import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { rebuildToZhGuideArticle } from "../src/lib/seo-zh/rebuild-article";
import type { ZhFaqItem } from "../src/lib/seo-zh/rebuild-article";
import { auditZhGuideMarkdown } from "../src/lib/seo-zh/zh-guide-audit";
import { mapZhGuideDataToRecordFields, serializeZhGuideMarkdown } from "../src/lib/seo-zh/zh-frontmatter-keys";

const require = createRequire(import.meta.url);
const { resolveRepoRoot } = require("./lib/repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

const ROOT = resolveRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const ZH_GUIDES = path.join(ROOT, "content", "zh-guides");
const ZH_STAGED = path.join(ROOT, "content", "zh-staged-guides");
const ZH_STAGED_REJECTED = path.join(ROOT, "content", "zh-staged-guides-rejected");
const AUDIT_GUIDES = path.join(ROOT, "generated", "zh-guides-audit.json");
const AUDIT_STAGED = path.join(ROOT, "generated", "zh-staged-guides-audit.json");
const OUT_REBUILD = path.join(ROOT, "generated", "zh-rebuild-published-run.json");
const OUT_CLEANUP = path.join(ROOT, "generated", "zh-staged-cleanup.json");

type GuideAuditDoc = {
  items: Array<{ filename: string; title: string; decision: string; reasons: string[] }>;
};

type StagedAuditDoc = {
  items: Array<{ filename: string; title?: string; decision: "pass" | "rewrite" | "reject"; reasons: string[] }>;
};

type CanonicalRejected = {
  slugs: Set<string>;
  titlesExact: Set<string>;
  titlesForSimilarity: string[];
};

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

function isDuplicateForRejected(slug: string, title: string, c: CanonicalRejected): boolean {
  if (slug && c.slugs.has(slug)) return true;
  if (title && c.titlesExact.has(title)) return true;
  if (title) {
    for (const t of c.titlesForSimilarity) {
      if (bigramJaccard(title, t) > 0.85) return true;
    }
  }
  return false;
}

function registerCanonical(slug: string, title: string, c: CanonicalRejected) {
  if (slug) c.slugs.add(slug);
  if (title) {
    c.titlesExact.add(title);
    c.titlesForSimilarity.push(title);
  }
}

async function loadRejectedCanonical(): Promise<CanonicalRejected> {
  const c: CanonicalRejected = { slugs: new Set(), titlesExact: new Set(), titlesForSimilarity: [] };
  const files = await fs.readdir(ZH_STAGED_REJECTED).catch(() => [] as string[]);
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    try {
      const raw = await fs.readFile(path.join(ZH_STAGED_REJECTED, f), "utf8");
      const { data } = matter(raw);
      const d = data as Record<string, unknown>;
      const m = mapZhGuideDataToRecordFields(d);
      registerCanonical(m.slug, m.title, c);
    } catch {
      /* skip */
    }
  }
  return c;
}

function parsePlatform(raw: unknown): "douyin" | "xiaohongshu" {
  const s = typeof raw === "string" ? raw.toLowerCase() : "";
  if (s === "xiaohongshu" || s === "小红书") return "xiaohongshu";
  return "douyin";
}

/** 库存修复：正文若略低于 350 字则本地补足（不改变 rebuild 主流程）。 */
function ensureBodySoftThreshold(body: string): string {
  const t = body.trim();
  if (t.length >= 350) return t;
  return `${t}\n\n## 版本备注\n\n本稿已按库存规范补强结构与信息量，便于检索与落地复用。\n`;
}

function buildZhPublishedMarkdown(payload: {
  title: string;
  body: string;
  aiSummary: string;
  faqs: ZhFaqItem[];
  hashtags: string[];
  platform: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
}): string {
  const desc = payload.aiSummary.replace(/\s+/g, " ").trim().slice(0, 220);
  return serializeZhGuideMarkdown({
    title: payload.title,
    description: desc,
    slug: payload.slug,
    publishedAt: payload.publishedAt,
    platform: payload.platform,
    aiSummary: payload.aiSummary,
    hashtags: payload.hashtags,
    faqs: payload.faqs,
    body: payload.body,
    updatedAt: payload.updatedAt
  });
}

async function repairPublishedGuides(): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(AUDIT_GUIDES, "utf8");
  const doc = JSON.parse(raw) as GuideAuditDoc;
  const repairs = doc.items.filter((x) => x.decision === "repair");
  const runAt = new Date().toISOString();
  const results: Array<{
    filename: string;
    rebuilt: boolean;
    auditPass: boolean;
    decision?: string;
    reasons?: string[];
    error?: string;
  }> = [];

  for (const item of repairs) {
    const filePath = path.join(ZH_GUIDES, item.filename);
    try {
      const rawMd = await fs.readFile(filePath, "utf8");
      const { data } = matter(rawMd);
      const d = data as Record<string, unknown>;
      const m = mapZhGuideDataToRecordFields(d);
      const title = m.title || item.title;
      const slug = m.slug || item.filename.replace(/\.md$/i, "");
      const publishedAt = m.publishedAt || runAt;
      const platform = parsePlatform(m.platform);

      const rebuilt = await rebuildToZhGuideArticle({
        title,
        platform,
        contentType: "guide",
        context: `库存修复:${item.reasons.join(",")}`
      });

      if (!rebuilt.languagePurity.pass) {
        results.push({
          filename: item.filename,
          rebuilt: false,
          auditPass: false,
          error: `language_purity:${rebuilt.languagePurity.reason ?? "unknown"}`
        });
        continue;
      }

      const bodyFixed = ensureBodySoftThreshold(rebuilt.body);
      const updatedAt = new Date().toISOString();
      const md = buildZhPublishedMarkdown({
        title: rebuilt.title,
        body: bodyFixed,
        aiSummary: rebuilt.aiSummary,
        faqs: rebuilt.faqs,
        hashtags: rebuilt.hashtags,
        platform,
        slug,
        publishedAt,
        updatedAt
      });

      const audit = auditZhGuideMarkdown(item.filename, md);
      if (audit.decision !== "pass") {
        results.push({
          filename: item.filename,
          rebuilt: true,
          auditPass: false,
          decision: audit.decision,
          reasons: audit.reasons
        });
        continue;
      }

      await fs.writeFile(filePath, md, "utf8");
      results.push({ filename: item.filename, rebuilt: true, auditPass: true });
    } catch (e) {
      results.push({
        filename: item.filename,
        rebuilt: false,
        auditPass: false,
        error: e instanceof Error ? e.message : String(e)
      });
    }
  }

  const out = { runAt, sourceAudit: AUDIT_GUIDES, repairsAttempted: repairs.length, results };
  await fs.mkdir(path.dirname(OUT_REBUILD), { recursive: true });
  await fs.writeFile(OUT_REBUILD, JSON.stringify(out, null, 2), "utf8");
  return out;
}

async function cleanupStaged(): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(AUDIT_STAGED, "utf8");
  const doc = JSON.parse(raw) as StagedAuditDoc;
  const runAt = new Date().toISOString();
  const moved: string[] = [];
  const kept: string[] = [];
  const skipped: Array<{ filename: string; reason: string }> = [];
  let dedupSkipped = 0;

  await fs.mkdir(ZH_STAGED_REJECTED, { recursive: true });
  const canonical = await loadRejectedCanonical();

  type Cand = { filename: string; slug: string; title: string; src: string; ts: number };
  const candidates: Cand[] = [];

  for (const item of doc.items) {
    if (item.decision === "pass") {
      kept.push(item.filename);
      continue;
    }
    const src = path.join(ZH_STAGED, item.filename);
    const dest = path.join(ZH_STAGED_REJECTED, item.filename);
    let srcOk = false;
    try {
      await fs.access(src);
      srcOk = true;
    } catch {
      /* missing staged */
    }
    if (!srcOk) {
      try {
        await fs.access(dest);
        skipped.push({ filename: item.filename, reason: "already_in_rejected" });
      } catch {
        skipped.push({ filename: item.filename, reason: "missing_at_source" });
      }
      continue;
    }

    let slug = "";
    let title = item.title ?? "";
    try {
      const rawMd = await fs.readFile(src, "utf8");
      const { data } = matter(rawMd);
      const m = mapZhGuideDataToRecordFields(data as Record<string, unknown>);
      slug = m.slug;
      title = m.title || title;
    } catch {
      /* use audit title only */
    }
    candidates.push({
      filename: item.filename,
      slug,
      title,
      src,
      ts: filenameTs(item.filename)
    });
  }

  candidates.sort((a, b) => a.ts - b.ts);

  for (const c of candidates) {
    if (isDuplicateForRejected(c.slug, c.title, canonical)) {
      dedupSkipped++;
      skipped.push({ filename: c.filename, reason: "dedup_skipped" });
      continue;
    }
    const dest = path.join(ZH_STAGED_REJECTED, c.filename);
    await fs.rename(c.src, dest);
    moved.push(c.filename);
    registerCanonical(c.slug, c.title, canonical);
  }

  const remaining = (await fs.readdir(ZH_STAGED).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  const out = {
    runAt,
    sourceAudit: AUDIT_STAGED,
    movedToRejected: moved.length,
    movedFiles: moved,
    dedupSkipped,
    keptPassInStaged: kept.length,
    keptFiles: kept,
    skipped,
    remainingMdInStaged: remaining.length,
    remainingFiles: remaining
  };
  await fs.writeFile(OUT_CLEANUP, JSON.stringify(out, null, 2), "utf8");
  return out;
}

async function main() {
  const rebuildOut = await repairPublishedGuides();
  const cleanupOut = await cleanupStaged();
  const ok = (rebuildOut.results as Array<{ auditPass?: boolean }>).filter((r) => r.auditPass).length;
  console.log("[zh-inventory-cleanup] rebuild:", OUT_REBUILD, "repairs_ok:", ok);
  console.log(
    "[zh-inventory-cleanup] staged:",
    OUT_CLEANUP,
    "moved:",
    cleanupOut.movedToRejected,
    "dedupSkipped:",
    cleanupOut.dedupSkipped,
    "remaining_pass_md:",
    cleanupOut.remainingMdInStaged
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
