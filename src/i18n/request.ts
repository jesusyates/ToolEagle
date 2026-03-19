import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

/**
 * V75: Locale from pathname. /zh/* => zh, otherwise en.
 * Loads messages/{locale}.json.
 */
export default getRequestConfig(async () => {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const locale = pathname.startsWith("/zh") ? "zh" : "en";

  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
