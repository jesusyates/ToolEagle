export type SeoPageConfig = {
  slug: string;
  title: string;
  description: string;
  metaDescription: string;
  h1: string;
  intro: string;
  examples: string[];
  toolSlugs: string[];
};

export const seoPages: SeoPageConfig[] = [
  {
    slug: "tiktok-captions",
    title: "TikTok Captions – Free AI Generator",
    description: "Generate engaging TikTok captions with AI. Short, catchy, and optimized for social media.",
    metaDescription: "Free AI TikTok caption generator. Create scroll-stopping captions with emojis and hashtags in seconds.",
    h1: "TikTok Captions",
    intro: "Great TikTok captions hook viewers in the first line, add personality, and include relevant hashtags. Use our AI generator to create multiple options in seconds—then pick the one that fits your voice.",
    examples: [
      "You need to see this 👇",
      "Nobody is talking about this…",
      "POV: your algorithm finally gets you",
      "Save this for later 📌",
      "The one thing nobody tells you about [topic]"
    ],
    toolSlugs: ["tiktok-caption-generator", "tiktok-hashtag-generator", "tiktok-bio-generator"]
  },
  {
    slug: "youtube-titles",
    title: "YouTube Titles – Free AI Generator",
    description: "Generate click-worthy YouTube titles with AI. Curiosity-driven and optimized for search.",
    metaDescription: "Free AI YouTube title generator. Create click-worthy video titles that drive views and engagement.",
    h1: "YouTube Titles",
    intro: "Strong YouTube titles are curiosity-driven, front-load the hook, and stay under 60 characters. Our AI generator creates multiple options so you can A/B test what works for your audience.",
    examples: [
      "I Tried [X] So You Don't Have To",
      "The Truth About [Topic] Nobody Talks About",
      "7 Mistakes Killing Your [Niche]",
      "[Topic] in 10 Minutes: Full Guide",
      "Stop Doing [Wrong] (Do This Instead)"
    ],
    toolSlugs: ["youtube-title-generator", "title-generator", "shorts-title-generator", "youtube-description-generator"]
  },
  {
    slug: "instagram-captions",
    title: "Instagram Captions – Free AI Generator",
    description: "Generate scroll-stopping Instagram captions with AI. Emojis, hashtags, and engagement hooks.",
    metaDescription: "Free AI Instagram caption generator. Create Reel and post captions with emojis and hashtags.",
    h1: "Instagram Captions",
    intro: "Instagram captions should match your feed aesthetic, include a clear call-to-action, and use hashtags that reach your niche. Use our AI to generate multiple options for Reels and posts.",
    examples: [
      "Swipe for the full story 👉",
      "This changed everything ✨",
      "Tag someone who needs to see this",
      "Real talk: [insight]",
      "Vibes only ✨"
    ],
    toolSlugs: ["instagram-caption-generator", "reel-caption-generator", "instagram-hashtag-generator", "social-media-post-generator"]
  }
];

export function getSeoPageBySlug(slug: string): SeoPageConfig | undefined {
  return seoPages.find((p) => p.slug === slug);
}

export function getSeoPageSlugs(): string[] {
  return seoPages.map((p) => p.slug);
}
