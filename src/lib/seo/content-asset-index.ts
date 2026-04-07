/**
 * 统一内容资产索引：生成前去重（与主链编排解耦）。
 * EN：读 generated/content-asset-index-en.json。
 * ZH：仅来自 content/zh-guides 与 content/zh-staged-guides 的现磁盘 .md（同步扫描，不读可能过期的 zh JSON）。
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import { mapZhGuideDataToRecordFields } from "../seo-zh/zh-frontmatter-keys";
import { enContentTokenJaccard, normalizeEnTitleForDedup } from "./title-dedup-tokens";

export type ContentAssetIndexEntry = {
  filename: string;
  title: string;
  slug: string;
  language: "en" | "zh";
  platform: string;
  clusterTheme: string;
  contentType: string;
  publishedAt: string;
  status: "published" | "staged";
  normalizedTitle: string;
  titleTokenSet: string[];
  contentFingerprint: string;
};

export type ContentAssetIndexFile = {
  generatedAt: string;
  language: "en" | "zh";
  entryCount: number;
  entries: ContentAssetIndexEntry[];
};

/** Content-token Jaccard (EN); higher bar than legacy raw-token 0.93. */
const SIMILARITY_THRESHOLD_EN = 0.96;
const SIMILARITY_THRESHOLD_ZH = 0.93;

export function normalizeTitleEn(s: string): string {
  return normalizeEnTitleForDedup(s);
}

function zhFingerprint(body: string, aiSummary: string): string {
  return crypto.createHash("sha256").update(`${body}\n---\n${aiSummary}`, "utf8").digest("hex").slice(0, 40);
}

function titleTokenSetZh(title: string): string[] {
  const t = title.replace(/\s+/g, "").slice(0, 200);
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return Array.from(new Set(out)).sort();
}

function bigramJaccardZh(a: string, b: string): number {
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

/** 仅中文：与 topicHitsAssetIndex 一致，返回命中的条目（用于日志）。 */
export function findZhTopicAssetIndexHit(
  topic: string,
  entries: ContentAssetIndexEntry[]
): { kind: "exact" | "similar"; entry: ContentAssetIndexEntry } | null {
  const t = topic.trim();
  if (!t || entries.length === 0) return null;
  for (const e of entries) {
    if (e.title.trim() === t) return { kind: "exact", entry: e };
  }
  for (const e of entries) {
    if (bigramJaccardZh(t, e.title) >= SIMILARITY_THRESHOLD_ZH) return { kind: "similar", entry: e };
  }
  return null;
}

/** 命中原因（仅 EN 精细；ZH 仍用 boolean）。 */
export function describeEnAssetIndexHit(topic: string, entries: ContentAssetIndexEntry[]): string | null {
  const t = topic.trim();
  if (!t || entries.length === 0) return null;
  const nt = normalizeTitleEn(t);
  for (const e of entries) {
    if (normalizeTitleEn(e.title) === nt) return "asset_duplicate:exact_normalized_title";
  }
  for (const e of entries) {
    const j = enContentTokenJaccard(t, e.title);
    if (j >= SIMILARITY_THRESHOLD_EN) return `asset_duplicate:high_similarity_content_jaccard=${j.toFixed(3)}`;
  }
  return null;
}

/** 生成前检测：命中则不应再调模型。 */
export function topicHitsAssetIndex(topic: string, language: "en" | "zh", entries: ContentAssetIndexEntry[]): boolean {
  const t = topic.trim();
  if (!t || entries.length === 0) return false;
  if (language === "en") {
    return describeEnAssetIndexHit(t, entries) !== null;
  }
  return findZhTopicAssetIndexHit(t, entries) !== null;
}

/** 仅统计 zh-guides / zh-staged-guides 下 .md 数量（调试用）。 */
export function countZhAssetIndexSourceMdFiles(cwd: string): { zhGuides: number; zhStaged: number } {
  const zg = path.join(cwd, "content", "zh-guides");
  const zs = path.join(cwd, "content", "zh-staged-guides");
  const countMd = (dir: string) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).length;
  };
  return { zhGuides: countMd(zg), zhStaged: countMd(zs) };
}

/**
 * 从磁盘构建中文资产索引（仅 content/zh-guides、content/zh-staged-guides）。
 * 不包含 rejected/archive/JSON 等路径。
 */
export function scanZhContentAssetIndexFromDisk(cwd: string): ContentAssetIndexEntry[] {
  const scanDir = (dir: string, status: "published" | "staged"): ContentAssetIndexEntry[] => {
    if (!fs.existsSync(dir)) return [];
    const names = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    const out: ContentAssetIndexEntry[] = [];
    for (const filename of names) {
      const full = path.join(dir, filename);
      let st: fs.Stats;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      let raw: string;
      try {
        raw = fs.readFileSync(full, "utf8");
      } catch {
        continue;
      }
      const { data, content } = matter(raw);
      const d = data as Record<string, unknown>;
      const body = content.trim();
      const m = mapZhGuideDataToRecordFields(d);
      const title = m.title;
      const slug = m.slug;
      const publishedAt = m.publishedAt;
      const platform = m.platform ?? "";
      const clusterTheme = typeof d.clusterTheme === "string" ? d.clusterTheme : "";
      const contentType = typeof d.contentType === "string" ? d.contentType : "";
      const aiSummary = m.aiSummary ?? "";
      const nt = title.replace(/\s+/g, "").toLowerCase();
      const tokenSet = titleTokenSetZh(title);
      out.push({
        filename,
        title,
        slug,
        language: "zh",
        platform: platform || "unknown",
        clusterTheme: clusterTheme || "",
        contentType: contentType || "unknown",
        publishedAt,
        status,
        normalizedTitle: nt,
        titleTokenSet: tokenSet,
        contentFingerprint: zhFingerprint(body, aiSummary)
      });
    }
    return out;
  };
  const pub = scanDir(path.join(cwd, "content", "zh-guides"), "published");
  const staged = scanDir(path.join(cwd, "content", "zh-staged-guides"), "staged");
  return [...pub, ...staged];
}

export function loadContentAssetIndexFile(absPath: string): ContentAssetIndexFile | null {
  try {
    if (!fs.existsSync(absPath)) return null;
    const raw = fs.readFileSync(absPath, "utf8");
    const j = JSON.parse(raw) as ContentAssetIndexFile;
    if (!j || !Array.isArray(j.entries)) return null;
    return j;
  } catch {
    return null;
  }
}

export function loadContentAssetIndexEntries(cwd: string, language: "en" | "zh"): ContentAssetIndexEntry[] {
  if (language === "zh") return scanZhContentAssetIndexFromDisk(cwd);
  const name = "content-asset-index-en.json";
  const p = path.join(cwd, "generated", name);
  const doc = loadContentAssetIndexFile(p);
  return doc?.entries ?? [];
}
