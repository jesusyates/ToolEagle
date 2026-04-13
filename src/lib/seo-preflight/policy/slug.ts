/**
 * Central slug generation for SEO preflight (reusable; language-aware ASCII path segment).
 * contentLanguage drives unicode handling: CJK/JA kept as unicode slug segments where needed;
 * Latin languages normalized to kebab ASCII.
 */

export function slugifyForSeo(title: string, contentLanguage: string): string {
  const lang = (contentLanguage || "en").toLowerCase();
  const raw = title.trim().toLowerCase();
  if (!raw) return "untitled";

  const isCjkHeavy = /[\u4e00-\u9fff\u3040-\u30ff]/.test(title);
  if (isCjkHeavy || lang.startsWith("zh") || lang.startsWith("ja")) {
    return raw
      .replace(/\s+/g, "-")
      .replace(/[^\w\u4e00-\u9fff\u3040-\u30ff\-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 96) || "topic";
  }

  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96) || "topic";
}
