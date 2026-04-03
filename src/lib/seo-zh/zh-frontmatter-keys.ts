/**
 * 中文指南 Markdown frontmatter：仅允许中文键名（硬规则）。
 * 运行时内部仍映射为 ZhGuideRecord 英文字段，便于与现有 TS 类型共用。
 */

import type { FaqItem } from "@/lib/seo/rebuild-article";

/** 中文 frontmatter 键（文件层） */
export const ZH_KEY = {
  title: "标题",
  description: "描述",
  slug: "别名",
  publishedAt: "发布时间",
  platform: "平台",
  aiSummary: "一句话总结",
  hashtags: "标签",
  faqs: "常见问题",
  question: "问题",
  answer: "回答",
  updatedAt: "更新时间"
} as const;

/** 禁止出现在中文 md frontmatter 中的英文键（含 FAQ 子键） */
export const FORBIDDEN_EN_FM_KEYS = new Set([
  "title",
  "description",
  "slug",
  "publishedAt",
  "platform",
  "aiSummary",
  "hashtags",
  "faqs",
  "question",
  "answer",
  "updatedAt"
]);

export function collectForbiddenEnglishKeysInData(obj: unknown): string[] {
  const found: string[] = [];
  const walk = (o: unknown) => {
    if (o == null) return;
    if (Array.isArray(o)) {
      for (const x of o) walk(x);
      return;
    }
    if (typeof o === "object") {
      for (const k of Object.keys(o as object)) {
        if (FORBIDDEN_EN_FM_KEYS.has(k)) found.push(k);
        walk((o as Record<string, unknown>)[k]);
      }
    }
  };
  walk(obj);
  return [...new Set(found)];
}

function pickStr(d: Record<string, unknown>, zh: string, en: string): string {
  const vz = d[zh];
  if (typeof vz === "string") return vz;
  const ve = d[en];
  if (typeof ve === "string") return ve;
  return "";
}

function normalizeHashtags(data: Record<string, unknown>): string[] {
  const raw = data[ZH_KEY.hashtags] ?? data.hashtags;
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (typeof raw === "string") return raw.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
  return [];
}

export function parseZhFaqsFromData(data: Record<string, unknown>): FaqItem[] | undefined {
  const raw = data[ZH_KEY.faqs] ?? data.faqs;
  if (!Array.isArray(raw)) return undefined;
  const out: FaqItem[] = [];
  for (const x of raw) {
    if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      const q = String(o[ZH_KEY.question] ?? o.question ?? "").trim();
      const a = String(o[ZH_KEY.answer] ?? o.answer ?? "").trim();
      if (q && a) out.push({ question: q, answer: a });
    }
  }
  return out.length ? out : undefined;
}

/** 从 matter.data 映射为内部记录字段（仅读中文键；兼容迁移期英文键）。 */
export function mapZhGuideDataToRecordFields(data: Record<string, unknown>): {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  platform?: string;
  hashtags: string[];
  aiSummary?: string;
  faqs?: FaqItem[];
  updatedAt?: string;
} {
  return {
    title: pickStr(data, ZH_KEY.title, "title"),
    description: pickStr(data, ZH_KEY.description, "description"),
    slug: pickStr(data, ZH_KEY.slug, "slug"),
    publishedAt: pickStr(data, ZH_KEY.publishedAt, "publishedAt"),
    platform: (() => {
      const v = data[ZH_KEY.platform] ?? data.platform;
      return typeof v === "string" ? v : undefined;
    })(),
    hashtags: normalizeHashtags(data),
    aiSummary: (() => {
      const v = data[ZH_KEY.aiSummary] ?? data.aiSummary;
      return typeof v === "string" ? v : undefined;
    })(),
    faqs: parseZhFaqsFromData(data),
    updatedAt: (() => {
      const v = data[ZH_KEY.updatedAt] ?? data.updatedAt;
      return typeof v === "string" ? v : undefined;
    })()
  };
}

export type ZhGuideWritePayload = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  platform: string;
  aiSummary: string;
  hashtags: string[];
  faqs: { question: string; answer: string }[];
  body: string;
  updatedAt?: string;
};

/** 写盘：仅中文键名。 */
export function serializeZhGuideMarkdown(p: ZhGuideWritePayload): string {
  const K = ZH_KEY;
  const faqsYaml =
    `${K.faqs}:\n` +
    p.faqs
      .map(
        (f) =>
          `  - ${K.question}: ${JSON.stringify(f.question)}\n    ${K.answer}: ${JSON.stringify(f.answer)}`
      )
      .join("\n");
  const tags =
    p.hashtags.length > 0
      ? `${K.hashtags}:\n` + p.hashtags.map((h) => `  - ${JSON.stringify(h)}`).join("\n")
      : `${K.hashtags}: []`;
  const lines: string[] = [
    "---",
    `${K.title}: ${JSON.stringify(p.title)}`,
    `${K.description}: ${JSON.stringify(p.description)}`,
    `${K.slug}: ${JSON.stringify(p.slug)}`,
    `${K.publishedAt}: ${JSON.stringify(p.publishedAt)}`,
    `${K.platform}: ${JSON.stringify(p.platform)}`,
    `${K.aiSummary}: ${JSON.stringify(p.aiSummary)}`,
    tags,
    faqsYaml
  ];
  if (p.updatedAt) {
    lines.push(`${K.updatedAt}: ${JSON.stringify(p.updatedAt)}`);
  }
  lines.push("---", "", p.body.trim() + "\n");
  return lines.join("\n");
}
