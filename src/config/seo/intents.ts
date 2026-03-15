/**
 * SEO Engine v10 - Intent dimension for keyword expansion
 * URL: /tiktok/captions/funny-ideas, /tiktok/captions/funny-examples, etc.
 */
export const intents = ["ideas", "examples", "templates", "questions", "guide"] as const;
export type Intent = (typeof intents)[number];

export const INTENT_LABELS: Record<Intent, string> = {
  ideas: "Ideas",
  examples: "Examples",
  templates: "Templates",
  questions: "Questions",
  guide: "Guide"
};

/** Extract base topic from topic slug (e.g. funny-ideas -> funny) */
export function getBaseTopic(topic: string): string {
  for (const intent of intents) {
    if (topic.endsWith(`-${intent}`)) {
      return topic.slice(0, -(intent.length + 1));
    }
  }
  return topic;
}

/** Check if topic has an intent suffix */
export function getIntent(topic: string): Intent | null {
  for (const intent of intents) {
    if (topic.endsWith(`-${intent}`)) return intent;
  }
  return null;
}
