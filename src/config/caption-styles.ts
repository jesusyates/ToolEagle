/**
 * v29 — Keyword Pattern Expansion
 * /captions/[topic]/[style]
 *
 * Styles: best, short, funny, cool, viral
 */

import { getAllTopicSlugs, getTopic } from "./topics";

export const CAPTION_STYLES = ["best", "short", "funny", "cool", "viral"] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

export type CaptionStyleConfig = {
  topic: string;
  style: CaptionStyle;
  title: string;
  metaTitle: string;
  description: string;
  tips: string[];
};

function formatLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STYLE_TIPS: Record<CaptionStyle, string[]> = {
  best: [
    "Hook in the first line—under 150 characters",
    "Use 1–3 emojis max",
    "Add a CTA: follow, comment, save",
    "Match trending sounds and formats"
  ],
  short: [
    "Keep it under 100 characters for maximum impact",
    "One strong line beats a paragraph",
    "Punchy and memorable",
    "Leave them wanting more"
  ],
  funny: [
    "Relatable humor works best",
    "Unexpected twist in the punchline",
    "Self-deprecating can be engaging",
    "Match the video tone"
  ],
  cool: [
    "Confident, not try-hard",
    "Minimal emojis, maximum attitude",
    "Let the content speak",
    "Understated works"
  ],
  viral: [
    "Curiosity gap in first line",
    "Bold claim that demands a payoff",
    "Comment bait: ask a question",
    "Save-worthy value"
  ]
};

export function getCaptionStyleConfig(topicSlug: string, style: CaptionStyle): CaptionStyleConfig | null {
  const topic = getTopic(topicSlug);
  if (!topic) return null;
  if (!CAPTION_STYLES.includes(style)) return null;

  const label = formatLabel(topicSlug);
  const styleLabel = style.charAt(0).toUpperCase() + style.slice(1);

  const descriptions: Record<CaptionStyle, string> = {
    best: `The best ${label.toLowerCase()} captions for TikTok and Instagram. ${styleLabel} styles that stop the scroll and drive engagement.`,
    short: `${styleLabel} ${label.toLowerCase()} captions. Punchy, memorable, under 100 characters. Copy or generate with AI.`,
    funny: `${styleLabel} ${label.toLowerCase()} captions. Relatable humor that gets comments and shares. Generate with AI.`,
    cool: `${styleLabel} ${label.toLowerCase()} captions. Confident, understated, maximum attitude.`,
    viral: `${styleLabel} ${label.toLowerCase()} captions. Curiosity-driven openers that get saves and shares.`
  };

  return {
    topic: topicSlug,
    style,
    title: `${styleLabel} ${label} Captions`,
    metaTitle: `${styleLabel} ${label} Captions | ToolEagle`,
    description: descriptions[style],
    tips: STYLE_TIPS[style]
  };
}

export function getAllCaptionStyleParams(): { topic: string; style: CaptionStyle }[] {
  const topics = getAllTopicSlugs();
  const out: { topic: string; style: CaptionStyle }[] = [];
  for (const topic of topics) {
    for (const style of CAPTION_STYLES) {
      out.push({ topic, style });
    }
  }
  return out;
}
