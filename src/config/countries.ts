/**
 * V76.5: Country layer foundation for future multi-country expansion.
 * No UI changes. Routes remain /, /zh/*, /tools/*, /zh/tools/*.
 */

export const SUPPORTED_COUNTRIES = ["US", "CN"] as const;
export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export const FUTURE_COUNTRIES = ["JP", "IN", "BR", "ES", "PT", "ID"] as const;
export type FutureCountry = (typeof FUTURE_COUNTRIES)[number];

export type CountryCode = SupportedCountry | FutureCountry | string;

export interface CountryConfig {
  defaultLocale: string;
  currency: string;
  pricingTier: "high" | "medium" | "low";
  affiliateStrategy: "global" | "local" | "regional";
}

export const countryConfig: Record<string, CountryConfig> = {
  US: {
    defaultLocale: "en",
    currency: "USD",
    pricingTier: "high",
    affiliateStrategy: "global"
  },
  CN: {
    defaultLocale: "zh",
    currency: "CNY",
    pricingTier: "low",
    affiliateStrategy: "local"
  },
  // Future countries - placeholder configs
  JP: {
    defaultLocale: "ja",
    currency: "JPY",
    pricingTier: "high",
    affiliateStrategy: "local"
  },
  IN: {
    defaultLocale: "en",
    currency: "INR",
    pricingTier: "low",
    affiliateStrategy: "regional"
  },
  BR: {
    defaultLocale: "pt",
    currency: "BRL",
    pricingTier: "medium",
    affiliateStrategy: "regional"
  },
  ES: {
    defaultLocale: "es",
    currency: "EUR",
    pricingTier: "medium",
    affiliateStrategy: "regional"
  },
  PT: {
    defaultLocale: "pt",
    currency: "EUR",
    pricingTier: "medium",
    affiliateStrategy: "regional"
  },
  ID: {
    defaultLocale: "id",
    currency: "IDR",
    pricingTier: "low",
    affiliateStrategy: "regional"
  }
};

export const defaultCountry: SupportedCountry = "US";
