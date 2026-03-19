/**
 * V75: Language configuration for i18n architecture.
 * Adding a new language = config + messages, NOT new components.
 */
export const SUPPORTED_LANGUAGES = ["en", "zh"] as const;
export type SupportedLocale = (typeof SUPPORTED_LANGUAGES)[number];

export const FUTURE_LANGUAGES = ["es", "pt", "id"] as const;
export type FutureLocale = (typeof FUTURE_LANGUAGES)[number];

export const defaultLocale: SupportedLocale = "en";
