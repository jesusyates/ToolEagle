import {
  AtSign,
  Hash,
  Lightbulb,
  MessageSquareText,
  ScrollText,
  Sparkles,
  Type,
  User,
  Video,
  Zap
} from "lucide-react";

export type ToolCategory =
  | "Captions"
  | "Titles"
  | "Hooks"
  | "Ideas"
  | "Scripts"
  | "Bios"
  | "Usernames"
  | "Hashtags"
  | "Descriptions";

export type ToolConfig = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  isPopular?: boolean;
};

export const tools: ToolConfig[] = [
  // Original 4
  {
    slug: "tiktok-caption-generator",
    name: "TikTok Caption Generator",
    description:
      "Generate scroll-stopping TikTok captions from a simple idea, complete with emojis and hashtags.",
    category: "Captions",
    icon: MessageSquareText,
    isPopular: true
  },
  {
    slug: "hashtag-generator",
    name: "Hashtag Generator",
    description: "Generate niche-friendly hashtags for TikTok, Reels and Shorts.",
    category: "Hashtags",
    icon: Hash,
    isPopular: true
  },
  {
    slug: "hook-generator",
    name: "Hook Generator",
    description: "Generate viral hooks for short-form videos and carousels.",
    category: "Hooks",
    icon: Zap,
    isPopular: true
  },
  {
    slug: "title-generator",
    name: "Title Generator",
    description: "Generate titles for YouTube, TikTok, Reels and Shorts.",
    category: "Titles",
    icon: Type,
    isPopular: true
  },
  // Phase 9: New tools 1–10
  {
    slug: "tiktok-bio-generator",
    name: "TikTok Bio Generator",
    description: "Create a catchy TikTok bio that tells your story and attracts followers.",
    category: "Bios",
    icon: User
  },
  {
    slug: "youtube-title-generator",
    name: "YouTube Title Generator",
    description: "Generate click-worthy YouTube video titles that drive views.",
    category: "Titles",
    icon: Type
  },
  {
    slug: "instagram-caption-generator",
    name: "Instagram Caption Generator",
    description: "Write scroll-stopping Instagram captions with emojis and hashtags.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "youtube-description-generator",
    name: "YouTube Description Generator",
    description: "Generate SEO-friendly YouTube video descriptions.",
    category: "Descriptions",
    icon: ScrollText
  },
  {
    slug: "tiktok-username-generator",
    name: "TikTok Username Generator",
    description: "Find unique TikTok username ideas that match your brand.",
    category: "Usernames",
    icon: AtSign
  },
  {
    slug: "instagram-username-generator",
    name: "Instagram Username Generator",
    description: "Generate memorable Instagram username ideas.",
    category: "Usernames",
    icon: AtSign
  },
  {
    slug: "tiktok-idea-generator",
    name: "TikTok Idea Generator",
    description: "Get viral TikTok content ideas based on your niche.",
    category: "Ideas",
    icon: Lightbulb
  },
  {
    slug: "youtube-video-idea-generator",
    name: "YouTube Video Idea Generator",
    description: "Generate YouTube video ideas that get views and engagement.",
    category: "Ideas",
    icon: Video
  },
  {
    slug: "tiktok-script-generator",
    name: "TikTok Script Generator",
    description: "Create short-form TikTok scripts with hook, beats and CTA.",
    category: "Scripts",
    icon: ScrollText
  },
  {
    slug: "youtube-script-generator",
    name: "YouTube Script Generator",
    description: "Write YouTube video scripts with intro, main points and outro.",
    category: "Scripts",
    icon: ScrollText
  },
  // Phase 9: New tools 11–20
  {
    slug: "viral-hook-generator",
    name: "Viral Hook Generator",
    description: "Generate viral hooks that stop the scroll in 2 seconds.",
    category: "Hooks",
    icon: Zap
  },
  {
    slug: "story-hook-generator",
    name: "Story Hook Generator",
    description: "Create story-style hooks that pull viewers into your content.",
    category: "Hooks",
    icon: Zap
  },
  {
    slug: "clickbait-title-generator",
    name: "Clickbait Title Generator",
    description: "Generate curiosity-driven titles that get clicks.",
    category: "Titles",
    icon: Type
  },
  {
    slug: "ai-video-title-generator",
    name: "AI Video Title Generator",
    description: "Generate titles optimized for AI and algorithm discovery.",
    category: "Titles",
    icon: Sparkles
  },
  {
    slug: "social-media-post-generator",
    name: "Social Media Post Generator",
    description: "Create ready-to-post content for any platform.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "instagram-hashtag-generator",
    name: "Instagram Hashtag Generator",
    description: "Generate niche-specific Instagram hashtags for Reels and posts.",
    category: "Hashtags",
    icon: Hash
  },
  {
    slug: "youtube-tag-generator",
    name: "YouTube Tag Generator",
    description: "Generate SEO tags for YouTube videos.",
    category: "Hashtags",
    icon: Hash
  },
  {
    slug: "tiktok-hashtag-generator",
    name: "TikTok Hashtag Generator",
    description: "Generate trending TikTok hashtags for your niche.",
    category: "Hashtags",
    icon: Hash
  },
  {
    slug: "reel-caption-generator",
    name: "Reel Caption Generator",
    description: "Create captions for Instagram Reels that boost engagement.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "shorts-title-generator",
    name: "Shorts Title Generator",
    description: "Generate titles for YouTube Shorts that get views.",
    category: "Titles",
    icon: Type
  },
  // Legacy placeholders
  {
    slug: "content-idea-bank",
    name: "Content Idea Bank",
    description: "Save, organize and recycle content ideas so you never run out.",
    category: "Ideas",
    icon: Lightbulb
  },
  {
    slug: "script-outline-generator",
    name: "Script Outline Generator",
    description: "Create simple short-form scripts: hook, beats, CTA and captions.",
    category: "Scripts",
    icon: ScrollText
  }
];

/**
 * Popular tools for discoverability. Update based on tool_generate_ai analytics when available.
 */
export const popularToolSlugs: string[] = [
  "tiktok-caption-generator",
  "hashtag-generator",
  "hook-generator",
  "title-generator",
  "youtube-title-generator",
  "instagram-caption-generator"
];

export const toolCategories: ToolCategory[] = [
  "Captions",
  "Titles",
  "Hooks",
  "Ideas",
  "Scripts",
  "Bios",
  "Usernames",
  "Hashtags",
  "Descriptions"
];

