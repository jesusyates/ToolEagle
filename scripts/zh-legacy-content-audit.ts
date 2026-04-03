#!/usr/bin/env npx tsx
/**
 * Legacy Chinese content tiering (keep | rebuild | freeze) — read-only audit.
 * Sources: data/zh-keywords.json, data/zh-seo.json, content/zh-guides, content/zh-staged-guides
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "seo-zh-legacy-content-audit.json");

type Decision = "keep" | "rebuild" | "freeze";

type AuditItem = {
  title: string;
  slug: string;
  path: string;
  detectedPlatform: string;
  decision: Decision;
  reasons: string[];
};

const CJK = /[\u4e00-\u9fff]/g;

function cjkRatio(text: string): number {
  if (!text.length) return 0;
  const m = text.match(CJK);
  return (m?.length ?? 0) / text.length;
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

function detectPlatform(blob: string): string {
  const hasDouyin = /抖音|抖店/.test(blob);
  const hasXhs = /小红书|红书/.test(blob);
  const hasTikTok = /(?<![\w])tiktok(?![\w])/i.test(blob);
  const hasIg = /instagram|照片墙/i.test(blob);
  const hasYt = /youtube|油管|youtu\.be/i.test(blob);

  if (hasDouyin && hasXhs) return "mixed";
  if (hasDouyin) return "douyin";
  if (hasXhs) return "xiaohongshu";
  if (hasIg && !hasDouyin && !hasXhs) return "instagram";
  if (hasYt && !hasDouyin && !hasXhs) return "youtube";
  if (hasTikTok) return "tiktok";
  return "unknown";
}

function classify(blob: string, totalLen: number, ratio: number): { decision: Decision; reasons: string[] } {
  const reasons: string[] = [];
  const hasLocal = /抖音|抖店|小红书|红书/.test(blob);
  const westernMismatch =
    /instagram|youtube|油管|Instagram|YouTube/i.test(blob) && !hasLocal;

  if (totalLen < 400) {
    reasons.push("内容过薄或有效字段过少");
    return { decision: "freeze", reasons };
  }

  if (ratio < 0.06 && totalLen > 300) {
    reasons.push("主体非中文占比过高，与中文主链错配");
    return { decision: "freeze", reasons };
  }

  if (westernMismatch) {
    reasons.push("以 Instagram/YouTube 等为主且未对齐抖音/小红书语境");
    return { decision: "freeze", reasons };
  }

  if (hasLocal && totalLen >= 2200 && ratio >= 0.18) {
    reasons.push("抖音/小红书相关且篇幅与中文密度达标，可保留进入评估");
    return { decision: "keep", reasons };
  }

  if (hasLocal && totalLen >= 500) {
    reasons.push("本土平台主题明确但结构或篇幅需按新引擎重写");
    return { decision: "rebuild", reasons };
  }

  if (totalLen >= 800 && ratio >= 0.12) {
    reasons.push("主题可救，建议按新中文引擎模板重写");
    return { decision: "rebuild", reasons };
  }

  reasons.push("价值偏低或与新主链不匹配，建议冻结保留");
  return { decision: "freeze", reasons };
}

function readZhKeywords(): AuditItem[] {
  const p = path.join(ROOT, "data", "zh-keywords.json");
  if (!fs.existsSync(p)) return [];
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, unknown>;
  const items: AuditItem[] = [];
  for (const [slug, rec] of Object.entries(raw)) {
    const acc: string[] = [];
    collectStrings(rec, acc);
    const blob = acc.join("\n");
    const totalLen = blob.length;
    const ratio = cjkRatio(blob);
    const { decision, reasons } = classify(blob, totalLen, ratio);
    const title =
      rec && typeof rec === "object" && typeof (rec as { title?: string }).title === "string"
        ? (rec as { title: string }).title
        : slug;
    items.push({
      title,
      slug,
      path: "data/zh-keywords.json",
      detectedPlatform: detectPlatform(blob),
      decision,
      reasons
    });
  }
  return items;
}

function flattenZhSeo(obj: unknown, prefix: string[]): AuditItem[] {
  const items: AuditItem[] = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return items;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = [...prefix, k];
    if (v && typeof v === "object" && !Array.isArray(v) && "title" in (v as Record<string, unknown>)) {
      const acc: string[] = [];
      collectStrings(v, acc);
      const blob = acc.join("\n");
      const totalLen = blob.length;
      const ratio = cjkRatio(blob);
      const { decision, reasons } = classify(blob, totalLen, ratio);
      const slug = next.join("/");
      const title =
        typeof (v as { title?: string }).title === "string" ? (v as { title: string }).title : slug;
      items.push({
        title,
        slug,
        path: "data/zh-seo.json",
        detectedPlatform: detectPlatform(blob),
        decision,
        reasons
      });
    } else {
      items.push(...flattenZhSeo(v, next));
    }
  }
  return items;
}

function readMdGuides(dir: string): AuditItem[] {
  const items: AuditItem[] = [];
  if (!fs.existsSync(dir)) return items;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const full = path.join(dir, name);
    const text = fs.readFileSync(full, "utf8");
    const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
    const titleMatch = firstLine.replace(/^#\s*/, "").trim();
    const title = titleMatch || name.replace(/\.md$/i, "");
    const blob = text;
    const totalLen = blob.length;
    const ratio = cjkRatio(blob);
    const { decision, reasons } = classify(blob, totalLen, ratio);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    const slug = name.replace(/\.md$/i, "");
    items.push({
      title,
      slug,
      path: rel,
      detectedPlatform: detectPlatform(blob),
      decision,
      reasons
    });
  }
  return items;
}

function main() {
  const zhSeoPath = path.join(ROOT, "data", "zh-seo.json");
  const zhSeoItems = fs.existsSync(zhSeoPath)
    ? flattenZhSeo(JSON.parse(fs.readFileSync(zhSeoPath, "utf8")), [])
    : [];

  const items: AuditItem[] = [
    ...readZhKeywords(),
    ...zhSeoItems,
    ...readMdGuides(path.join(ROOT, "content", "zh-guides")),
    ...readMdGuides(path.join(ROOT, "content", "zh-staged-guides"))
  ];

  let keepCount = 0;
  let rebuildCount = 0;
  let freezeCount = 0;
  for (const it of items) {
    if (it.decision === "keep") keepCount++;
    else if (it.decision === "rebuild") rebuildCount++;
    else freezeCount++;
  }

  const doc = {
    generatedAt: new Date().toISOString(),
    total: items.length,
    keepCount,
    rebuildCount,
    freezeCount,
    items
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log(
    "[zh-legacy-content-audit]",
    OUT,
    { total: doc.total, keepCount, rebuildCount, freezeCount }
  );
}

main();
