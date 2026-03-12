import {
  Hash,
  Lightbulb,
  MessageSquareText,
  ScrollText,
  Type,
  Zap
} from "lucide-react";

export type ToolCategory = "Captions" | "Titles" | "Hooks" | "Ideas" | "Scripts";

export type ToolConfig = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  isPopular?: boolean;
};

export const tools: ToolConfig[] = [
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
    category: "Captions",
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

export const toolCategories: ToolCategory[] = [
  "Captions",
  "Hooks",
  "Titles",
  "Ideas",
  "Scripts"
];

