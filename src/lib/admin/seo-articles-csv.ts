/** Server-safe CSV helpers for seo_articles admin export (no fs). */

export const SEO_ARTICLE_CSV_COLUMNS = [
  "id",
  "title",
  "slug",
  "description",
  "content",
  "cover_image",
  "cover_image_alt",
  "status",
  "deleted",
  "created_at",
  "updated_at"
] as const;

export type SeoArticleCsvColumn = (typeof SEO_ARTICLE_CSV_COLUMNS)[number];

export function csvEscape(s: string): string {
  const t = s.replace(/\r\n/g, "\n");
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export function csvCellValue(row: Record<string, unknown>, key: SeoArticleCsvColumn): string {
  const v = row[key];
  if (key === "deleted") {
    return v === true ? "true" : "false";
  }
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return String(v);
}

/** One header row + one data row, UTF-8 BOM, CRLF — suitable as a standalone per-article file. */
export function buildSingleArticleCsv(row: Record<string, unknown>): string {
  const header = SEO_ARTICLE_CSV_COLUMNS.join(",");
  const line = SEO_ARTICLE_CSV_COLUMNS.map((k) => csvEscape(csvCellValue(row, k))).join(",");
  return "\uFEFF" + [header, line].join("\r\n");
}

export function sanitizeSlugForFilename(slug: string, id: string): string {
  let s = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!s) {
    const compact = id.replace(/-/g, "").slice(0, 12);
    s = compact ? `article-${compact}` : "article";
  }
  return s.slice(0, 80) || "article";
}

/** RFC 5987 + ASCII fallback for Content-Disposition attachment filenames. */
export function contentDispositionAttachment(filenameUtf8: string): string {
  const trimmed = filenameUtf8.trim() || "download";
  const ascii = trimmed.replace(/[^\x20-\x7E]/g, "_").slice(0, 180) || "download";
  const star = encodeURIComponent(trimmed);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${star}`;
}
