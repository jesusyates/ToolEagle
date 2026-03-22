/**
 * Output language hints — applied on top of global strategist (not a full translation layer).
 */

const LOCALE_PREFIX: Record<string, string> = {
  zh: "Output all string values in Simplified Chinese. ",
  es: "Output all string values in Spanish. ",
  pt: "Output all string values in Portuguese. ",
  id: "Output all string values in Indonesian. "
};

export function localeSystemPrefix(locale: string): string {
  return LOCALE_PREFIX[locale] ?? "";
}
