/**
 * V88: Multi-language expansion framework
 * es, pt, id - reuse same templates with locale injection
 */

export const SUPPORTED_LOCALES = ["en", "zh", "es", "pt", "id"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  pt: "Português",
  id: "Bahasa Indonesia"
};

export const LOCALE_PATHS: Record<SupportedLocale, string> = {
  en: "/en",
  zh: "/zh",
  es: "/es",
  pt: "/pt",
  id: "/id"
};

/** Path structure: /{locale}/how-to/{topic} for es, pt, id */
export function getLocaleHowToPath(locale: SupportedLocale, topic: string): string {
  if (locale === "zh") return `/zh/how-to/${topic}`;
  return `${LOCALE_PATHS[locale]}/how-to/${topic}`;
}

export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
