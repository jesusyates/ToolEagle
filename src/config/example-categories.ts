/**
 * Example category pages: /examples/tiktok-captions, etc.
 */

export type ExampleCategory = {
  slug: string;
  title: string;
  intro: string;
  toolSlugs: string[];
  toolName: string;
  toolSlug: string; // primary CTA tool
};

export const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  {
    slug: "tiktok-captions",
    title: "TikTok Caption Examples",
    intro:
      "Real TikTok caption examples from creators. Get inspiration for your next video—these styles drive engagement and stop the scroll.",
    toolSlugs: ["tiktok-caption-generator"],
    toolName: "TikTok Caption Generator",
    toolSlug: "tiktok-caption-generator"
  },
  {
    slug: "youtube-hooks",
    title: "YouTube Hook Examples",
    intro:
      "YouTube hook examples that keep viewers watching. From Shorts to long-form, these openers create curiosity in the first few seconds.",
    toolSlugs: ["hook-generator", "youtube-hook-generator"],
    toolName: "Hook Generator",
    toolSlug: "hook-generator"
  },
  {
    slug: "instagram-captions",
    title: "Instagram Caption Examples",
    intro:
      "Instagram caption examples for Reels and feed posts. Get inspiration for captions that drive saves, comments, and shares.",
    toolSlugs: ["instagram-caption-generator", "instagram-reels-caption-generator"],
    toolName: "Instagram Caption Generator",
    toolSlug: "instagram-caption-generator"
  }
];

export function getExampleCategory(slug: string): ExampleCategory | undefined {
  return EXAMPLE_CATEGORIES.find((c) => c.slug === slug);
}

export function getAllExampleCategorySlugs(): string[] {
  return EXAMPLE_CATEGORIES.map((c) => c.slug);
}
