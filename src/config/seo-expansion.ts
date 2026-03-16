/**
 * v28 — Massive SEO Expansion Engine
 * Generates 5000+ SEO pages from topics.
 *
 * Page types:
 * - /best-captions/[topic]  → best [topic] captions
 * - /best-hooks/[topic]     → best [topic] hooks
 * - /caption-ideas/[topic]  → [topic] caption ideas
 * - /content-ideas/[topic]  → [topic] content ideas
 * - /video-ideas/[topic]    → [topic] video ideas
 * - /post-ideas/[topic]     → [topic] post ideas
 */

import { getAllTopicSlugs, getTopic } from "./topics";

export type SeoExpansionPageType =
  | "best-captions"
  | "best-hooks"
  | "caption-ideas"
  | "content-ideas"
  | "video-ideas"
  | "post-ideas";

export type SeoExpansionConfig = {
  pageType: SeoExpansionPageType;
  topic: string;
  title: string;
  metaTitle: string;
  description: string;
  toolSlug: string;
  toolName: string;
  tips: string[];
};

const CAPTION_TOOLS = ["tiktok-caption-generator", "instagram-caption-generator"];
const HOOK_TOOLS = ["hook-generator", "youtube-hook-generator"];

const DEFAULT_TIPS: Record<SeoExpansionPageType, string[]> = {
  "best-captions": [
    "Hook in the first line—under 150 characters works best",
    "Use 1–3 emojis max to add personality",
    "Add a CTA: follow, comment, save",
    "Match the tone of your video"
  ],
  "best-hooks": [
    "Hook in 3–5 seconds—no slow intros",
    "Use questions your audience already asks",
    "Bold claims need a payoff",
    "Match thumbnail and title"
  ],
  "caption-ideas": [
    "Start with a hook or question",
    "Keep first line under 150 chars",
    "Use line breaks for readability",
    "End with a CTA"
  ],
  "content-ideas": [
    "Mix trending formats with evergreen topics",
    "Repurpose top performers",
    "Test different angles",
    "Track what resonates"
  ],
  "video-ideas": [
    "Hook in the first 3 seconds",
    "Use trending sounds and formats",
    "Add value before asking for engagement",
    "Consistency beats perfection"
  ],
  "post-ideas": [
    "First line = scroll stopper",
    "Use carousels for tips and lists",
    "Stories for behind-the-scenes",
    "Reels for reach"
  ]
};

function getToolForPageType(pageType: SeoExpansionPageType): { slug: string; name: string } {
  switch (pageType) {
    case "best-captions":
    case "caption-ideas":
      return { slug: "tiktok-caption-generator", name: "TikTok Caption Generator" };
    case "best-hooks":
      return { slug: "hook-generator", name: "Hook Generator" };
    case "content-ideas":
    case "video-ideas":
    case "post-ideas":
      return { slug: "hook-generator", name: "Hook Generator" };
    default:
      return { slug: "tiktok-caption-generator", name: "TikTok Caption Generator" };
  }
}

function formatLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getSeoExpansionConfig(
  pageType: SeoExpansionPageType,
  topicSlug: string
): SeoExpansionConfig | null {
  const topic = getTopic(topicSlug);
  if (!topic) return null;

  const label = formatLabel(topicSlug);
  const tool = getToolForPageType(pageType);

  const configs: Record<SeoExpansionPageType, { title: string; metaTitle: string; description: string }> = {
    "best-captions": {
      title: `Best ${label} Captions`,
      metaTitle: `Best ${label} Captions | ToolEagle`,
      description: `The best ${label.toLowerCase()} captions for TikTok and Instagram. Copy these examples or generate your own with AI. Scroll-stopping captions that drive engagement.`
    },
    "best-hooks": {
      title: `Best ${label} Hooks`,
      metaTitle: `Best ${label} Hooks | ToolEagle`,
      description: `The best ${label.toLowerCase()} hooks for YouTube and TikTok. Openers that create curiosity in the first few seconds. Generate viral hooks with AI.`
    },
    "caption-ideas": {
      title: `${label} Caption Ideas`,
      metaTitle: `${label} Caption Ideas | ToolEagle`,
      description: `${label} caption ideas for TikTok and Instagram. Get inspiration and generate scroll-stopping captions with AI.`
    },
    "content-ideas": {
      title: `${label} Content Ideas`,
      metaTitle: `${label} Content Ideas | ToolEagle`,
      description: `${label} content ideas for creators. Get inspiration for your next video or post. Generate ideas with AI.`
    },
    "video-ideas": {
      title: `${label} Video Ideas`,
      metaTitle: `${label} Video Ideas | ToolEagle`,
      description: `${label} video ideas for TikTok, YouTube and Instagram. Fresh ideas for your next video. Generate with AI.`
    },
    "post-ideas": {
      title: `${label} Post Ideas`,
      metaTitle: `${label} Post Ideas | ToolEagle`,
      description: `${label} post ideas for Instagram and social media. Carousel, Reel, and feed ideas. Generate with AI.`
    }
  };

  const c = configs[pageType];
  return {
    pageType,
    topic: topicSlug,
    title: c.title,
    metaTitle: c.metaTitle,
    description: c.description,
    toolSlug: tool.slug,
    toolName: tool.name,
    tips: DEFAULT_TIPS[pageType]
  };
}

export function getAllSeoExpansionParams(): { pageType: SeoExpansionPageType; topic: string }[] {
  const topics = getAllTopicSlugs();
  const pageTypes: SeoExpansionPageType[] = [
    "best-captions",
    "best-hooks",
    "caption-ideas",
    "content-ideas",
    "video-ideas",
    "post-ideas"
  ];
  const out: { pageType: SeoExpansionPageType; topic: string }[] = [];
  for (const pageType of pageTypes) {
    for (const topic of topics) {
      out.push({ pageType, topic });
    }
  }
  return out;
}

export function getSeoExpansionSlugsForPageType(
  pageType: SeoExpansionPageType
): { topic: string }[] {
  return getAllTopicSlugs().map((topic) => ({ topic }));
}
