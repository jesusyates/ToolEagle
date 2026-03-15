/**
 * SEO Engine v2 - Content Types
 */
export const contentTypes = ["captions", "hashtags", "titles", "hooks", "bio"] as const;
export type ContentType = (typeof contentTypes)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  captions: "Captions",
  hashtags: "Hashtags",
  titles: "Titles",
  hooks: "Hooks",
  bio: "Bio"
};

/** Tool slug per (platform, type) for CTA */
export const TOOL_MAP: Record<string, string> = {
  "tiktok_captions": "tiktok-caption-generator",
  "tiktok_hashtags": "hashtag-generator",
  "tiktok_titles": "title-generator",
  "tiktok_hooks": "hook-generator",
  "tiktok_bio": "tiktok-bio-generator",
  "youtube_captions": "tiktok-caption-generator",
  "youtube_hashtags": "hashtag-generator",
  "youtube_titles": "youtube-title-generator",
  "youtube_hooks": "hook-generator",
  "youtube_bio": "tiktok-bio-generator",
  "instagram_captions": "instagram-caption-generator",
  "instagram_hashtags": "hashtag-generator",
  "instagram_titles": "title-generator",
  "instagram_hooks": "hook-generator",
  "instagram_bio": "instagram-bio-generator"
};
