/**
 * AI Tools for backlink page /ai-tools
 * ToolEagle tools + external tools for comprehensive resource
 */

export const TOOLEAGLE_TOOLS = [
  { name: "TikTok Caption Generator", slug: "tiktok-caption-generator", category: "Captions" },
  { name: "Instagram Caption Generator", slug: "instagram-caption-generator", category: "Captions" },
  { name: "Hook Generator", slug: "hook-generator", category: "Hooks" },
  { name: "Title Generator", slug: "title-generator", category: "Titles" },
  { name: "Hashtag Generator", slug: "hashtag-generator", category: "Hashtags" },
  { name: "TikTok Bio Generator", slug: "tiktok-bio-generator", category: "Bios" },
  { name: "YouTube Title Generator", slug: "youtube-title-generator", category: "Titles" },
  { name: "TikTok Idea Generator", slug: "tiktok-idea-generator", category: "Ideas" },
  { name: "YouTube Script Generator", slug: "youtube-script-generator", category: "Scripts" }
] as const;

export const EXTERNAL_AI_TOOLS = [
  { name: "Jasper", url: "https://www.jasper.ai", description: "AI writing for marketing and content" },
  { name: "Copy.ai", url: "https://www.copy.ai", description: "AI copywriting for ads and social" },
  { name: "Rytr", url: "https://rytr.me", description: "AI writing assistant for multiple formats" },
  { name: "Writesonic", url: "https://writesonic.com", description: "AI content and copywriting" },
  { name: "Descript", url: "https://www.descript.com", description: "AI video editing and transcription" },
  { name: "Canva AI", url: "https://www.canva.com", description: "AI design and templates" },
  { name: "Lumen5", url: "https://lumen5.com", description: "AI video creation from text" },
  { name: "Hootsuite", url: "https://www.hootsuite.com", description: "Social media management with AI" },
  { name: "Buffer", url: "https://buffer.com", description: "Scheduling and AI caption suggestions" },
  { name: "Grammarly", url: "https://www.grammarly.com", description: "AI writing and grammar" }
] as const;
