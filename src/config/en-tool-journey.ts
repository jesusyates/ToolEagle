/**
 * V109.5 — English primary tool journey: roles, intros, CTAs, next-step links.
 * Does not change routes; URLs are canonical paths already in use.
 */

export const EN_PRIMARY_TOOL_PATH = "/ai-caption-generator";

export type EnToolJourneySlug =
  | "ai-caption-generator"
  | "tiktok-caption-generator"
  | "hook-generator"
  | "tiktok-script-generator"
  | "tiktok-idea-generator"
  | "hashtag-generator"
  | "youtube-title-generator"
  | "instagram-caption-generator";

export type EnToolJourney = {
  /** Product role for docs / UI hints */
  role: "default" | "quick_single" | "attention" | "structure" | "angles";
  introProblem: string;
  introAudience: string;
  /** Primary generate button (global EN) */
  generateCta: string;
  nextSteps: { href: string; label: string }[];
};

export const EN_TOOL_JOURNEY: Record<EnToolJourneySlug, EnToolJourney> = {
  "ai-caption-generator": {
    role: "default",
    introProblem: "Turn one topic into a full short-form post package you can film or post.",
    introAudience: "Creators who want hook, beats, caption, and tags in one run—not five separate tools.",
    generateCta: "Generate a post package",
    nextSteps: [
      { href: "/tools/hook-generator", label: "Refine the hook only" },
      { href: "/pricing", label: "Need more runs — see pricing" }
    ]
  },
  "tiktok-caption-generator": {
    role: "quick_single",
    introProblem:
      "Turn one idea into a full TikTok package—hook, talking points, caption, CTA, and hashtags—ready to copy block-by-block into the app.",
    introAudience:
      "Short-form creators who want the posting path spelled out: generate, paste into Describe your post, post, check Profile.",
    generateCta: "Start generating now",
    nextSteps: [
      { href: "/tools/hashtag-generator", label: "Step 3: build hashtag sets" }
    ]
  },
  "hook-generator": {
    role: "attention",
    introProblem: "Write scroll-stopping openers when you already know the topic but the first line feels weak.",
    introAudience: "Anyone who needs a stronger first 1–3 seconds before filming or writing the rest.",
    generateCta: "Generate hooks",
    nextSteps: [
      { href: "/tools/tiktok-caption-generator", label: "Step 2: build caption package" }
    ]
  },
  "tiktok-script-generator": {
    role: "structure",
    introProblem: "Outline beats and lines for a short video so you’re not improvising from zero.",
    introAudience: "Creators who want structure before they hit record.",
    generateCta: "Generate script",
    nextSteps: [
      { href: "/tools/hook-generator", label: "Start with a stronger hook" },
      { href: "/tools/tiktok-caption-generator", label: "Get caption + hashtags" }
    ]
  },
  "tiktok-idea-generator": {
    role: "angles",
    introProblem: "Break through topic block with angles you can actually film this week.",
    introAudience: "Creators stuck on what to post next.",
    generateCta: "Generate ideas",
    nextSteps: [
      { href: "/tools/hook-generator", label: "Turn an idea into a hook" },
      { href: "/tools/tiktok-caption-generator", label: "Expand into a full package" }
    ]
  },
  "hashtag-generator": {
    role: "quick_single",
    introProblem: "Finish the posting stack: pair tags with a caption package that matches your hook.",
    introAudience: "Creators who already picked a topic and need distribution-ready text.",
    generateCta: "Generate hashtags",
    nextSteps: [
      { href: "/tools/title-generator", label: "Step 4: finalize title" }
    ]
  },
  "youtube-title-generator": {
    role: "attention",
    introProblem: "Titles are the thumbnail for search and browse—tighten them before you script.",
    introAudience: "YouTube and Shorts creators packaging discovery + retention.",
    generateCta: "Generate titles",
    nextSteps: [
      { href: "/youtube-tools", label: "Start here: YouTube workflow hub" },
      { href: "/tools/viral-hook-generator", label: "Next: intro hook for the open" },
      { href: "/tools/youtube-description-generator", label: "Then: description + keywords" },
      { href: "/pricing", label: "Upgrade when you scale uploads" }
    ]
  },
  "instagram-caption-generator": {
    role: "quick_single",
    introProblem: "Reels and carousels need captions that match intent—then tags and next post.",
    introAudience: "Instagram-first creators building a consistent feed.",
    generateCta: "Generate captions",
    nextSteps: [
      { href: "/instagram-tools", label: "Start here: Instagram workflow hub" },
      { href: "/tools/reel-caption-generator", label: "Next: reel-specific captions" },
      { href: "/tools/instagram-hashtag-generator", label: "Then: hashtag set for reach" },
      { href: "/pricing", label: "Upgrade for more daily runs" }
    ]
  }
};

export function getEnToolJourney(slug: string): EnToolJourney | null {
  if (slug in EN_TOOL_JOURNEY) return EN_TOOL_JOURNEY[slug as EnToolJourneySlug];
  return null;
}
