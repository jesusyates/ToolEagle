#!/usr/bin/env npx tsx
/**
 * 构建中英文内容资产索引（staged + published），供生成前去重。
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import {
  normalizeTitleEn,
  scanZhContentAssetIndexFromDisk,
  type ContentAssetIndexEntry,
  type ContentAssetIndexFile
} from "../src/lib/seo/content-asset-index";
import { mapZhGuideDataToRecordFields } from "../src/lib/seo-zh/zh-frontmatter-keys";

const require = createRequire(import.meta.url);
const { resolveRepoRoot } = require("./lib/repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

const ROOT = resolveRepoRoot(path.dirname(fileURLToPath(import.meta.url)));

function fingerprint(body: string, aiSummary: string): string {
  return crypto.createHash("sha256").update(`${body}\n---\n${aiSummary}`, "utf8").digest("hex").slice(0, 40);
}

function titleTokenSetEn(title: string): string[] {
  return Array.from(
    new Set(
      normalizeTitleEn(title)
        .split(" ")
        .filter((w) => w.length > 2)
    )
  ).sort();
}

function titleTokenSetZh(title: string): string[] {
  const t = title.replace(/\s+/g, "").slice(0, 200);
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return Array.from(new Set(out)).sort();
}

async function scanDir(
  dir: string,
  status: "published" | "staged",
  language: "en" | "zh"
): Promise<ContentAssetIndexEntry[]> {
  const names = (await fs.readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
  const out: ContentAssetIndexEntry[] = [];
  for (const filename of names) {
    const full = path.join(dir, filename);
    let raw: string;
    try {
      raw = await fs.readFile(full, "utf8");
    } catch {
      continue;
    }
    const { data, content } = matter(raw);
    const d = data as Record<string, unknown>;
    const body = content.trim();
    let title = "";
    let slug = "";
    let publishedAt = "";
    let platform = "";
    let clusterTheme = "";
    let contentType = "";
    let aiSummary = "";
    if (language === "zh") {
      const m = mapZhGuideDataToRecordFields(d);
      title = m.title;
      slug = m.slug;
      publishedAt = m.publishedAt;
      platform = m.platform ?? "";
      aiSummary = m.aiSummary ?? "";
      clusterTheme = typeof d.clusterTheme === "string" ? d.clusterTheme : "";
      contentType = typeof d.contentType === "string" ? d.contentType : "";
    } else {
      title = typeof d.title === "string" ? d.title : "";
      slug = typeof d.slug === "string" ? d.slug : "";
      publishedAt = typeof d.publishedAt === "string" ? d.publishedAt : "";
      platform = typeof d.platform === "string" ? d.platform : "";
      clusterTheme = typeof d.clusterTheme === "string" ? d.clusterTheme : "";
      contentType = typeof d.contentType === "string" ? d.contentType : "";
      aiSummary = typeof d.aiSummary === "string" ? d.aiSummary : "";
    }
    const nt = language === "en" ? normalizeTitleEn(title) : title.replace(/\s+/g, "").toLowerCase();
    const tokenSet = language === "en" ? titleTokenSetEn(title) : titleTokenSetZh(title);
    out.push({
      filename,
      title,
      slug,
      language,
      platform: platform || "unknown",
      clusterTheme: clusterTheme || "",
      contentType: contentType || "unknown",
      publishedAt,
      status,
      normalizedTitle: nt,
      titleTokenSet: tokenSet,
      contentFingerprint: fingerprint(body, aiSummary)
    });
  }
  return out;
}

async function buildEn(): Promise<ContentAssetIndexFile> {
  const auto = await scanDir(path.join(ROOT, "content", "auto-posts"), "published", "en");
  const sent = await scanDir(path.join(ROOT, "content", "sent-guides"), "published", "en");
  const staged = await scanDir(path.join(ROOT, "content", "staged-guides"), "staged", "en");
  const bySlug = new Map<string, (typeof auto)[number]>();
  for (const e of [...auto, ...sent]) {
    if (e.slug) bySlug.set(e.slug, e);
  }
  const entries = [...bySlug.values(), ...staged];
  return {
    generatedAt: new Date().toISOString(),
    language: "en",
    entryCount: entries.length,
    entries
  };
}

async function buildZh(): Promise<ContentAssetIndexFile> {
  const entries = scanZhContentAssetIndexFromDisk(ROOT);
  return {
    generatedAt: new Date().toISOString(),
    language: "zh",
    entryCount: entries.length,
    entries
  };
}

async function main() {
  const en = await buildEn();
  const zh = await buildZh();
  const outEn = path.join(ROOT, "generated", "content-asset-index-en.json");
  const outZh = path.join(ROOT, "generated", "content-asset-index-zh.json");
  await fs.mkdir(path.dirname(outEn), { recursive: true });
  await fs.writeFile(outEn, JSON.stringify(en, null, 2), "utf8");
  await fs.writeFile(outZh, JSON.stringify(zh, null, 2), "utf8");
  console.log("[build-content-asset-index]", outEn, en.entryCount, outZh, zh.entryCount);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
