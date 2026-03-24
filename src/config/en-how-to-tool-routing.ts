import type { EnHowToContent } from "@/lib/en-how-to-content";

const SLUG_TOOL_OVERRIDES: Record<string, string> = {
  "tiktok-creator-fund": "tiktok-caption-generator",
  "tiktok-brand-deals": "tiktok-caption-generator",
  "youtube-brand-deals": "youtube-title-generator",
  "instagram-brand-deals": "instagram-caption-generator",
  "youtube-ctr": "youtube-title-generator",
  "youtube-thumbnails": "youtube-title-generator",
  "youtube-retention": "youtube-hook-generator",
  "tiktok-analytics": "tiktok-idea-generator",
  "tiktok-trending-sounds": "tiktok-caption-generator",
  "instagram-reels-growth": "instagram-reels-caption-generator",
  "reel-captions": "instagram-reels-caption-generator"
};

type TopicRule = {
  match: RegExp;
  tool: string;
};

// Ordered rules: more specific first, then generic fallbacks.
const TOPIC_TOOL_RULES: TopicRule[] = [
  { match: /\binstagram\b.*\bhashtag|hashtag.*\binstagram\b/i, tool: "instagram-hashtag-generator" },
  { match: /\btiktok\b.*\bhashtag|hashtag.*\btiktok\b/i, tool: "tiktok-hashtag-generator" },
  { match: /\bhashtag\b/i, tool: "hashtag-generator" },

  { match: /\binstagram\b.*\bbio|bio.*\binstagram\b/i, tool: "instagram-bio-generator" },
  { match: /\btiktok\b.*\bbio|bio.*\btiktok\b/i, tool: "tiktok-bio-generator" },

  { match: /\byoutube\b.*\bdescription|description.*\byoutube\b/i, tool: "youtube-description-generator" },
  { match: /\bdescription\b/i, tool: "youtube-description-generator" },

  { match: /\byoutube\b.*\bhook|hook.*\byoutube\b/i, tool: "youtube-hook-generator" },
  { match: /\btiktok\b.*\bhook|hook.*\btiktok\b/i, tool: "tiktok-hook-generator" },
  { match: /\bhook(s)?\b/i, tool: "hook-generator" },

  { match: /\bshorts?\b/i, tool: "youtube-shorts-title-generator" },
  { match: /\byoutube\b.*\btitle|title.*\byoutube\b/i, tool: "youtube-title-generator" },
  { match: /\btitle(s)?\b/i, tool: "title-generator" },

  { match: /\bscript(s)?\b.*\btiktok|\btiktok\b.*\bscript(s)?\b/i, tool: "tiktok-script-generator" },
  { match: /\bscript(s)?\b/i, tool: "short-form-script-generator" },

  { match: /\bidea(s)?\b.*\btiktok|\btiktok\b.*\bidea(s)?\b/i, tool: "tiktok-idea-generator" },
  { match: /\bidea(s)?\b/i, tool: "youtube-video-idea-generator" },

  { match: /\breel(s)?\b/i, tool: "instagram-reels-caption-generator" },
  { match: /\binstagram\b/i, tool: "instagram-caption-generator" },
  { match: /\byoutube\b/i, tool: "youtube-title-generator" },
  { match: /\btiktok\b/i, tool: "tiktok-caption-generator" }
];

export function resolveEnHowToRecommendedToolSlug(content: EnHowToContent): string {
  if (SLUG_TOOL_OVERRIDES[content.slug]) return SLUG_TOOL_OVERRIDES[content.slug];

  const text = `${content.slug} ${content.title}`.toLowerCase();
  const matched = TOPIC_TOOL_RULES.find((rule) => rule.match.test(text));
  if (matched) return matched.tool;

  return content.primaryTool;
}

