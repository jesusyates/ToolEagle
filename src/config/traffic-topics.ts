/**
 * v40 Traffic Capture Engine - Topics for guide pages
 * /how-to/[topic], /ai-prompts/[topic], /content-strategy/[topic], /viral-examples/[topic]
 */

export const HOW_TO_TOPICS = [
  "grow-on-tiktok",
  "go-viral-on-instagram",
  "get-youtube-subscribers",
  "write-viral-captions",
  "get-instagram-followers",
  "create-viral-hooks",
  "grow-on-youtube-shorts",
  "build-creator-brand",
  "monetize-tiktok",
  "increase-engagement"
] as const;

export const AI_PROMPT_TOPICS = [
  "tiktok",
  "youtube",
  "instagram",
  "startup",
  "fitness",
  "travel",
  "food",
  "business",
  "motivation",
  "beauty"
] as const;

export const CONTENT_STRATEGY_TOPICS = [
  "startup",
  "fitness",
  "personal-brand",
  "online-business",
  "ecommerce",
  "coaching",
  "content-creator",
  "influencer"
] as const;

export const VIRAL_EXAMPLE_TOPICS = [
  "fitness",
  "motivation",
  "business",
  "travel",
  "food",
  "beauty",
  "lifestyle",
  "tech",
  "education",
  "gaming"
] as const;

export type HowToTopic = (typeof HOW_TO_TOPICS)[number];
export type AiPromptTopic = (typeof AI_PROMPT_TOPICS)[number];
export type ContentStrategyTopic = (typeof CONTENT_STRATEGY_TOPICS)[number];
export type ViralExampleTopic = (typeof VIRAL_EXAMPLE_TOPICS)[number];

export type GuidePageType = "how-to" | "ai-prompts" | "content-strategy" | "viral-examples";

export const GUIDE_PAGE_CONFIG: Record<
  GuidePageType,
  { topics: readonly string[]; label: string; basePath: string }
> = {
  "how-to": { topics: [...HOW_TO_TOPICS], label: "How to", basePath: "/how-to" },
  "ai-prompts": { topics: [...AI_PROMPT_TOPICS], label: "AI Prompts for", basePath: "/ai-prompts-for" },
  "content-strategy": { topics: [...CONTENT_STRATEGY_TOPICS], label: "Content Strategy for", basePath: "/content-strategy" },
  "viral-examples": { topics: [...VIRAL_EXAMPLE_TOPICS], label: "Viral Examples for", basePath: "/viral-examples" }
};

export function formatTopicLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAllGuideParams(): { pageType: GuidePageType; topic: string }[] {
  const params: { pageType: GuidePageType; topic: string }[] = [];
  for (const [pageType, config] of Object.entries(GUIDE_PAGE_CONFIG)) {
    for (const topic of config.topics) {
      params.push({ pageType: pageType as GuidePageType, topic });
    }
  }
  return params;
}
