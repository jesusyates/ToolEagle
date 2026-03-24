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
  | "tiktok-idea-generator";

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
    introProblem: "Get TikTok-ready packages: hook, talking points, caption, and hashtags from one idea.",
    introAudience: "Short-form creators who mainly post to TikTok, Reels, or Shorts.",
    generateCta: "Generate post packages",
    nextSteps: [
      { href: "/ai-caption-generator", label: "Upgrade to full cross-platform package" },
      { href: "/tools/hook-generator", label: "Polish the hook" }
    ]
  },
  "hook-generator": {
    role: "attention",
    introProblem: "Write scroll-stopping openers when you already know the topic but the first line feels weak.",
    introAudience: "Anyone who needs a stronger first 1–3 seconds before filming or writing the rest.",
    generateCta: "Generate hooks",
    nextSteps: [
      { href: "/tools/tiktok-caption-generator", label: "Build full caption package" },
      { href: "/tools/tiktok-script-generator", label: "Add script beats" }
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
  }
};

export function getEnToolJourney(slug: string): EnToolJourney | null {
  if (slug in EN_TOOL_JOURNEY) return EN_TOOL_JOURNEY[slug as EnToolJourneySlug];
  return null;
}
