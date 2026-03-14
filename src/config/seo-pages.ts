/**
 * Programmatic SEO pages dataset.
 * Used by /[category]/[topic] for SSG.
 */
export type SeoPageEntry = {
  category: "tiktok" | "youtube" | "instagram";
  topic: string;
  tool: string;
};

export const seoPageEntries: SeoPageEntry[] = [
  // TikTok captions
  { category: "tiktok", topic: "captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "funny-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "short-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "motivational-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "caption-ideas", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "captions-for-views", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "trending-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "best-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "pov-captions", tool: "tiktok-caption-generator" },
  // TikTok hooks
  { category: "tiktok", topic: "hooks", tool: "hook-generator" },
  { category: "tiktok", topic: "viral-hooks", tool: "hook-generator" },
  { category: "tiktok", topic: "hook-examples", tool: "hook-generator" },
  { category: "tiktok", topic: "best-hooks", tool: "hook-generator" },
  { category: "tiktok", topic: "story-hooks", tool: "story-hook-generator" },
  // TikTok bios
  { category: "tiktok", topic: "bio-ideas", tool: "tiktok-bio-generator" },
  { category: "tiktok", topic: "best-bios", tool: "tiktok-bio-generator" },
  { category: "tiktok", topic: "bio-examples", tool: "tiktok-bio-generator" },
  // TikTok content ideas
  { category: "tiktok", topic: "content-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "video-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "ideas-for-beginners", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "viral-ideas", tool: "tiktok-idea-generator" },
  // TikTok hashtags
  { category: "tiktok", topic: "hashtags", tool: "hashtag-generator" },
  { category: "tiktok", topic: "hashtag-ideas", tool: "tiktok-hashtag-generator" },
  { category: "tiktok", topic: "trending-hashtags", tool: "tiktok-hashtag-generator" },
  // TikTok usernames
  { category: "tiktok", topic: "username-ideas", tool: "tiktok-username-generator" },
  { category: "tiktok", topic: "usernames", tool: "tiktok-username-generator" },
  // TikTok scripts
  { category: "tiktok", topic: "scripts", tool: "tiktok-script-generator" },
  { category: "tiktok", topic: "script-templates", tool: "tiktok-script-generator" },
  // YouTube titles
  { category: "youtube", topic: "titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "title-examples", tool: "youtube-title-generator" },
  { category: "youtube", topic: "titles-for-views", tool: "youtube-title-generator" },
  { category: "youtube", topic: "clickbait-titles", tool: "clickbait-title-generator" },
  { category: "youtube", topic: "title-formulas", tool: "youtube-title-generator" },
  { category: "youtube", topic: "best-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "shorts-titles", tool: "shorts-title-generator" },
  // YouTube hooks
  { category: "youtube", topic: "hooks", tool: "viral-hook-generator" },
  { category: "youtube", topic: "intro-hooks", tool: "viral-hook-generator" },
  { category: "youtube", topic: "hook-examples", tool: "viral-hook-generator" },
  // YouTube scripts
  { category: "youtube", topic: "script-template", tool: "youtube-script-generator" },
  { category: "youtube", topic: "script-structure", tool: "youtube-script-generator" },
  { category: "youtube", topic: "script-for-beginners", tool: "youtube-script-generator" },
  // YouTube video ideas
  { category: "youtube", topic: "video-ideas", tool: "youtube-video-idea-generator" },
  { category: "youtube", topic: "ideas-that-work", tool: "youtube-video-idea-generator" },
  // YouTube descriptions & tags
  { category: "youtube", topic: "descriptions", tool: "youtube-description-generator" },
  { category: "youtube", topic: "tags", tool: "youtube-tag-generator" },
  { category: "youtube", topic: "seo-tags", tool: "youtube-tag-generator" },
  // Instagram captions
  { category: "instagram", topic: "captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "caption-ideas", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "captions-for-reels", tool: "reel-caption-generator" },
  { category: "instagram", topic: "captions-for-selfies", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "captions-for-business", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "reel-captions", tool: "reel-caption-generator" },
  { category: "instagram", topic: "best-captions", tool: "instagram-caption-generator" },
  // Instagram hashtags
  { category: "instagram", topic: "hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "hashtag-ideas", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "hashtags-for-reels", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "reel-hashtag-strategy", tool: "instagram-hashtag-generator" },
  // Instagram usernames
  { category: "instagram", topic: "username-ideas", tool: "instagram-username-generator" },
  // Generic / cross-platform
  { category: "tiktok", topic: "titles", tool: "title-generator" },
  { category: "youtube", topic: "captions", tool: "social-media-post-generator" },
  { category: "instagram", topic: "post-ideas", tool: "social-media-post-generator" },
  // TikTok long-tail captions
  { category: "tiktok", topic: "cute-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "aesthetic-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "sad-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "attitude-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "viral-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "dance-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "travel-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "fitness-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "food-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "fashion-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "beauty-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "couple-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "friendship-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "birthday-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "sassy-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "romantic-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "workout-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "morning-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "night-out-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "outfit-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "transformation-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "grwm-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "day-in-my-life-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "storytime-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "duet-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "stitch-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "trending-sound-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "challenge-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "before-after-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "get-ready-with-me-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "vlog-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "comedy-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "relatable-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "sarcastic-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "confidence-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "self-love-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "lifestyle-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "pet-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "music-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "gaming-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "tech-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "cooking-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "skincare-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "makeup-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "hair-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "ootd-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "unboxing-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "review-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "tutorial-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "tips-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "hacks-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "life-hack-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "productivity-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "study-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "work-from-home-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "small-business-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "entrepreneur-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "mom-life-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "dad-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "family-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "wedding-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "vacation-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "adventure-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "nature-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "sunset-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "coffee-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "aesthetic-video-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "soft-aesthetic-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "dark-aesthetic-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "y2k-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "cottagecore-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "minimalist-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "edgy-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "baddie-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "clean-girl-captions", tool: "tiktok-caption-generator" },
  { category: "tiktok", topic: "that-girl-captions", tool: "tiktok-caption-generator" },
  // YouTube long-tail titles
  { category: "youtube", topic: "gaming-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "tutorial-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "reaction-video-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "vlog-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "cooking-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "tech-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "fitness-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "makeup-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "gaming-video-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "lets-play-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "walkthrough-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "review-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "unboxing-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "challenge-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "prank-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "storytime-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "day-in-my-life-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "travel-vlog-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "how-to-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "diy-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "productivity-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "business-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "finance-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "motivational-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "comedy-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "music-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "cover-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "asmr-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "lifestyle-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "shorts-ideas", tool: "shorts-title-generator" },
  { category: "youtube", topic: "vertical-video-titles", tool: "shorts-title-generator" },
  { category: "youtube", topic: "quick-tip-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "explainer-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "comparison-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "vs-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "top-10-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "list-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "beginner-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "advanced-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "2025-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "trending-titles", tool: "youtube-title-generator" },
  { category: "youtube", topic: "viral-titles", tool: "clickbait-title-generator" },
  { category: "youtube", topic: "curiosity-titles", tool: "clickbait-title-generator" },
  { category: "youtube", topic: "mystery-titles", tool: "clickbait-title-generator" },
  { category: "youtube", topic: "controversial-titles", tool: "clickbait-title-generator" },
  { category: "youtube", topic: "secret-titles", tool: "clickbait-title-generator" },
  // Instagram long-tail captions
  { category: "instagram", topic: "aesthetic-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "brand-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "travel-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "fitness-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "food-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "fashion-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "beauty-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "lifestyle-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "wedding-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "birthday-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "vacation-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "nature-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "sunset-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "couple-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "friendship-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "family-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "pet-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "motivational-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "inspirational-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "quote-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "funny-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "short-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "minimalist-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "branded-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "product-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "promotion-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "launch-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "testimonial-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "behind-the-scenes-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "team-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "event-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "collab-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "giveaway-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "contest-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "sale-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "new-arrival-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "ootd-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "grwm-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "makeup-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "skincare-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "recipe-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "restaurant-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "coffee-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "workout-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "yoga-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "running-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "gym-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "transformation-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "before-after-captions", tool: "instagram-caption-generator" },
  { category: "instagram", topic: "aesthetic-reel-captions", tool: "reel-caption-generator" },
  { category: "instagram", topic: "trending-reel-captions", tool: "reel-caption-generator" },
  { category: "instagram", topic: "dance-reel-captions", tool: "reel-caption-generator" },
  { category: "instagram", topic: "tutorial-reel-captions", tool: "reel-caption-generator" },
  { category: "instagram", topic: "comedy-reel-captions", tool: "reel-caption-generator" },
  { category: "instagram", topic: "trending-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "niche-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "fitness-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "fashion-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "food-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "travel-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "beauty-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "business-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "small-business-hashtags", tool: "instagram-hashtag-generator" },
  { category: "instagram", topic: "brand-hashtags", tool: "instagram-hashtag-generator" },
  // More TikTok hooks & ideas
  { category: "tiktok", topic: "opening-hooks", tool: "hook-generator" },
  { category: "tiktok", topic: "first-line-hooks", tool: "hook-generator" },
  { category: "tiktok", topic: "curiosity-hooks", tool: "hook-generator" },
  { category: "tiktok", topic: "question-hooks", tool: "hook-generator" },
  { category: "tiktok", topic: "controversial-hooks", tool: "hook-generator" },
  { category: "tiktok", topic: "trending-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "niche-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "fitness-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "beauty-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "food-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "travel-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "gaming-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "education-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "dance-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "comedy-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "storytime-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "duet-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "stitch-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "challenge-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "trending-sounds-ideas", tool: "tiktok-idea-generator" },
  { category: "tiktok", topic: "best-hashtags", tool: "tiktok-hashtag-generator" },
  { category: "tiktok", topic: "viral-hashtags", tool: "tiktok-hashtag-generator" },
  { category: "tiktok", topic: "niche-hashtags", tool: "tiktok-hashtag-generator" },
  { category: "tiktok", topic: "fitness-hashtags", tool: "tiktok-hashtag-generator" },
  { category: "tiktok", topic: "beauty-hashtags", tool: "tiktok-hashtag-generator" },
  { category: "tiktok", topic: "dance-hashtags", tool: "tiktok-hashtag-generator" },
  { category: "tiktok", topic: "comedy-hashtags", tool: "tiktok-hashtag-generator" },
  { category: "tiktok", topic: "creative-usernames", tool: "tiktok-username-generator" },
  { category: "tiktok", topic: "aesthetic-usernames", tool: "tiktok-username-generator" },
  { category: "tiktok", topic: "funny-usernames", tool: "tiktok-username-generator" },
  { category: "tiktok", topic: "cute-usernames", tool: "tiktok-username-generator" }
];

const CATEGORY_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

const TOPIC_EXAMPLES: Record<string, string[]> = {
  "funny-captions": ["This hit different 😂", "No caption needed", "POV: you finally get it", "That's it. That's the post.", "Real talk 💀"],
  "short-captions": ["Save this 📌", "Vibes only ✨", "Period.", "Facts.", "No cap."],
  "motivational-captions": ["You got this 💪", "Trust the process", "Small steps, big wins", "Keep going.", "Your time is coming."],
  captions: ["You need to see this 👇", "Nobody is talking about this…", "POV: your algorithm gets you", "Save this for later 📌", "The one thing nobody tells you"],
  "caption-ideas": ["Stop scrolling for a sec 👇", "Wait for it…", "I tried this so you don't have to", "What happens when you [action]", "This changed everything"],
  "captions-for-views": ["You need to see this 👇", "Nobody is talking about this", "POV: [relatable moment]", "Save this for later", "Comment if you agree"],
  "trending-captions": ["This hit different", "No caption needed", "POV: [moment]", "Vibes only ✨", "That's it. That's the post."],
  "best-captions": ["You need to see this 👇", "Stop scrolling", "POV: [outcome]", "Save this 📌", "The truth about [topic]"],
  "pov-captions": ["POV: your algorithm finally gets you", "POV: you found this gem", "POV: [relatable moment]", "POV: when [situation]"],
  hooks: ["Stop scrolling if you [identity]", "You're doing [topic] wrong, here's why:", "No one is talking about [secret]", "If you [identity], watch this", "I tried [X] so you don't have to"],
  "viral-hooks": ["Stop scrolling if you want [outcome]", "POV: [curiosity]", "Nobody is talking about this…", "You're doing [topic] wrong", "I tried [X] so you don't have to"],
  "hook-examples": ["Stop scrolling if you post [niche] content", "You're doing [topic] wrong, here's why:", "No one is talking about [secret]", "If you [identity], watch this before [action]"],
  "best-hooks": ["Stop scrolling if you [identity]", "POV: [outcome] without [pain]", "Nobody is talking about [secret]", "You're doing [topic] wrong", "I tried [X] so you don't have to"],
  "story-hooks": ["Last week I [action]…", "I never thought I'd say this but…", "Here's what happened when I [action]", "So I tried [X] and…", "Let me tell you about the time…"],
  "bio-ideas": ["Creator | [niche] | [value prop]", "[Emoji] [identity] | [what you do]", "Here for the [vibe] | [link]", "[One-liner that hooks]", "Making [content type] that [outcome]"],
  "best-bios": ["Creator | [niche]", "[Emoji] [identity] | DM for collabs", "Making [X] that [outcome]", "Here for the [vibe]", "[One-liner]"],
  "bio-examples": ["[Niche] creator | [value]", "[Emoji] [identity] | [CTA]", "Making content that [outcome]", "Here for [vibe] | [link]"],
  "content-ideas": ["Day in my life as [identity]", "[Number] [topic] no one talks about", "I tried [trend] for a week", "POV: [scenario]", "[Topic] for beginners"],
  "ideas-for-beginners": ["[Topic] for complete beginners", "My first [X] – what I learned", "[Number] easy [topic] ideas", "How to start [niche] in 2025", "[Topic] 101"],
  "viral-ideas": ["[Trend] but make it [niche]", "POV: [relatable moment]", "I tried [viral trend] with [twist]", "[Number] [topic] that went viral", "What [celebrity] taught me about [topic]"],
  hashtags: ["#fyp #viral #creators #contentcreator", "#tiktok #reels #shorts #creator", "#niche #trending #foryou #explore"],
  "hashtag-ideas": ["#fyp #viral #creators #contentcreator", "#tiktok #reels #shorts #creator", "#niche #trending #foryou"],
  "trending-hashtags": ["#fyp #viral #trending #foryou", "#creators #contentcreator #explore", "#reels #shorts #tiktok"],
  "username-ideas": ["@[name]creates", "@[niche]with[name]", "@the[niche]guy", "@[name]official", "@[niche]daily"],
  usernames: ["@[name]creates", "@[niche]with[name]", "@the[niche]guy", "@[name]official"],
  scripts: ["Hook (1 line) → 3 beats → CTA", "Open with question → Answer in 3 parts → Close with CTA", "POV hook → Story beats → Lesson + CTA"],
  "script-templates": ["Hook → 3 beats → CTA", "Question → Answer → CTA", "POV → Story → Lesson"],
  titles: ["I Tried [X] So You Don't Have To", "The Truth About [Topic]", "[Number] [Topic] No One Talks About", "[Topic] in 10 Minutes: Full Guide", "Stop Doing [Wrong] (Do This Instead)"],
  "title-examples": ["I Tried [X] So You Don't Have To", "7 [Topic] No One Talks About", "The Truth About [Topic]", "[Topic] in 10 Minutes", "Stop Doing [Wrong] (Do This)"],
  "titles-for-views": ["I Tried [X] So You Don't Have To", "The Truth About [Topic]", "[Number] Mistakes Killing Your [Niche]", "[Topic] in 10 Minutes", "Stop Doing [Wrong]"],
  "clickbait-titles": ["You Won't Believe What Happened When…", "The [Number] [Topic] That Changed Everything", "What [Experts] Don't Want You to Know", "I Tried [X] and This Happened", "The Secret to [Outcome]"],
  "title-formulas": ["I Tried [X] So You Don't Have To", "[Number] [Topic] No One Talks About", "The Truth About [Topic]", "[Topic] in [Time]: Full Guide"],
  "best-titles": ["I Tried [X] So You Don't Have To", "The Truth About [Topic]", "[Number] [Topic] No One Talks About", "[Topic] in 10 Minutes", "Stop Doing [Wrong]"],
  "shorts-titles": ["[Hook in 5 words]", "POV: [moment]", "[Number] [topic] that work", "You need to see this", "Wait for it…"],
  "intro-hooks": ["Stop scrolling if you [identity]", "You're doing [topic] wrong", "Nobody is talking about [secret]", "If you [identity], watch this", "I tried [X] so you don't have to"],
  "script-template": ["Intro hook (10 sec) → Main points (3) → Outro + CTA", "Hook → Problem → Solution → CTA", "Question → Answer in parts → Summary"],
  "script-structure": ["Hook → 3 main points → Outro + CTA", "Problem → Solution → CTA", "Intro → Body (3 beats) → Outro"],
  "script-for-beginners": ["Simple hook → 3 easy points → CTA", "Question → Step-by-step answer → CTA", "Intro → Main idea → Outro"],
  "tiktok-video-ideas": ["Day in my life as [identity]", "[Number] [topic] no one talks about", "I tried [trend] for a week", "POV: [scenario]", "[Topic] for beginners"],
  "youtube-video-ideas": ["[Topic] for beginners", "[Number] [topic] that get views", "How I [achievement]", "I tried [X] for [timeframe]", "[Topic] in 2025"],
  "video-ideas": ["[Topic] for beginners", "[Number] [topic] that get views", "How I [achievement]", "I tried [X] for [timeframe]", "[Topic] in 2025"],
  "ideas-that-work": ["[Topic] that actually get views", "[Number] [topic] that work", "How to [outcome] in [timeframe]", "[Topic] strategies that work", "What [experts] do differently"],
  descriptions: ["[2-3 sentence intro with keywords]. In this video we cover [topics]. [CTA].", "[Hook]. This video covers [X]. [Keywords]. [CTA]."],
  tags: ["[topic], [niche], [platform], [format], [keyword], [related], [search term]"],
  "seo-tags": ["[primary keyword], [secondary], [niche], [platform], [format], [related terms]"],
  "tiktok-caption-ideas": ["You need to see this 👇", "Nobody is talking about this…", "Stop scrolling for a sec 👇", "Wait for it…", "I tried this so you don't have to"],
  "instagram-caption-ideas": ["Swipe for the full story 👉", "This changed everything ✨", "Tag someone who needs this", "Real talk: [insight]", "Vibes only ✨"],
  "captions-for-reels": ["Swipe for more 👉", "This changed everything ✨", "Tag someone who needs this", "Real talk ✨", "Save for later 📌"],
  "captions-for-selfies": ["Feeling [mood] ✨", "No filter needed", "Vibes only", "That's the look", "Selfie Sunday 📸"],
  "captions-for-business": ["Behind the scenes at [business]", "How we [value prop]", "Customer spotlight ✨", "New [product/service] alert", "Why we do what we do"],
  "reel-captions": ["Swipe for the full story 👉", "This changed everything ✨", "Tag someone who needs this", "Real talk ✨", "Save for later 📌"],
  "reel-hashtag-strategy": ["#reels #instagram #explore #viral #fyp #trending #niche #contentcreator", "#reels #explore #viral #niche #content #creator"],
  "post-ideas": ["[Platform] post ideas for [niche]", "Content ideas that get engagement", "What to post when you're stuck", "Evergreen post ideas", "Trending format + your twist"]
};

export function getSeoPageEntry(category: string, topic: string): SeoPageEntry | undefined {
  return seoPageEntries.find((e) => e.category === category && e.topic === topic);
}

export function getSeoPageParams(): { category: string; topic: string }[] {
  return seoPageEntries.map((e) => ({ category: e.category, topic: e.topic }));
}

export function formatTopicLabel(topic: string): string {
  return topic
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getExamplesForTopic(topic: string, category?: string): string[] {
  const composite = category ? `${category}-${topic}` : null;
  const result =
    (composite && TOPIC_EXAMPLES[composite]) ??
    TOPIC_EXAMPLES[topic] ??
    TOPIC_EXAMPLES[topic.split("-")[0]] ??
    TOPIC_EXAMPLES.captions;
  return Array.isArray(result) ? result : [];
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Map (category, topic) to related blog slugs for internal linking */
export const BLOG_TOPIC_MAP: Record<string, string[]> = {
  "tiktok_funny-captions": ["funny-tiktok-captions"],
  "tiktok_short-captions": ["short-tiktok-captions"],
  "tiktok_motivational-captions": ["motivational-tiktok-captions"],
  "tiktok_caption-ideas": ["tiktok-caption-ideas"],
  "tiktok_captions-for-views": ["best-tiktok-captions-for-views"],
  "tiktok_trending-captions": ["trending-tiktok-captions"],
  "tiktok_viral-hooks": ["viral-tiktok-hooks", "how-to-write-tiktok-hooks", "how-to-write-viral-hooks"],
  "tiktok_bio-ideas": ["best-tiktok-bio-ideas", "best-tiktok-bios-2025"],
  "tiktok_content-ideas": ["tiktok-content-ideas-that-work", "tiktok-content-ideas-beginners"],
  "tiktok_username-ideas": ["tiktok-username-ideas"],
  "youtube_title-examples": ["youtube-title-examples", "youtube-title-formulas"],
  "youtube_titles-for-views": ["best-youtube-titles-for-views"],
  "youtube_title-formulas": ["youtube-title-formulas"],
  "youtube_shorts-titles": ["shorts-title-formulas"],
  "youtube_hook-examples": ["youtube-hook-examples"],
  "youtube_script-template": ["youtube-script-template-beginners"],
  "youtube_script-structure": ["youtube-script-structure"],
  "youtube_script-for-beginners": ["youtube-script-template-beginners"],
  "youtube_video-ideas": ["youtube-video-ideas-that-work"],
  "instagram_captions-for-reels": ["instagram-captions-for-reels", "instagram-reel-captions-2025"],
  "instagram_captions-for-selfies": ["instagram-captions-for-selfies"],
  "instagram_captions-for-business": ["instagram-captions-for-business"],
  "instagram_reel-captions": ["instagram-reel-captions-2025"],
  "instagram_hashtag-ideas": ["instagram-hashtag-ideas-2025"],
  "instagram_reel-hashtag-strategy": ["instagram-reel-hashtag-strategy"],
  "tiktok_captions": ["tiktok-caption-ideas", "funny-tiktok-captions"],
  "youtube_titles": ["youtube-title-formulas", "best-youtube-titles-for-views"],
  "instagram_captions": ["instagram-captions-for-reels", "instagram-captions-for-business"]
};

export function getRelatedBlogSlugs(category: string, topic: string): string[] {
  const key = `${category}_${topic}`;
  return BLOG_TOPIC_MAP[key] ?? BLOG_TOPIC_MAP[`${category}_${topic.split("-")[0]}`] ?? [];
}

/** Get 3 related SEO pages (same category) for cross-linking */
export function getRelatedSeoPages(
  category: string,
  topic: string,
  excludeCurrent = true
): { category: string; topic: string }[] {
  const sameCategory = seoPageEntries.filter(
    (e) => e.category === category && (!excludeCurrent || e.topic !== topic)
  );
  const topicBase = topic.split("-")[0];
  const similar = sameCategory.filter((e) => e.topic.includes(topicBase) || topic.includes(e.topic.split("-")[0]));
  const rest = sameCategory.filter((e) => !similar.some((s) => s.topic === e.topic));
  const pool = [...similar, ...rest];
  return pool.slice(0, 3).map((e) => ({ category: e.category, topic: e.topic }));
}

/** Tips for writing good captions/titles by content type */
export const WRITING_TIPS: Record<string, string[]> = {
  captions: [
    "Hook in the first line—viewers decide in 2 seconds.",
    "Keep it short: 2–3 lines max so it doesn't get cut off.",
    "Add 1–2 emojis for personality and scanability.",
    "Include a clear CTA: Save, Comment, Share, or Follow.",
    "Match the caption tone to your video energy."
  ],
  titles: [
    "Front-load the most interesting word in the first 3–4 words.",
    "Stay under 60 characters for full visibility in search.",
    "Use curiosity gaps: promise value without giving everything away.",
    "Include numbers when relevant: '7 Tips', '10 Minutes'.",
    "A/B test different angles to see what your audience clicks."
  ],
  hooks: [
    "Open with a pattern interrupt—surprise, question, or bold claim.",
    "Speak to a specific identity: 'If you're a [niche] creator…'",
    "Create curiosity: hint at a secret, mistake, or outcome.",
    "Keep it under 3 seconds when spoken aloud.",
    "Match the hook to your first frame visually."
  ],
  default: [
    "Be specific to your niche—generic content gets lost.",
    "Test and iterate based on what gets engagement.",
    "Stay consistent with your brand voice.",
    "Use the AI generator for multiple options, then pick the best.",
    "Update your approach as trends and algorithms change."
  ]
};

export function getWritingTips(topic: string): string[] {
  if (topic.includes("caption")) return WRITING_TIPS.captions;
  if (topic.includes("title")) return WRITING_TIPS.titles;
  if (topic.includes("hook")) return WRITING_TIPS.hooks;
  return WRITING_TIPS.default;
}
