/**
 * Topic pages - /topics/[slug]
 * 200 topics for creator content
 */

export type TopicConfig = {
  slug: string;
  title: string;
  intro: string;
  toolSlug: string;
  toolName: string;
};

const TOOL_MAP: Record<string, { slug: string; name: string }> = {
  caption: { slug: "tiktok-caption-generator", name: "TikTok Caption Generator" },
  hook: { slug: "hook-generator", name: "Hook Generator" },
  instagram: { slug: "instagram-caption-generator", name: "Instagram Caption Generator" }
};

function topic(
  slug: string,
  title: string,
  type: "caption" | "hook" | "instagram" = "caption"
): TopicConfig {
  const t = TOOL_MAP[type];
  return {
    slug,
    title: `${title} Content`,
    intro: `${title} captions, hooks, and ideas for creators. Get inspiration and generate your own with AI.`,
    toolSlug: t.slug,
    toolName: t.name
  }
}

function buildTopics(): TopicConfig[] {
  const base = [
    "fitness", "motivation", "business", "food", "travel", "startup", "productivity",
    "gym", "workout", "health", "wellness", "mindset", "self-improvement", "goals",
    "entrepreneur", "marketing", "finance", "investing", "side-hustle", "freelance",
    "cooking", "recipes", "restaurant", "foodie", "baking", "meal-prep", "nutrition",
    "adventure", "wanderlust", "destinations", "vacation", "nature", "outdoors",
    "skincare", "makeup", "beauty", "hair", "fashion", "ootd", "style", "aesthetic",
    "gaming", "tech", "software", "coding", "ai", "digital", "social-media",
    "comedy", "funny", "humor", "relatable", "sarcastic", "meme",
    "education", "learning", "study", "tips", "hacks", "tutorial", "how-to",
    "lifestyle", "day-in-life", "vlog", "routine", "morning", "night",
    "family", "mom", "dad", "kids", "parenting", "home", "pets", "dog", "cat",
    "wedding", "relationship", "couple", "dating", "love", "friendship",
    "transformation", "before-after", "progress", "journey", "story",
    "grwm", "get-ready", "outfit", "getting-ready", "getting-ready-with-me",
    "dance", "music", "singing", "cover", "artist", "creative",
    "yoga", "meditation", "mental-health", "therapy", "self-care",
    "running", "marathon", "cycling", "crossfit", "weightlifting",
    "vegan", "plant-based", "keto", "diet", "weight-loss", "fitness-journey",
    "small-business", "ecommerce", "dropshipping", "shopify", "amazon",
    "real-estate", "property", "home-decor", "interior", "design",
    "photography", "photo", "camera", "editing", "lightroom",
    "art", "drawing", "painting", "craft", "diy", "handmade",
    "book", "reading", "writing", "author", "novel",
    "podcast", "interview", "conversation", "talk",
    "asmr", "relaxing", "sleep", "calm",
    "sports", "basketball", "soccer", "football", "tennis", "golf",
    "car", "automotive", "motorcycle", "bike",
    "science", "space", "nature-science", "experiment",
    "history", "culture", "documentary",
    "fashion-week", "runway", "streetwear", "sustainable-fashion",
    "luxury", "minimalist", "capsule-wardrobe",
    "coffee", "cafe", "barista", "tea", "drinks",
    "party", "nightlife", "club", "concert", "event",
    "birthday", "celebration", "holiday", "christmas", "halloween", "valentines",
    "summer", "winter", "spring", "fall", "seasonal",
    "minimalist", "clean", "simple", "organized", "declutter",
    "cottagecore", "y2k", "dark-academia", "light-academia", "aesthetic",
    "baddie", "clean-girl", "that-girl", "soft-girl", "edgy",
    "confidence", "self-love", "body-positive", "empowerment",
    "inspiration", "quotes", "motivational-quotes", "daily-motivation",
    "productivity-tips", "time-management", "focus", "discipline",
    "remote-work", "work-from-home", "digital-nomad", "laptop-life",
    "content-creation", "creator-economy", "influencer", "creator-tips",
    "branding", "personal-brand", "brand-voice", "niche",
    "collab", "partnership", "networking", "community",
    "launch", "launching", "product-launch", "business-launch",
    "testimonial", "review", "unboxing", "haul", "first-impression",
    "challenge", "trend", "viral", "trending", "fyp",
    "duet", "stitch", "remix", "sound",
    "storytime", "story", "experience", "lesson-learned",
    "day-in-my-life", "vlog", "routine", "schedule",
    "get-ready-with-me", "grwm", "morning-routine", "night-routine",
    "outfit-check", "try-on", "haul", "fashion-haul",
    "recipe", "cooking-tutorial", "meal-idea", "quick-meal",
    "workout-routine", "gym-session", "home-workout", "no-equipment",
    "travel-vlog", "travel-tips", "packing", "itinerary",
    "skincare-routine", "skincare-tips", "product-review", "skincare-hacks",
    "makeup-tutorial", "makeup-look", "makeup-tips", "makeup-transformation",
    "hair-tutorial", "hair-tips", "hair-transformation", "haircare",
    "room-tour", "apartment-tour", "home-tour", "organization",
    "desk-setup", "workspace", "office", "study-setup",
    "budget", "saving", "money-tips", "financial-freedom",
    "career", "job", "interview", "resume", "linkedin",
    "college", "university", "student", "student-life", "exams",
    "newborn", "baby", "toddler", "pregnancy", "mom-life",
    "gardening", "plants", "indoor-plants", "plant-care",
    "camping", "hiking", "backpacking", "road-trip",
    "beach", "pool", "summer-vibes", "sunset", "sunrise",
    "snow", "winter-vibes", "cozy", "hygge",
    "coffee-shop", "cafe-vibes", "study-with-me", "work-with-me",
    "asmr", "satisfying", "oddly-satisfying", "relaxing",
    "prank", "challenge", "dare", "fun",
    "reaction", "react", "first-time", "trying",
    "comparison", "vs", "versus", "difference",
    "top-10", "list", "ranking", "best-of",
    "beginner", "starter", "101", "basics", "intro",
    "advanced", "pro", "expert", "master",
    "mistakes", "errors", "what-not-to-do", "avoid",
    "secret", "hidden", "unknown", "discover",
    "2025", "new", "latest", "trending-now",
    "throwback", "nostalgia", "memory", "retro",
    "behind-the-scenes", "bts", "process", "how-its-made",
    "q-and-a", "faq", "questions", "ask-me",
    "announcement", "news", "update", "life-update"
  ];

  const seen = new Set<string>();
  const out: TopicConfig[] = [];

  for (const s of base) {
    if (seen.has(s)) continue;
    seen.add(s);
    const title = s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const toolType = ["hook", "opening", "curiosity", "story", "viral", "intro"].some((x) => s.includes(x))
      ? "hook"
      : ["instagram", "reel", "feed", "carousel"].some((x) => s.includes(x))
        ? "instagram"
        : "caption";
    out.push(topic(s, title, toolType));
  }

  const extra = [
    "opening-hooks", "curiosity-hooks", "question-hooks", "story-hooks", "viral-hooks",
    "first-line-hooks", "controversial-hooks", "trending-hooks",
    "aesthetic-reels", "dance-reels", "comedy-reels", "tutorial-reels",
    "pov-content", "relatable-content", "savage-captions", "attitude-captions",
    "short-captions", "long-captions", "best-captions", "viral-captions",
    "caption-ideas", "hook-ideas", "content-ideas", "video-ideas",
    "niche-content", "trending-content", "evergreen-content",
    "personal-brand", "brand-story", "brand-values",
    "engagement-tips", "growth-tips", "algorithm-tips",
    "cta-ideas", "call-to-action", "engagement-cta",
    "hashtag-strategy", "caption-strategy", "content-strategy",
    "monetization", "sponsorship", "brand-deals",
    "analytics", "insights", "metrics", "performance",
    "sad-captions", "cute-captions", "romantic-captions", "sassy-captions",
    "confidence-captions", "self-love-captions", "lifestyle-captions",
    "pet-captions", "music-captions", "gaming-captions", "tech-captions",
    "cooking-captions", "skincare-captions", "makeup-captions", "hair-captions",
    "ootd-captions", "unboxing-captions", "review-captions", "tutorial-captions",
    "tips-captions", "hacks-captions", "life-hack-captions", "productivity-captions",
    "study-captions", "work-from-home-captions", "small-business-captions",
    "entrepreneur-captions", "mom-life-captions", "dad-captions", "family-captions",
    "wedding-captions", "vacation-captions", "adventure-captions", "nature-captions",
    "sunset-captions", "coffee-captions", "aesthetic-video", "soft-aesthetic",
    "dark-aesthetic", "y2k", "cottagecore", "minimalist-captions", "edgy-captions",
    "baddie-captions", "clean-girl-captions", "that-girl-captions",
    "morning-motivation", "evening-routine", "weekend-vibes", "monday-motivation",
    "friday-feels", "sunday-scaries", "self-care-sunday", "wellness-wednesday",
    "transformation-tuesday", "throwback-thursday", "fitness-friday",
    "money-mindset", "wealth-building", "passive-income", "multiple-streams",
    "email-marketing", "seo-tips", "social-strategy", "content-calendar",
    "repurposing-content", "cross-posting", "platform-specific",
    "first-post", "reels-tips", "tiktok-tips", "youtube-tips", "instagram-tips",
    "comment-ideas", "dm-strategies", "community-building", "audience-growth",
    "authenticity", "vulnerability", "storytelling", "narrative",
    "micro-influencer", "nano-influencer", "macro-influencer",
    "ugc-content", "user-generated", "brand-ambassador", "affiliate-marketing",
    "link-in-bio", "linktree", "bio-optimization", "profile-optimization",
    "reel-hooks", "tiktok-hooks", "youtube-intros", "attention-grabbers",
    "scroll-stoppers", "thumb-stoppers", "first-3-seconds", "first-frame"
  ];

  for (const s of extra) {
    if (seen.has(s)) continue;
    seen.add(s);
    const title = s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const toolType = s.includes("hook") ? "hook" : s.includes("reel") ? "instagram" : "caption";
    out.push(topic(s, title, toolType));
  }

  return out.slice(0, 200);
}

export const TOPICS = buildTopics();

export function getTopic(slug: string): TopicConfig | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function getAllTopicSlugs(): string[] {
  return TOPICS.map((t) => t.slug);
}

export const TOPIC_CLUSTER_TYPES = ["captions", "hooks", "ideas"] as const;

export type TopicClusterType = (typeof TOPIC_CLUSTER_TYPES)[number];

export function parseTopicClusterSlug(
  slug: string
): { baseSlug: string; clusterType: TopicClusterType } | null {
  for (const t of TOPIC_CLUSTER_TYPES) {
    const suffix = `-${t}`;
    if (slug.endsWith(suffix)) {
      const baseSlug = slug.slice(0, -suffix.length);
      if (getTopic(baseSlug)) return { baseSlug, clusterType: t };
    }
  }
  return null;
}

export function getAllTopicClusterSlugs(): string[] {
  const out: string[] = [];
  for (const t of TOPICS) {
    for (const ct of TOPIC_CLUSTER_TYPES) {
      out.push(`${t.slug}-${ct}`);
    }
  }
  return out;
}
