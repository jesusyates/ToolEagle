/**
 * SEO Engine v10 - Topics with intent expansion
 * Base topics + intent variants (ideas, examples, templates, questions, guide)
 * Target: ~10000 pages
 */
import { intents } from "./intents";

const baseTopics = [
  "funny", "aesthetic", "savage", "cute", "attitude", "love", "sad", "selfie", "travel", "fitness",
  "gym", "gaming", "food", "friends", "motivation", "inspirational", "sarcastic", "sassy", "romantic",
  "confidence", "self-love", "lifestyle", "pet", "music", "tech", "cooking", "skincare", "makeup",
  "hair", "ootd", "unboxing", "review", "tutorial", "tips", "hacks", "life-hack", "productivity",
  "study", "work-from-home", "small-business", "entrepreneur", "mom-life", "dad", "family",
  "wedding", "vacation", "adventure", "nature", "sunset", "coffee", "y2k", "cottagecore",
  "minimalist", "edgy", "baddie", "clean-girl", "that-girl", "grwm", "day-in-my-life", "storytime",
  "duet", "stitch", "trending-sound", "challenge", "before-after", "get-ready-with-me", "vlog",
  "comedy", "relatable", "transformation", "dance", "education", "niche", "viral", "trending",
  "best", "short", "long", "pov", "story", "opening", "first-line", "curiosity", "question",
  "controversial", "secret", "mystery", "clickbait", "views", "engagement", "beginners", "advanced",
  "gaming-video", "lets-play", "walkthrough", "prank", "reaction", "how-to",
  "diy", "business", "finance", "asmr", "cover", "comparison", "vs", "top-10", "list",
  "brand", "product", "promotion", "launch", "testimonial", "behind-the-scenes", "team", "event",
  "collab", "giveaway", "contest", "sale", "new-arrival", "recipe", "restaurant", "yoga",
  "running", "aesthetic-reel", "trending-reel", "dance-reel", "tutorial-reel", "comedy-reel",
  "script", "script-template", "script-structure"
];

const intentVariants = baseTopics.flatMap((t) =>
  intents.map((i) => `${t}-${i}` as const)
);

const legacyTopics = [
  "2025", "2026", "niche-hashtags", "fitness-hashtags", "fashion-hashtags", "food-hashtags",
  "travel-hashtags", "beauty-hashtags", "business-hashtags", "small-business-hashtags", "brand-hashtags",
  "creative-usernames", "aesthetic-usernames", "funny-usernames", "cute-usernames",
  "video-ideas", "content-ideas", "ideas-for-beginners", "viral-ideas", "trending-ideas",
  "fitness-ideas", "beauty-ideas", "food-ideas", "travel-ideas", "gaming-ideas", "education-ideas",
  "dance-ideas", "comedy-ideas", "storytime-ideas", "duet-ideas", "stitch-ideas",
  "challenge-ideas", "trending-sounds-ideas", "best-hashtags", "viral-hashtags", "dance-hashtags",
  "comedy-hashtags", "caption-ideas", "caption-for-views", "caption-for-reels", "caption-for-selfies",
  "caption-for-business", "reel-captions", "title-examples", "title-formulas", "title-for-views",
  "shorts-titles", "intro-hooks", "hook-examples", "bio-ideas", "bio-examples"
] as const;

export const topics = [...baseTopics, ...intentVariants, ...legacyTopics] as const;

export type Topic = (typeof topics)[number];

export function formatTopicLabel(topic: string): string {
  return topic
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
