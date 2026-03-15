/**
 * SEO Engine v2 - Platforms
 * 3 platforms × 5 types × 200 topics = 3000 pages
 */
export const platforms = ["tiktok", "youtube", "instagram"] as const;
export type Platform = (typeof platforms)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};
