import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale, matchLocale, type Locale } from "@/config/i18n";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  // 1. User preference (cookie) - explicit choice
  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    const locale = cookieLocale as Locale;
    return {
      locale,
      messages: (await import(`../../messages/${locale}.json`)).default
    };
  }

  // 2. Browser preference (Accept-Language)
  const acceptLanguage = headersList.get("accept-language");
  const locale = matchLocale(acceptLanguage);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
