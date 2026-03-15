/**
 * Caption / Hook category pages
 * /captions/[topic] and /hooks/[topic]
 */

export const CAPTION_HOOK_TOPICS = [
  "motivation",
  "gym",
  "business",
  "food",
  "travel",
  "startup",
  "productivity"
] as const;

export type CaptionHookTopic = (typeof CAPTION_HOOK_TOPICS)[number];

export function getCaptionHookTopic(slug: string): CaptionHookTopic | undefined {
  return CAPTION_HOOK_TOPICS.includes(slug as CaptionHookTopic) ? (slug as CaptionHookTopic) : undefined;
}

export function formatTopicLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
