/**
 * Cover image URL hygiene for seo_articles (admin write path + public read path).
 * Future: locale-specific or structured media can wrap these fields (e.g. JSON column).
 */

const MAX_URL_LEN = 2048;

/** Normalize admin-submitted cover URL; returns null to clear the field. */
export function normalizeCoverImageUrlForStorage(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  if (t.length > MAX_URL_LEN) return null;
  if (/[\s<>]/.test(t)) return null;
  if (/^javascript:/i.test(t) || /^vbscript:/i.test(t)) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  return null;
}

/** Whether a stored value is safe to render as an image src on the public site. */
export function isSafePublicImageUrl(url: string | undefined | null): boolean {
  if (url == null || typeof url !== "string") return false;
  const t = url.trim();
  if (!t) return false;
  return normalizeCoverImageUrlForStorage(t) === t;
}

export function normalizeCoverImageAltForStorage(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  return t.length > 500 ? t.slice(0, 500) : t;
}

/**
 * 未跑 cover 迁移时，写入 cover_* 会失败。Postgres 报「column … does not exist」，
 * PostgREST 还可能报「… schema cache」（PGRST204 等），需一并识别后重试不含封面列。
 */
export function isMissingCoverColumnSupabaseError(err: { message?: string } | null | undefined): boolean {
  const m = (err?.message ?? "").toLowerCase();
  if (!m.includes("cover_image")) return false;
  return (
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("could not find") ||
    m.includes("pgrst")
  );
}
