/**
 * Best content pages - /best/[slug]
 */

export type BestContentConfig = {
  slug: string;
  title: string;
  intro: string;
  toolSlug: string;
  toolName: string;
  examples: string[];
  tips: string[];
  relatedAnswerSlugs: string[];
};

export const BEST_CONTENT_PAGES: BestContentConfig[] = [
  {
    slug: "tiktok-captions",
    title: "Best TikTok Captions",
    intro:
      "The best TikTok captions that get engagement. Copy, adapt, or use as inspiration for your next video. These styles stop the scroll and drive comments.",
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    examples: [
      "POV: You finally understand the assignment 😭✨",
      "Nobody talks about this... Save this for later 📌",
      "Real talk 💀 That's it. That's the post.",
      "Comment if you agree 👇",
      "Tag someone who needs this",
      "No thoughts just vibes 🎵"
    ],
    tips: [
      "Hook in the first line—under 150 chars",
      "Use 1–3 emojis max",
      "Add a CTA: follow, comment, save",
      "Match trending sounds and formats"
    ],
    relatedAnswerSlugs: [
      "how-to-write-tiktok-captions",
      "tiktok-caption-length",
      "tiktok-viral-captions"
    ]
  },
  {
    slug: "youtube-hooks",
    title: "Best YouTube Hooks",
    intro:
      "The best YouTube hooks that keep viewers watching. From Shorts to long-form, these openers create curiosity in the first few seconds.",
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    examples: [
      "What if I told you 90% of creators get this wrong?",
      "Stop scrolling. This changed everything for me.",
      "The one habit that doubled my views in 30 days",
      "Nobody talks about this...",
      "I wish someone told me this sooner"
    ],
    tips: [
      "Hook in 3–5 seconds—no slow intros",
      "Use questions your audience already asks",
      "Bold claims need a payoff—deliver on the promise",
      "Match thumbnail and title"
    ],
    relatedAnswerSlugs: [
      "how-to-write-youtube-hooks",
      "youtube-shorts-hooks",
      "youtube-viral-hooks"
    ]
  },
  {
    slug: "instagram-captions",
    title: "Best Instagram Captions",
    intro:
      "The best Instagram captions for Reels and feed posts. These styles drive saves, comments, and shares. Adapt to your brand voice.",
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    examples: [
      "Monday mood: surviving on caffeine and hope ☕️",
      "This one's for everyone who's ever felt like giving up. You're not alone. 💪",
      "Hot take: the best content doesn't need to be perfect. Just real. ✨",
      "Golden hour hits different",
      "Save this for your next...",
      "Share with someone who needs this"
    ],
    tips: [
      "First line = hook. Make it scroll-stopping",
      "Use line breaks for readability",
      "5–10 niche hashtags in first comment",
      "End with a CTA: save, comment, share"
    ],
    relatedAnswerSlugs: [
      "how-to-write-instagram-captions",
      "instagram-reel-captions",
      "instagram-caption-length"
    ]
  }
];

export function getBestContentPage(slug: string): BestContentConfig | undefined {
  return BEST_CONTENT_PAGES.find((p) => p.slug === slug);
}

export function getAllBestContentSlugs(): string[] {
  return BEST_CONTENT_PAGES.map((p) => p.slug);
}
