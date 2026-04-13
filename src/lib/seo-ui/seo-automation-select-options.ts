/** Shared predefined options for SEO automation / preflight admin forms (UI only). */

export const SEO_AUTOMATION_MARKET_OPTIONS = [
  { value: "US", label: "US" },
  { value: "CN", label: "CN" },
  { value: "JP", label: "JP" },
  { value: "ES", label: "ES" },
  { value: "FR", label: "FR" },
  { value: "global", label: "global" }
] as const;

export const SEO_AUTOMATION_LOCALE_OPTIONS = [
  { value: "en-US", label: "en-US" },
  { value: "en-GB", label: "en-GB" },
  { value: "zh-CN", label: "zh-CN" },
  { value: "ja-JP", label: "ja-JP" },
  { value: "es-ES", label: "es-ES" },
  { value: "fr-FR", label: "fr-FR" }
] as const;

export const SEO_AUTOMATION_LANGUAGE_OPTIONS = [
  { value: "en", label: "English (en)" },
  { value: "zh", label: "中文 (zh)" },
  { value: "ja", label: "日本語 (ja)" },
  { value: "es", label: "Español (es)" },
  { value: "fr", label: "Français (fr)" }
] as const;

export type SeoAutomationMarket = (typeof SEO_AUTOMATION_MARKET_OPTIONS)[number]["value"];
export type SeoAutomationLocale = (typeof SEO_AUTOMATION_LOCALE_OPTIONS)[number]["value"];
export type SeoAutomationLanguage = (typeof SEO_AUTOMATION_LANGUAGE_OPTIONS)[number]["value"];

/** Default locale suggested when the user picks a content language (user may change locale after). */
export function suggestLocaleForContentLanguage(contentLanguage: string): SeoAutomationLocale {
  const map: Record<string, SeoAutomationLocale> = {
    en: "en-US",
    zh: "zh-CN",
    ja: "ja-JP",
    es: "es-ES",
    fr: "fr-FR"
  };
  return map[contentLanguage] ?? "en-US";
}
