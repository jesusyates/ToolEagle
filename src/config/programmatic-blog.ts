/**
 * Programmatic Blog Engine - Best {topic} {platform} {type}
 * Target: 3000+ pages (v17)
 */

export const PROGRAMMATIC_BLOG_TOPICS = [
  "funny", "aesthetic", "savage", "cute", "attitude", "love", "sad", "selfie", "travel", "fitness",
  "gym", "gaming", "food", "friends", "motivation", "inspirational", "sarcastic", "sassy", "romantic",
  "confidence", "self-love", "lifestyle", "pet", "music", "tech", "cooking", "skincare", "makeup",
  "hair", "ootd", "unboxing", "review", "tutorial", "tips", "hacks", "life-hack", "productivity",
  "study", "work-from-home", "small-business", "entrepreneur", "mom-life", "dad", "family",
  "wedding", "vacation", "adventure", "nature", "sunset", "coffee", "y2k", "cottagecore",
  "minimalist", "edgy", "baddie", "clean-girl", "that-girl", "grwm", "day-in-my-life", "storytime",
  "comedy", "relatable", "transformation", "dance", "education", "viral", "trending",
  "gaming-video", "prank", "reaction", "how-to", "diy", "business", "finance", "yoga", "running",
  "duet", "stitch", "challenge", "vlog", "niche", "pov", "story", "curiosity", "question",
  "controversial", "secret", "mystery", "clickbait", "views", "engagement", "beginners", "advanced",
  "lets-play", "walkthrough", "asmr", "cover", "comparison", "top-10", "list",
  "brand", "product", "promotion", "launch", "testimonial", "behind-the-scenes", "team", "event",
  "collab", "giveaway", "contest", "sale", "new-arrival", "recipe", "restaurant",
  "aesthetic-reel", "trending-reel", "dance-reel", "tutorial-reel", "comedy-reel",
  "fashion", "beauty", "lifestyle-vlog", "daily-vlog", "morning-routine", "night-routine",
  "workout", "weight-loss", "healthy-eating", "meal-prep", "vegan", "keto",
  "dating", "relationship", "breakup", "self-care", "mental-health", "mindfulness",
  "home-decor", "interior-design", "diy-home", "organization", "minimalism",
  "photography", "photo-editing", "lightroom", "portrait", "landscape",
  "coding", "programming", "web-dev", "app-development", "no-code",
  "investing", "stocks", "crypto", "side-hustle", "passive-income",
  "book-review", "reading", "writing", "author", "poetry",
  "art", "drawing", "painting", "digital-art", "illustration",
  "podcast", "interview", "conversation", "storytelling",
  "travel-vlog", "backpacking", "solo-travel", "family-travel", "luxury-travel",
  "streetwear", "outfit", "fashion-haul", "try-on", "styling",
  "nails", "nail-art", "manicure", "pedicure",
  "hair-tutorial", "hair-transformation", "hair-color", "braids",
  "makeup-tutorial", "grwm-makeup", "natural-makeup", "glam",
  "baby", "toddler", "parenting", "pregnancy", "new-mom",
  "dog", "cat", "pets", "animal", "wildlife",
  "car", "automotive", "car-review", "driving",
  "sports", "basketball", "football", "soccer", "tennis", "golf",
  "music-production", "singing", "guitar", "piano", "cover-song",
  "stand-up", "sketch", "improv", "roast",
  "asmr", "satisfying", "oddly-satisfying", "slime",
  "unboxing", "haul", "review", "first-impressions",
  "motivation", "success", "mindset", "goals", "productivity-tips",
  "college", "student", "study-tips", "exam", "graduation",
  "wedding-planning", "bridal", "groom", "engagement",
  "real-estate", "house-tour", "apartment", "moving",
  "tech-review", "gadget", "phone", "laptop", "software",
  "language-learning", "english", "spanish", "french", "japanese",
  "cooking-basic", "baking", "dessert", "breakfast", "dinner",
  "cleaning", "laundry", "organizing", "declutter",
  "gardening", "plants", "indoor-plants", "succulents",
  "camping", "hiking", "outdoors", "survival",
  "gaming-mobile", "fortnite", "minecraft", "roblox", "valorant",
  "anime", "manga", "cosplay", "convention",
  "kpop", "bts", "korean", "k-beauty",
  "latina", "hispanic", "culture", "heritage",
  "lgbtq", "pride", "coming-out", "ally",
  "disability", "accessibility", "chronic-illness",
  "vegan-lifestyle", "sustainable", "eco-friendly", "zero-waste",
  "thrift", "vintage", "secondhand", "sustainable-fashion",
  "podcast-tips", "microphone", "recording", "editing-audio",
  "youtube-growth", "algorithm", "monetization", "analytics",
  "tiktok-growth", "fyp", "viral-tips", "creator-economy",
  "instagram-growth", "reels-tips", "engagement", "followers"
] as const;

export type ProgrammaticBlogTopic = (typeof PROGRAMMATIC_BLOG_TOPICS)[number];

export const PROGRAMMATIC_BLOG_TEMPLATES = [
  { platform: "tiktok", type: "captions" as const },
  { platform: "tiktok", type: "hooks" as const },
  { platform: "tiktok", type: "titles" as const },
  { platform: "tiktok", type: "hashtags" as const },
  { platform: "tiktok", type: "bio" as const },
  { platform: "youtube", type: "captions" as const },
  { platform: "youtube", type: "hooks" as const },
  { platform: "youtube", type: "titles" as const },
  { platform: "youtube", type: "hashtags" as const },
  { platform: "youtube", type: "bio" as const },
  { platform: "instagram", type: "captions" as const },
  { platform: "instagram", type: "hooks" as const },
  { platform: "instagram", type: "titles" as const },
  { platform: "instagram", type: "hashtags" as const },
  { platform: "instagram", type: "bio" as const }
] as const;

export function getProgrammaticBlogSlug(topic: string, platform: string, type: string): string {
  return `best-${topic}-${platform}-${type}`;
}

/** Parse slug like best-gym-tiktok-captions into { topic, platform, type } */
export function parseProgrammaticBlogSlug(slug: string): { topic: string; platform: string; type: string } | null {
  if (!slug.startsWith("best-")) return null;
  const rest = slug.slice(5);
  const platforms = ["tiktok", "youtube", "instagram"];
  const types = ["captions", "hooks", "titles", "hashtags", "bio"];
  for (const platform of platforms) {
    for (const type of types) {
      const suffix = `-${platform}-${type}`;
      if (rest.endsWith(suffix)) {
        const topic = rest.slice(0, -suffix.length);
        if (topic && PROGRAMMATIC_BLOG_TOPICS.includes(topic as ProgrammaticBlogTopic)) {
          return { topic, platform, type };
        }
      }
    }
  }
  return null;
}

export function getAllProgrammaticBlogParams(): { topic: string; platform: string; type: string }[] {
  const params: { topic: string; platform: string; type: string }[] = [];
  for (const topic of PROGRAMMATIC_BLOG_TOPICS) {
    for (const { platform, type } of PROGRAMMATIC_BLOG_TEMPLATES) {
      params.push({ topic, platform, type });
    }
  }
  return params;
}

export function formatTopicForBlog(topic: string): string {
  return topic
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

export const TYPE_LABELS: Record<string, string> = {
  captions: "Captions",
  hooks: "Hooks",
  titles: "Titles",
  hashtags: "Hashtags",
  bio: "Bio"
};
