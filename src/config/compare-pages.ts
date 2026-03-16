/**
 * Compare pages - /compare/[slug]
 */

export type CompareTool = {
  name: string;
  slug?: string;
  pros: string[];
  cons: string[];
  bestFor?: string;
};

export type ComparePageConfig = {
  slug: string;
  title: string;
  intro: string;
  tools: CompareTool[];
  examples: string[];
  ctaToolSlug: string;
  ctaToolName: string;
};

export const COMPARE_PAGES: ComparePageConfig[] = [
  {
    slug: "best-ai-caption-generator",
    title: "Best AI Caption Generator",
    intro:
      "We compared the top AI caption generators for creators. Here's how ToolEagle stacks up against alternatives for TikTok, Instagram, and YouTube captions.",
    tools: [
      {
        name: "ToolEagle",
        slug: "tiktok-caption-generator",
        pros: [
          "Built for creators—TikTok, Instagram, YouTube",
          "Free, no sign-up for basic use",
          "Emojis and hashtags included",
          "Real creator examples to inspire"
        ],
        cons: ["Newer than some alternatives"],
        bestFor: "Creators who want platform-specific captions fast"
      },
      {
        name: "Jasper",
        pros: ["Brand voice", "Templates", "Integrations"],
        cons: ["Paid only", "Generic output", "Overkill for short captions"],
        bestFor: "Marketing teams with budget"
      },
      {
        name: "Copy.ai",
        pros: ["Free tier", "Multiple formats"],
        cons: ["Generic tone", "Less creator-focused", "Captions feel corporate"],
        bestFor: "Quick drafts"
      },
      {
        name: "ChatGPT",
        pros: ["Flexible", "Free tier"],
        cons: ["No built-in hashtags", "Requires prompt engineering", "Not optimized for captions"],
        bestFor: "Custom one-off requests"
      }
    ],
    examples: [
      "POV: You finally understand the assignment 😭✨ #fyp #viral",
      "Nobody talks about this... Save this for later 📌",
      "Real talk 💀 That's it. That's the post."
    ],
    ctaToolSlug: "tiktok-caption-generator",
    ctaToolName: "TikTok Caption Generator"
  },
  {
    slug: "tooleagle-vs-chatgpt",
    title: "ToolEagle vs ChatGPT for Captions",
    intro:
      "Both can generate captions. Here's the difference: ToolEagle is built specifically for creator content—captions, hooks, hashtags—with zero prompt engineering.",
    tools: [
      {
        name: "ToolEagle",
        slug: "tiktok-caption-generator",
        pros: [
          "One-click caption generation",
          "Emojis and hashtags included automatically",
          "Platform-specific (TikTok, Instagram, YouTube)",
          "No prompt setup—just describe your video",
          "Free with creator examples"
        ],
        cons: ["Focused on creator content only"],
        bestFor: "Creators who want captions in seconds"
      },
      {
        name: "ChatGPT",
        pros: ["Flexible for any task", "Free tier", "Conversation memory"],
        cons: [
          "You must write prompts for captions",
          "No built-in hashtags or emojis",
          "Generic output without specific instructions",
          "Copy-paste workflow"
        ],
        bestFor: "Custom or one-off content"
      }
    ],
    examples: [
      "When your coffee hits different ☕️ #morningvibes",
      "The one thing nobody tells you about [topic]",
      "Comment if you agree 👇"
    ],
    ctaToolSlug: "tiktok-caption-generator",
    ctaToolName: "TikTok Caption Generator"
  },
  {
    slug: "chatgpt-vs-jasper",
    title: "ChatGPT vs Jasper for Creators",
    intro:
      "Both are powerful AI writing tools. Here's how they compare for caption generation, hooks, and creator content.",
    tools: [
      {
        name: "ChatGPT",
        pros: ["Free tier", "Flexible", "Conversation memory"],
        cons: ["Requires prompt engineering", "No built-in hashtags", "Generic without instructions"],
        bestFor: "Custom one-off content"
      },
      {
        name: "Jasper",
        pros: ["Brand voice", "Templates", "Marketing focus"],
        cons: ["Paid only", "Overkill for short captions"],
        bestFor: "Marketing teams with budget"
      }
    ],
    examples: [
      "POV: You finally understand the assignment 😭✨",
      "Nobody talks about this... Save this for later 📌"
    ],
    ctaToolSlug: "tiktok-caption-generator",
    ctaToolName: "TikTok Caption Generator"
  },
  {
    slug: "runway-vs-pika",
    title: "Runway vs Pika for AI Video",
    intro:
      "Two leading AI video generators. Compare features, pricing, and which is best for creator content.",
    tools: [
      {
        name: "Runway",
        pros: ["Gen-2, Gen-3", "Professional", "Editing tools"],
        cons: ["Credits limit", "Paid for full access"],
        bestFor: "Professional creators"
      },
      {
        name: "Pika",
        pros: ["Creative", "Easy to use", "Growing features"],
        cons: ["Newer", "Less established"],
        bestFor: "Quick AI video experiments"
      }
    ],
    examples: [
      "Text-to-video in seconds",
      "Image-to-video animation"
    ],
    ctaToolSlug: "hook-generator",
    ctaToolName: "Hook Generator"
  },
  {
    slug: "best-tiktok-caption-generator",
    title: "Best TikTok Caption Generator",
    intro:
      "The best TikTok caption generators help you stop the scroll. We compared options for creators who need captions that get engagement.",
    tools: [
      {
        name: "ToolEagle TikTok Caption Generator",
        slug: "tiktok-caption-generator",
        pros: [
          "TikTok-native format and length",
          "Emojis and hashtags in every result",
          "Free, no sign-up required",
          "Creator examples for inspiration"
        ],
        cons: ["TikTok-focused (use Hook Generator for other platforms)"],
        bestFor: "TikTok creators who post regularly"
      },
      {
        name: "Hootsuite",
        pros: ["Scheduling", "Analytics"],
        cons: ["Paid", "Captions are secondary", "Generic output"],
        bestFor: "Teams managing multiple accounts"
      },
      {
        name: "Lately",
        pros: ["AI repurposing"],
        cons: ["Enterprise pricing", "Not caption-first"],
        bestFor: "Large content teams"
      }
    ],
    examples: [
      "No thoughts just vibes 🎵 drop a 🔥 if you relate",
      "Tag someone who needs this",
      "Save this for later 📌"
    ],
    ctaToolSlug: "tiktok-caption-generator",
    ctaToolName: "TikTok Caption Generator"
  }
];

export function getComparePage(slug: string): ComparePageConfig | undefined {
  return COMPARE_PAGES.find((p) => p.slug === slug);
}

export function getAllCompareSlugs(): string[] {
  return COMPARE_PAGES.map((p) => p.slug);
}
