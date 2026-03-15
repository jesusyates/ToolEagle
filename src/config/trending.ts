/**
 * Trending Content Engine - /trending
 */

export type TrendingCategory = {
  slug: string;
  title: string;
  intro: string;
  toolSlug: string;
  toolName: string;
  examples: string[];
  tips: string[];
};

export const TRENDING_CATEGORIES: TrendingCategory[] = [
  {
    slug: "tiktok-captions",
    title: "Trending TikTok Captions",
    intro:
      "Stay ahead with TikTok captions that are working right now. These formats and styles get more engagement—use them as inspiration and adapt to your niche.",
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    examples: [
      "POV: You finally understand the assignment 😭✨",
      "When your coffee hits different ☕️",
      "No thoughts just vibes 🎵 drop a 🔥 if you relate",
      "Nobody talks about this...",
      "Save this for later 📌",
      "The one thing nobody tells you",
      "Real talk 💀",
      "That's it. That's the post.",
      "Comment if you agree",
      "Tag someone who needs this"
    ],
    tips: [
      "Hook in the first line—under 150 chars",
      "Use 1–3 emojis max",
      "Add a CTA: follow, comment, save",
      "Match trending sounds and formats",
      "Test different angles and double down on what works"
    ]
  },
  {
    slug: "instagram-captions",
    title: "Trending Instagram Captions",
    intro:
      "Instagram captions that drive engagement in 2025. From Reels to feed posts, these styles get saves, comments, and shares.",
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    examples: [
      "Monday mood: surviving on caffeine and hope ☕️",
      "This one's for everyone who's ever felt like giving up. You're not alone. 💪",
      "Hot take: the best content doesn't need to be perfect. Just real. ✨",
      "Golden hour hits different",
      "Save this for your next...",
      "Double tap if you agree 👆",
      "Share with someone who needs this",
      "The mistake everyone makes (and how to fix it)"
    ],
    tips: [
      "First line = hook. Make it scroll-stopping",
      "Use line breaks for readability",
      "5–10 niche hashtags in first comment",
      "End with a CTA: save, comment, share",
      "Match your brand voice"
    ]
  },
  {
    slug: "youtube-hooks",
    title: "Trending YouTube Hooks",
    intro:
      "Hooks that keep viewers watching. These openers work for long-form and Shorts—create curiosity or promise value in the first 3 seconds.",
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    examples: [
      "What if I told you 90% of creators get this wrong?",
      "Stop scrolling. This changed everything for me.",
      "The one habit that doubled my views in 30 days",
      "Nobody talks about this...",
      "POV: You just discovered the secret",
      "I wish someone told me this sooner",
      "The algorithm doesn't want you to know this",
      "What if I told you everything you know is wrong?"
    ],
    tips: [
      "Hook in 3–5 seconds—no slow intros",
      "Use questions your audience already asks",
      "Bold claims need a payoff—deliver on the promise",
      "Pattern interrupt: unexpected visual or tone",
      "Match thumbnail and title"
    ]
  }
];

export function getTrendingCategory(slug: string): TrendingCategory | undefined {
  return TRENDING_CATEGORIES.find((c) => c.slug === slug);
}

export function getAllTrendingSlugs(): string[] {
  return TRENDING_CATEGORIES.map((c) => c.slug);
}

export const TRENDING_PERIODS = ["today", "week"] as const;
