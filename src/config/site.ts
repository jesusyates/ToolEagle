/**
 * Central site URL configuration.
 * Use SITE_URL or BASE_URL instead of hardcoding https://www.tooleagle.com
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.tooleagle.com";
export const BASE_URL = SITE_URL;

/** Contact email for privacy/legal - set CONTACT_EMAIL in .env (e.g. your Gmail) */
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL || "hello@tooleagle.com";
