/**
 * v50 - AI Tool Categories
 * 20+ categories for /ai-tools/category/[slug]
 */

export type AIToolCategorySlug =
  | "video-editing"
  | "image-generation"
  | "audio-editing"
  | "writing"
  | "social-media"
  | "marketing"
  | "productivity"
  | "automation"
  | "ai-chatbots"
  | "design"
  | "coding"
  | "data-analysis"
  | "caption"
  | "hook"
  | "hashtag"
  | "script"
  | "youtube"
  | "tiktok"
  | "editing"
  | "creator"
  | "presentation"
  | "email"
  | "seo"
  | "transcription";

export type AIToolCategoryConfig = {
  slug: AIToolCategorySlug;
  name: string;
  description: string;
};

export const AI_TOOL_CATEGORIES: AIToolCategoryConfig[] = [
  { slug: "video-editing", name: "AI Video Editing", description: "AI-powered video editing tools for creators and marketers." },
  { slug: "image-generation", name: "AI Image Generation", description: "Generate images from text with AI." },
  { slug: "audio-editing", name: "AI Audio Editing", description: "AI tools for podcast and audio production." },
  { slug: "writing", name: "AI Writing", description: "AI writing assistants for content creation." },
  { slug: "social-media", name: "AI Social Media", description: "AI tools for social media management and creation." },
  { slug: "marketing", name: "AI Marketing", description: "AI-powered marketing and content tools." },
  { slug: "productivity", name: "AI Productivity", description: "AI tools to boost productivity and workflow." },
  { slug: "automation", name: "AI Automation", description: "Automate tasks with AI." },
  { slug: "ai-chatbots", name: "AI Chatbots", description: "GPT and conversational AI tools." },
  { slug: "design", name: "AI Design", description: "AI design and graphic tools." },
  { slug: "coding", name: "AI Coding", description: "AI assistants for developers." },
  { slug: "data-analysis", name: "AI Data Analysis", description: "AI for data and analytics." },
  { slug: "caption", name: "AI Caption Tools", description: "Caption generators for TikTok, Instagram, and social media." },
  { slug: "hook", name: "AI Hook Generators", description: "Viral hooks and openers for videos." },
  { slug: "hashtag", name: "AI Hashtag Tools", description: "Hashtag generators and research tools." },
  { slug: "script", name: "AI Script Tools", description: "Video script and outline generators." },
  { slug: "youtube", name: "AI YouTube Tools", description: "Titles, descriptions, thumbnails for YouTube." },
  { slug: "tiktok", name: "AI TikTok Tools", description: "TikTok-specific AI tools." },
  { slug: "editing", name: "AI Editing Tools", description: "AI-powered video and image editing." },
  { slug: "creator", name: "AI Creator Tools", description: "All-in-one tools for content creators." },
  { slug: "presentation", name: "AI Presentation", description: "AI tools for slides and presentations." },
  { slug: "email", name: "AI Email", description: "AI email writing and marketing." },
  { slug: "seo", name: "AI SEO", description: "AI tools for search optimization." },
  { slug: "transcription", name: "AI Transcription", description: "Speech-to-text and transcription AI." }
];

export function getAIToolCategory(slug: string): AIToolCategoryConfig | undefined {
  return AI_TOOL_CATEGORIES.find((c) => c.slug === slug);
}

export function getAllAIToolCategorySlugs(): AIToolCategorySlug[] {
  return AI_TOOL_CATEGORIES.map((c) => c.slug);
}
