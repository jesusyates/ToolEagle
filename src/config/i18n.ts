/**
 * Supported locales: en (default for SEO), zh (AI-generated Chinese content).
 */
export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文"
};

/** Map Accept-Language codes to our locales */
const LANG_TO_LOCALE: Record<string, Locale> = {
  en: "en",
  zh: "zh",
  "zh-cn": "zh",
  "zh-tw": "zh"
};

export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const parts = acceptLanguage.split(",").map((s) => s.trim().split(";")[0].toLowerCase());
  for (const part of parts) {
    const locale = LANG_TO_LOCALE[part] ?? LANG_TO_LOCALE[part.split("-")[0]];
    if (locale) return locale;
  }
  return defaultLocale;
}
