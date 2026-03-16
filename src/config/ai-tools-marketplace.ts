/**
 * v32 — AI Tool Marketplace
 * Directory of AI creator tools. Structure supports 1000+ tools.
 */

export type AIToolCategory =
  | "caption"
  | "hook"
  | "hashtag"
  | "script"
  | "youtube"
  | "tiktok"
  | "video"
  | "editing"
  | "marketing"
  | "creator";

export type AIToolEntry = {
  slug: string;
  name: string;
  description: string;
  category: AIToolCategory;
  website?: string;
  pricing?: "free" | "freemium" | "paid" | "enterprise";
  features?: string[];
  pros?: string[];
  cons?: string[];
  isTooleagle?: boolean;
  toolSlug?: string; // ToolEagle internal tool slug
};

export const AI_TOOL_CATEGORIES: { slug: AIToolCategory; name: string; description: string }[] = [
  { slug: "caption", name: "AI Caption Tools", description: "Caption generators for TikTok, Instagram, and social media" },
  { slug: "hook", name: "AI Hook Generators", description: "Viral hooks and openers for videos" },
  { slug: "hashtag", name: "AI Hashtag Tools", description: "Hashtag generators and research tools" },
  { slug: "script", name: "AI Script Tools", description: "Video script and outline generators" },
  { slug: "youtube", name: "AI YouTube Tools", description: "Titles, descriptions, thumbnails for YouTube" },
  { slug: "tiktok", name: "AI TikTok Tools", description: "TikTok-specific AI tools" },
  { slug: "video", name: "AI Video Tools", description: "Video creation and editing AI" },
  { slug: "editing", name: "AI Editing Tools", description: "AI-powered video and image editing" },
  { slug: "marketing", name: "AI Marketing Tools", description: "Social media and content marketing AI" },
  { slug: "creator", name: "AI Creator Tools", description: "All-in-one tools for content creators" }
];

/** ToolEagle tools - internal, link to /tools/[slug] */
const TOOLEAGLE_TOOLS: AIToolEntry[] = [
  { slug: "tooleagle-tiktok-caption", name: "ToolEagle TikTok Caption Generator", description: "Generate scroll-stopping TikTok captions with emojis and hashtags.", category: "caption", pricing: "free", isTooleagle: true, toolSlug: "tiktok-caption-generator", features: ["Emojis", "Hashtags", "Platform-specific"], pros: ["Free", "No sign-up", "Creator examples"], cons: ["TikTok-focused"] },
  { slug: "tooleagle-instagram-caption", name: "ToolEagle Instagram Caption Generator", description: "Write Instagram captions for Reels and feed posts.", category: "caption", pricing: "free", isTooleagle: true, toolSlug: "instagram-caption-generator", features: ["Reels", "Feed", "Hashtags"], pros: ["Free", "Emojis included"], cons: [] },
  { slug: "tooleagle-hook-generator", name: "ToolEagle Hook Generator", description: "Generate viral hooks for short-form videos.", category: "hook", pricing: "free", isTooleagle: true, toolSlug: "hook-generator", features: ["YouTube", "TikTok", "Curiosity"], pros: ["Free", "3-5 second hooks"], cons: [] },
  { slug: "tooleagle-hashtag-generator", name: "ToolEagle Hashtag Generator", description: "Generate niche hashtags for TikTok, Reels and Shorts.", category: "hashtag", pricing: "free", isTooleagle: true, toolSlug: "hashtag-generator", features: ["Niche", "Platform-specific"], pros: ["Free", "No sign-up"], cons: [] },
  { slug: "tooleagle-title-generator", name: "ToolEagle Title Generator", description: "Generate titles for YouTube, TikTok, Reels and Shorts.", category: "youtube", pricing: "free", isTooleagle: true, toolSlug: "title-generator", features: ["Click-worthy", "Multi-platform"], pros: ["Free"], cons: [] },
  { slug: "tooleagle-youtube-title", name: "ToolEagle YouTube Title Generator", description: "Generate click-worthy YouTube video titles.", category: "youtube", pricing: "free", isTooleagle: true, toolSlug: "youtube-title-generator", features: ["SEO", "Curiosity"], pros: ["Free"], cons: [] },
  { slug: "tooleagle-tiktok-script", name: "ToolEagle TikTok Script Generator", description: "Create short-form TikTok scripts with hook and CTA.", category: "script", pricing: "free", isTooleagle: true, toolSlug: "tiktok-script-generator", features: ["Hook", "Beats", "CTA"], pros: ["Free"], cons: [] },
  { slug: "tooleagle-youtube-script", name: "ToolEagle YouTube Script Generator", description: "Write YouTube scripts with intro, main points and outro.", category: "script", pricing: "free", isTooleagle: true, toolSlug: "youtube-script-generator", features: ["Structure", "SEO"], pros: ["Free"], cons: [] }
];

/** External AI tools - link to website */
const EXTERNAL_TOOLS: AIToolEntry[] = [
  { slug: "jasper", name: "Jasper", description: "AI writing for marketing and content. Brand voice, templates, integrations.", category: "creator", website: "https://www.jasper.ai", pricing: "paid", features: ["Brand voice", "Templates", "Integrations"], pros: ["Professional", "Integrations"], cons: ["Paid only", "Overkill for captions"] },
  { slug: "copy-ai", name: "Copy.ai", description: "AI copywriting for ads, social media, and marketing.", category: "marketing", website: "https://www.copy.ai", pricing: "freemium", features: ["Multiple formats", "Templates"], pros: ["Free tier", "Quick drafts"], cons: ["Generic tone"] },
  { slug: "chatgpt", name: "ChatGPT", description: "General-purpose AI. Can generate captions with the right prompts.", category: "creator", website: "https://chat.openai.com", pricing: "freemium", features: ["Flexible", "Conversation"], pros: ["Free tier", "Flexible"], cons: ["No built-in hashtags", "Requires prompt engineering"] },
  { slug: "rytr", name: "Rytr", description: "AI writing assistant for multiple formats.", category: "creator", website: "https://rytr.me", pricing: "freemium", features: ["Tone", "Languages"], pros: ["Affordable", "Multiple formats"], cons: ["Generic output"] },
  { slug: "writesonic", name: "Writesonic", description: "AI content and copywriting for marketing.", category: "marketing", website: "https://writesonic.com", pricing: "freemium", features: ["SEO", "Templates"], pros: ["SEO focus"], cons: ["Paid for full features"] },
  { slug: "descript", name: "Descript", description: "AI video editing, transcription, and overdub.", category: "editing", website: "https://www.descript.com", pricing: "freemium", features: ["Transcription", "Overdub", "Editing"], pros: ["All-in-one", "AI voice"], cons: ["Learning curve"] },
  { slug: "canva", name: "Canva AI", description: "AI design, Magic Write, and templates for creators.", category: "editing", website: "https://www.canva.com", pricing: "freemium", features: ["Templates", "Magic Write", "Design"], pros: ["Easy", "Free tier"], cons: ["Design-focused"] },
  { slug: "lumen5", name: "Lumen5", description: "AI video creation from text and articles.", category: "video", website: "https://lumen5.com", pricing: "freemium", features: ["Text-to-video", "Templates"], pros: ["Quick videos"], cons: ["Limited customization"] },
  { slug: "hootsuite", name: "Hootsuite", description: "Social media management with AI caption suggestions.", category: "marketing", website: "https://www.hootsuite.com", pricing: "paid", features: ["Scheduling", "Analytics", "AI"], pros: ["All-in-one"], cons: ["Paid", "Generic captions"] },
  { slug: "buffer", name: "Buffer", description: "Scheduling and AI caption suggestions.", category: "marketing", website: "https://buffer.com", pricing: "freemium", features: ["Scheduling", "AI suggestions"], pros: ["Simple", "Free tier"], cons: ["Basic AI"] },
  { slug: "grammarly", name: "Grammarly", description: "AI writing, grammar, and tone suggestions.", category: "creator", website: "https://www.grammarly.com", pricing: "freemium", features: ["Grammar", "Tone", "Clarity"], pros: ["Polishing", "Free tier"], cons: ["Not for generation"] },
  { slug: "runway", name: "Runway", description: "AI video generation and editing. Gen-2, Gen-3.", category: "video", website: "https://runwayml.com", pricing: "freemium", features: ["Text-to-video", "Image-to-video", "Editing"], pros: ["Cutting-edge", "Creative"], cons: ["Credits limit"] },
  { slug: "pika", name: "Pika", description: "AI video generation from text and images.", category: "video", website: "https://pika.art", pricing: "freemium", features: ["Text-to-video", "Image-to-video"], pros: ["Creative", "Easy"], cons: ["Newer"] },
  { slug: "capcut", name: "CapCut", description: "Free video editor with AI features, captions, and templates.", category: "editing", website: "https://www.capcut.com", pricing: "free", features: ["Auto-captions", "Templates", "Effects"], pros: ["Free", "Popular"], cons: ["Mobile-first"] },
  { slug: "claude", name: "Claude", description: "Anthropic's AI assistant. Good for writing and brainstorming.", category: "creator", website: "https://claude.ai", pricing: "freemium", features: ["Writing", "Analysis", "Long context"], pros: ["Strong writing", "Free tier"], cons: ["No built-in captions"] }
];

export const AI_TOOLS_MARKETPLACE: AIToolEntry[] = [...TOOLEAGLE_TOOLS, ...EXTERNAL_TOOLS];

export function getAITool(slug: string): AIToolEntry | undefined {
  return AI_TOOLS_MARKETPLACE.find((t) => t.slug === slug);
}

export function getAllAIToolSlugs(): string[] {
  return AI_TOOLS_MARKETPLACE.map((t) => t.slug);
}

export function getAIToolsByCategory(category: AIToolCategory): AIToolEntry[] {
  return AI_TOOLS_MARKETPLACE.filter((t) => t.category === category);
}

export function getAllAIToolCategories(): AIToolCategory[] {
  return AI_TOOL_CATEGORIES.map((c) => c.slug);
}

export function getAIToolCategory(slug: string): (typeof AI_TOOL_CATEGORIES)[0] | undefined {
  return AI_TOOL_CATEGORIES.find((c) => c.slug === slug);
}

/** Best AI tools categories for SEO pages */
export const BEST_AI_TOOLS_CATEGORIES = [
  "caption",
  "hook",
  "hashtag",
  "script",
  "youtube",
  "tiktok",
  "video",
  "editing",
  "marketing",
  "creator"
] as const;
