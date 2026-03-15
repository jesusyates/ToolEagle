/**
 * Library pages: /library/[slug]
 * Each lists 100+ examples
 */

export type LibraryPageConfig = {
  slug: string;
  title: string;
  intro: string;
  toolSlugs: string[];
  toolSlug: string;
  toolName: string;
};

export const LIBRARY_PAGES: LibraryPageConfig[] = [
  {
    slug: "tiktok-captions",
    title: "TikTok Caption Library",
    intro: "100+ TikTok caption examples. Copy, customize, or use our AI to generate more.",
    toolSlugs: ["tiktok-caption-generator"],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator"
  },
  {
    slug: "youtube-hooks",
    title: "YouTube Hook Library",
    intro: "100+ YouTube hook examples for Shorts and long-form. Stop the scroll and keep viewers watching.",
    toolSlugs: ["hook-generator", "youtube-hook-generator"],
    toolSlug: "hook-generator",
    toolName: "Hook Generator"
  },
  {
    slug: "instagram-captions",
    title: "Instagram Caption Library",
    intro: "100+ Instagram caption examples for Reels and feed posts. Drive saves, comments, and shares.",
    toolSlugs: ["instagram-caption-generator", "instagram-reels-caption-generator"],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator"
  }
];

export function getLibraryPage(slug: string): LibraryPageConfig | undefined {
  return LIBRARY_PAGES.find((p) => p.slug === slug);
}

export function getAllLibrarySlugs(): string[] {
  return LIBRARY_PAGES.map((p) => p.slug);
}
