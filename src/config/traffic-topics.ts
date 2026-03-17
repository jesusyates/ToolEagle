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

/** Modifiers for topic expansion (v55). Each base topic → 3-5 variant slugs. */
export const ZH_TOPIC_MODIFIERS = ["fast", "beginners", "2026", "strategy", "tips"] as const;

/** Parse slug into baseTopic + modifier. e.g. "grow-on-tiktok-fast" → { baseTopic: "grow-on-tiktok", modifier: "fast" } */
export function parseZhSlug(slug: string): { baseTopic: string; modifier: string | null } {
  for (const mod of ZH_TOPIC_MODIFIERS) {
    const suffix = `-${mod}`;
    if (slug.endsWith(suffix)) {
      return { baseTopic: slug.slice(0, -suffix.length), modifier: mod };
    }
  }
  return { baseTopic: slug, modifier: null };
}

/** Check if baseTopic is valid for the given page type. */
export function isBaseTopicValid(pageType: GuidePageType, baseTopic: string): boolean {
  const config = GUIDE_PAGE_CONFIG[pageType];
  return config.topics.includes(baseTopic);
}

/** Unique base topic slugs. */
export function getBaseTopicSlugs(): string[] {
  const topics = new Set<string>();
  for (const config of Object.values(GUIDE_PAGE_CONFIG)) {
    for (const topic of config.topics) {
      topics.add(topic);
    }
  }
  return [...topics];
}

/** All topic slugs including variants. Base + base-fast, base-beginners, etc. Max 800. */
export function getAllPromptTopicSlugs(): string[] {
  const baseTopics = getBaseTopicSlugs();
  const slugs = new Set<string>(baseTopics);
  for (const base of baseTopics) {
    for (const mod of ZH_TOPIC_MODIFIERS) {
      slugs.add(`${base}-${mod}`);
    }
  }
  return [...slugs].slice(0, 800);
}

/** v56: Extract platform from topic slug. grow-on-tiktok → tiktok */
export const ZH_PLATFORMS = ["tiktok", "youtube", "instagram"] as const;
export type ZhPlatform = (typeof ZH_PLATFORMS)[number];

export function extractPlatformFromTopic(topicSlug: string): ZhPlatform | "general" {
  const base = parseZhSlug(topicSlug).baseTopic;
  if (base.includes("tiktok")) return "tiktok";
  if (base.includes("youtube")) return "youtube";
  if (base.includes("instagram")) return "instagram";
  if (base === "tiktok" || base === "youtube" || base === "instagram") return base;
  return "general";
}
