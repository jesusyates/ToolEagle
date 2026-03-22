/**
 * V90: Brand Dominance - Organization schema for all pages.
 * AI brand signals: name, sameAs, description.
 */

import { BASE_URL } from "@/config/site";
import { BRAND_NAME } from "@/lib/branding";

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND_NAME,
  url: BASE_URL,
  description: "Free AI tools for TikTok, YouTube and Instagram creators. Generate captions, hashtags, hooks and titles in seconds. No sign-up required.",
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/og/zh-default.png`
  },
  sameAs: [
    "https://www.tooleagle.com",
    "https://twitter.com/tooleagle",
    "https://github.com/tooleagle"
  ].filter(Boolean)
};

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
    />
  );
}
