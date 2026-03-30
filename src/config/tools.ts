import {
  AtSign,
  BarChart3,
  Hash,
  LayoutList,
  Lightbulb,
  ListOrdered,
  MessageSquareText,
  MessagesSquare,
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
  | "Descriptions"
  | "Strategy";

export type ToolConfig = {
  slug: string;
  /** 英文站 / 全局默认展示名 */
  name: string;
  /** 中文站标题；`cnOnly` 工具在中文 UI 优先用此名 */
  nameZh?: string;
  description: string;
  /** 中文站 `ToolCard`（locale=zh）优先展示；英文站仍用 description */
  descriptionZh?: string;
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  isPopular?: boolean;
  /**
   * 仅中国站/抖音场景使用；**不出现在**英文站 `/tools` 聚合与全局工具目录。
   * 路由仍可由中文站直达（如 `/zh/douyin-*`），不删 slug。
   */
  cnOnly?: boolean;
};

export const tools: ToolConfig[] = [
  {
    slug: "creator-analysis",
    name: "Creator Account Analysis",
    description:
      "Paste a few past posts and get a profile read: content mix, strengths, gaps, and what to post next.",
    category: "Strategy",
    icon: BarChart3
  },
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
    slug: "ai-caption-generator",
    name: "AI Caption Generator",
    description:
      "Turn any topic into a full short-form post package: hook, script beats, caption, CTA, hashtags, and strategy.",
    category: "Captions",
    icon: Sparkles,
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
  /** V102.1 — Douyin CN platform tools (listed on China site only; EN /tools excludes `cnOnly`) */
  {
    slug: "douyin-caption-generator",
    name: "Douyin Post Package Generator",
    nameZh: "抖音文案包生成器",
    description:
      "Douyin-focused full post package: hook, script beats, caption, CTA, hashtags for CN creators.",
    descriptionZh:
      "面向抖音的完整发布包：钩子、口播气口、描述区、互动引导与话题标签，贴合国内创作者语境。",
    category: "Captions",
    icon: MessageSquareText,
    cnOnly: true
  },
  {
    slug: "douyin-hook-generator",
    name: "Douyin Hook Generator",
    nameZh: "抖音钩子生成器",
    description: "Stop-scroll openers tuned for Douyin completion and comment patterns.",
    descriptionZh: "停滑开头句式，贴合抖音完播与评论区互动习惯。",
    category: "Hooks",
    icon: Zap,
    cnOnly: true
  },
  {
    slug: "douyin-script-generator",
    name: "Douyin Talking Script Generator",
    nameZh: "抖音口播脚本生成器",
    description: "Talking-script structure for Douyin vertical video and live-style delivery.",
    descriptionZh: "竖屏口播结构：分段、气口与可念全文，适配抖音短视频与直播感表达。",
    category: "Scripts",
    icon: ScrollText,
    cnOnly: true
  },
  /** V105.1 — Douyin growth pipeline */
  {
    slug: "douyin-topic-generator",
    name: "Douyin Topic Ideas Generator",
    nameZh: "抖音选题生成器",
    description: "Batch topic ideas with niche/category and why they work on Douyin.",
    descriptionZh: "按赛道与角度批量产出选题，并说明为何适合在抖音测。",
    category: "Ideas",
    icon: ListOrdered,
    cnOnly: true
  },
  {
    slug: "douyin-comment-cta-generator",
    name: "Douyin Comment & Engagement Generator",
    nameZh: "抖音评论引导生成器",
    description: "Engagement phrases and comment triggers for Douyin replays and DMs.",
    descriptionZh: "高互动评论引导与私信话术，适配回放种草与私信收口。",
    category: "Captions",
    icon: MessagesSquare,
    cnOnly: true
  },
  {
    slug: "douyin-structure-generator",
    name: "Douyin Content Structure Generator",
    nameZh: "抖音内容结构生成器",
    description: "Hook, content flow, and ending CTA skeleton for Douyin shorts.",
    descriptionZh: "开头—中段—结尾的内容流与收口引导骨架，适合抖音短视频节奏。",
    category: "Scripts",
    icon: LayoutList,
    cnOnly: true
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
  // P1 expansion: TikTok
  {
    slug: "tiktok-hook-generator",
    name: "TikTok Hook Generator",
    description: "Create viral hooks for TikTok videos that stop the scroll.",
    category: "Hooks",
    icon: Zap
  },
  {
    slug: "tiktok-comment-reply-generator",
    name: "TikTok Comment Reply Generator",
    description: "Generate engaging replies to TikTok comments.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "tiktok-story-generator",
    name: "TikTok Story Generator",
    description: "Create TikTok story ideas and captions.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "tiktok-trend-caption-generator",
    name: "TikTok Trend Caption Generator",
    description: "Generate captions for trending TikTok sounds and formats.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "tiktok-video-idea-generator",
    name: "TikTok Video Idea Generator",
    description: "Get viral TikTok video ideas for your niche.",
    category: "Ideas",
    icon: Lightbulb
  },
  // P1 expansion: YouTube
  {
    slug: "youtube-shorts-title-generator",
    name: "YouTube Shorts Title Generator",
    description: "Generate titles for YouTube Shorts that get views.",
    category: "Titles",
    icon: Type
  },
  {
    slug: "youtube-thumbnail-text-generator",
    name: "YouTube Thumbnail Text Generator",
    description: "Create punchy text for YouTube thumbnails.",
    category: "Titles",
    icon: Type
  },
  {
    slug: "youtube-hook-generator",
    name: "YouTube Hook Generator",
    description: "Create hooks that grab viewers in the first 5 seconds.",
    category: "Hooks",
    icon: Zap
  },
  // P1 expansion: Instagram
  {
    slug: "instagram-reels-caption-generator",
    name: "Instagram Reels Caption Generator",
    description: "Create captions for Instagram Reels that boost engagement.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "instagram-bio-generator",
    name: "Instagram Bio Generator",
    description: "Create a catchy Instagram bio that attracts followers.",
    category: "Bios",
    icon: User
  },
  {
    slug: "instagram-comment-reply-generator",
    name: "Instagram Comment Reply Generator",
    description: "Generate engaging replies to Instagram comments.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "instagram-story-caption-generator",
    name: "Instagram Story Caption Generator",
    description: "Create captions and text for Instagram Stories.",
    category: "Captions",
    icon: MessageSquareText
  },
  // P1 expansion to 50: additional tools
  {
    slug: "tiktok-transition-generator",
    name: "TikTok Transition Generator",
    description: "Get smooth transition ideas for your TikTok videos.",
    category: "Ideas",
    icon: Video
  },
  {
    slug: "youtube-community-post-generator",
    name: "YouTube Community Post Generator",
    description: "Create engaging YouTube Community tab posts.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "instagram-carousel-caption-generator",
    name: "Instagram Carousel Caption Generator",
    description: "Write captions for Instagram carousel posts.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "tiktok-duet-idea-generator",
    name: "TikTok Duet Idea Generator",
    description: "Get viral TikTok duet and stitch ideas.",
    category: "Ideas",
    icon: Lightbulb
  },
  {
    slug: "youtube-end-screen-generator",
    name: "YouTube End Screen Generator",
    description: "Create end screen CTAs for your YouTube videos.",
    category: "Captions",
    icon: Video
  },
  {
    slug: "instagram-dm-generator",
    name: "Instagram DM Generator",
    description: "Generate Instagram DM templates and icebreakers.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "tiktok-challenge-idea-generator",
    name: "TikTok Challenge Idea Generator",
    description: "Get viral TikTok challenge ideas for your niche.",
    category: "Ideas",
    icon: Lightbulb
  },
  {
    slug: "youtube-playlist-title-generator",
    name: "YouTube Playlist Title Generator",
    description: "Generate titles for YouTube playlists.",
    category: "Titles",
    icon: Type
  },
  {
    slug: "instagram-poll-idea-generator",
    name: "Instagram Poll Idea Generator",
    description: "Get Instagram Story poll and question ideas.",
    category: "Ideas",
    icon: Lightbulb
  },
  {
    slug: "short-form-script-generator",
    name: "Short-Form Script Generator",
    description: "Create scripts for TikTok, Reels and Shorts.",
    category: "Scripts",
    icon: ScrollText
  },
  {
    slug: "viral-caption-generator",
    name: "Viral Caption Generator",
    description: "Generate viral captions for any short-form platform.",
    category: "Captions",
    icon: MessageSquareText
  },
  {
    slug: "reel-hook-generator",
    name: "Reel Hook Generator",
    description: "Create hooks for Instagram Reels that stop the scroll.",
    category: "Hooks",
    icon: Zap
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

/** 英文站 `/tools`、全局目录、Related tools 等：不含 `cnOnly`（抖音系仅中国站露出） */
export const toolsForEnglishSite: ToolConfig[] = tools.filter((t) => !t.cnOnly);

/**
 * Popular tools for discoverability. Update based on tool_generate_ai analytics when available.
 */
export const popularToolSlugs: string[] = [
  "tiktok-caption-generator",
  "ai-caption-generator",
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
  "Descriptions",
  "Strategy"
];

