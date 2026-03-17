/**
 * v60.1 EN Authority Recovery - Core pages for weight consolidation
 * 100-300 URLs that receive site-wide internal links
 * Source: data/core-pages-en.json (this module re-exports for type safety)
 */

export const POPULAR_GUIDES = [
  "/how-to/grow-on-tiktok",
  "/how-to/go-viral-on-instagram",
  "/how-to/get-youtube-subscribers",
  "/how-to/write-viral-captions",
  "/how-to/create-viral-hooks",
  "/how-to/get-instagram-followers",
  "/how-to/increase-engagement",
  "/content-strategy/content-creator",
  "/viral-examples/motivation",
  "/tools/tiktok-caption-generator"
] as const;

export const BEST_GUIDES_BY_PLATFORM: Record<string, readonly string[]> = {
  tiktok: [
    "/how-to/grow-on-tiktok",
    "/how-to/write-viral-captions",
    "/how-to/monetize-tiktok",
    "/how-to/create-viral-hooks",
    "/content-strategy/content-creator",
    "/viral-examples/business",
    "/tools/tiktok-caption-generator",
    "/answers/how-to-write-tiktok-captions"
  ],
  youtube: [
    "/how-to/get-youtube-subscribers",
    "/how-to/grow-on-youtube-shorts",
    "/how-to/create-viral-hooks",
    "/how-to/write-viral-captions",
    "/content-strategy/content-creator",
    "/viral-examples/education",
    "/tools/hook-generator",
    "/answers/how-to-write-youtube-hooks"
  ],
  instagram: [
    "/how-to/go-viral-on-instagram",
    "/how-to/get-instagram-followers",
    "/how-to/write-viral-captions",
    "/how-to/create-viral-hooks",
    "/content-strategy/influencer",
    "/viral-examples/beauty",
    "/tools/instagram-caption-generator",
    "/answers/how-to-write-instagram-captions"
  ]
};

export const HUB_LINKS: Record<string, string> = {
  "how-to": "/how-to",
  "content-strategy": "/content-strategy",
  "viral-examples": "/viral-examples"
};

export const ALL_CORE_URLS = [
  "/",
  "/creator",
  "/tools",
  "/tools/tiktok-caption-generator",
  "/tools/hook-generator",
  "/tools/instagram-caption-generator",
  "/tools/hashtag-generator",
  "/how-to/grow-on-tiktok",
  "/how-to/go-viral-on-instagram",
  "/how-to/get-youtube-subscribers",
  "/how-to/write-viral-captions",
  "/how-to/get-instagram-followers",
  "/how-to/create-viral-hooks",
  "/how-to/grow-on-youtube-shorts",
  "/how-to/build-creator-brand",
  "/how-to/monetize-tiktok",
  "/how-to/increase-engagement",
  "/content-strategy/startup",
  "/content-strategy/fitness",
  "/content-strategy/personal-brand",
  "/content-strategy/online-business",
  "/content-strategy/ecommerce",
  "/content-strategy/coaching",
  "/content-strategy/content-creator",
  "/content-strategy/influencer",
  "/viral-examples/fitness",
  "/viral-examples/motivation",
  "/viral-examples/business",
  "/viral-examples/travel",
  "/viral-examples/food",
  "/viral-examples/beauty",
  "/viral-examples/lifestyle",
  "/viral-examples/tech",
  "/viral-examples/education",
  "/viral-examples/gaming",
  "/answers/how-to-write-tiktok-captions",
  "/answers/how-to-write-youtube-hooks",
  "/answers/how-to-write-instagram-captions",
  "/answers/how-to-write-viral-hooks",
  "/blog",
  "/examples",
  "/trending",
  "/answers",
  "/tiktok",
  "/youtube",
  "/instagram"
];

const HUB_LABELS: Record<string, string> = {
  "how-to": "How-to Guides",
  "content-strategy": "Content Strategy",
  "viral-examples": "Viral Examples"
};

export function getBestGuidesForPlatform(platform: string, limit = 8): { href: string; label: string }[] {
  const urls = (BEST_GUIDES_BY_PLATFORM[platform] ?? [...POPULAR_GUIDES]) as string[];
  return urls.slice(0, limit).map((href) => ({
    href,
    label: formatCorePageLabel(href)
  }));
}

export function getPopularGuides(limit = 10): { href: string; label: string }[] {
  return ([...POPULAR_GUIDES] as string[]).slice(0, limit).map((href) => ({
    href,
    label: formatCorePageLabel(href)
  }));
}

export function getHubLinks(): { href: string; label: string }[] {
  return Object.entries(HUB_LINKS).map(([key, href]) => ({
    href,
    label: HUB_LABELS[key] ?? key
  }));
}

function formatCorePageLabel(href: string): string {
  if (href === "/") return "Home";
  if (href.startsWith("/tools/")) {
    const slug = href.replace("/tools/", "");
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  if (href.startsWith("/how-to/")) {
    const slug = href.replace("/how-to/", "");
    return "How to " + slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (href.startsWith("/content-strategy/")) {
    const slug = href.replace("/content-strategy/", "");
    return "Content Strategy: " + slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (href.startsWith("/viral-examples/")) {
    const slug = href.replace("/viral-examples/", "");
    return "Viral " + slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Examples";
  }
  if (href.startsWith("/answers/")) {
    const slug = href.replace("/answers/", "");
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const parts = href.split("/").filter(Boolean);
  return parts
    .map((p) => p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" - ");
}
