import { getRequestConfig } from "next-intl/server";

/**
 * English-only. No locale detection - default is always English.
 * /zh/* pages are standalone Chinese SEO content (body only); header/nav stay English.
 */
export default getRequestConfig(async () => {
  return {
    locale: "en",
    messages: (await import("../../messages/en.json")).default
  };
});
