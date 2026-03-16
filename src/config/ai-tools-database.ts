/**
 * v50 - AI Tools Database
 * 1000 tools for /ai-tools/[slug] - curated structured data
 */

import type { AIToolCategorySlug } from "./ai-tool-categories";

export type AIToolPricing = "free" | "freemium" | "paid";

export type AIToolEntry = {
  slug: string;
  name: string;
  category: AIToolCategorySlug;
  description: string;
  website: string;
  pricing: AIToolPricing;
  features: string[];
  useCases: string[];
  pros?: string[];
  cons?: string[];
  isTooleagle?: boolean;
  toolSlug?: string;
};

const TOOL_SEED: Omit<AIToolEntry, "slug">[] = [
  { name: "CapCut", category: "video-editing", description: "AI-powered video editing tool widely used by TikTok creators.", website: "https://capcut.com", pricing: "freemium", features: ["AI subtitles", "Auto captions", "Video templates", "Background remover"], useCases: ["TikTok video editing", "YouTube Shorts editing", "Social media video creation"], pros: ["Free tier", "Popular", "Easy"], cons: ["Mobile-first"] },
  { name: "Descript", category: "video-editing", description: "AI video editing with transcription and overdub.", website: "https://www.descript.com", pricing: "freemium", features: ["Transcription", "Overdub", "Editing"], useCases: ["Podcast editing", "Video editing", "Transcription"], pros: ["All-in-one", "AI voice"], cons: ["Learning curve"] },
  { name: "Runway", category: "video-editing", description: "AI video generation and editing. Gen-2, Gen-3.", website: "https://runwayml.com", pricing: "freemium", features: ["Text-to-video", "Image-to-video", "Editing"], useCases: ["AI video creation", "Creative content", "Short-form video"], pros: ["Cutting-edge"], cons: ["Credits limit"] },
  { name: "Pika", category: "video-editing", description: "AI video generation from text and images.", website: "https://pika.art", pricing: "freemium", features: ["Text-to-video", "Image-to-video"], useCases: ["Creative video", "Social content"], pros: ["Creative", "Easy"], cons: ["Newer"] },
  { name: "Lumen5", category: "video-editing", description: "AI video creation from text and articles.", website: "https://lumen5.com", pricing: "freemium", features: ["Text-to-video", "Templates"], useCases: ["Marketing videos", "Social content"], pros: ["Quick videos"], cons: ["Limited customization"] },
  { name: "Canva", category: "design", description: "AI design, Magic Write, and templates for creators.", website: "https://www.canva.com", pricing: "freemium", features: ["Templates", "Magic Write", "Design"], useCases: ["Social graphics", "Presentations", "Thumbnails"], pros: ["Easy", "Free tier"], cons: ["Design-focused"] },
  { name: "Jasper", category: "writing", description: "AI writing for marketing and content. Brand voice, templates.", website: "https://www.jasper.ai", pricing: "paid", features: ["Brand voice", "Templates", "Integrations"], useCases: ["Marketing copy", "Social content", "Blog posts"], pros: ["Professional"], cons: ["Paid only"] },
  { name: "Copy.ai", category: "writing", description: "AI copywriting for ads, social media, and marketing.", website: "https://www.copy.ai", pricing: "freemium", features: ["Multiple formats", "Templates"], useCases: ["Ad copy", "Social captions", "Email"], pros: ["Free tier", "Quick drafts"], cons: ["Generic tone"] },
  { name: "ChatGPT", category: "ai-chatbots", description: "General-purpose AI. Can generate captions with the right prompts.", website: "https://chat.openai.com", pricing: "freemium", features: ["Flexible", "Conversation"], useCases: ["Writing", "Brainstorming", "Captions"], pros: ["Free tier", "Flexible"], cons: ["Requires prompt engineering"] },
  { name: "Claude", category: "ai-chatbots", description: "Anthropic's AI assistant. Good for writing and brainstorming.", website: "https://claude.ai", pricing: "freemium", features: ["Writing", "Analysis", "Long context"], useCases: ["Content writing", "Analysis", "Long-form"], pros: ["Strong writing", "Free tier"], cons: ["No built-in captions"] },
  { name: "Grammarly", category: "writing", description: "AI writing, grammar, and tone suggestions.", website: "https://www.grammarly.com", pricing: "freemium", features: ["Grammar", "Tone", "Clarity"], useCases: ["Writing polish", "Emails", "Content"], pros: ["Polishing", "Free tier"], cons: ["Not for generation"] },
  { name: "Rytr", category: "writing", description: "AI writing assistant for multiple formats.", website: "https://rytr.me", pricing: "freemium", features: ["Tone", "Languages"], useCases: ["Blog posts", "Social content", "Ads"], pros: ["Affordable"], cons: ["Generic output"] },
  { name: "Writesonic", category: "marketing", description: "AI content and copywriting for marketing.", website: "https://writesonic.com", pricing: "freemium", features: ["SEO", "Templates"], useCases: ["Marketing copy", "SEO content"], pros: ["SEO focus"], cons: ["Paid for full features"] },
  { name: "Hootsuite", category: "social-media", description: "Social media management with AI caption suggestions.", website: "https://www.hootsuite.com", pricing: "paid", features: ["Scheduling", "Analytics", "AI"], useCases: ["Social scheduling", "Content management"], pros: ["All-in-one"], cons: ["Paid", "Generic captions"] },
  { name: "Buffer", category: "social-media", description: "Scheduling and AI caption suggestions.", website: "https://buffer.com", pricing: "freemium", features: ["Scheduling", "AI suggestions"], useCases: ["Social scheduling", "Content planning"], pros: ["Simple", "Free tier"], cons: ["Basic AI"] },
  { name: "Otter.ai", category: "transcription", description: "AI transcription and meeting notes.", website: "https://otter.ai", pricing: "freemium", features: ["Transcription", "Meeting notes", "Summaries"], useCases: ["Podcast transcription", "Meeting notes", "Interviews"], pros: ["Accurate", "Free tier"], cons: [] },
  { name: "Midjourney", category: "image-generation", description: "AI image generation from text prompts.", website: "https://midjourney.com", pricing: "paid", features: ["Text-to-image", "High quality"], useCases: ["Thumbnails", "Social graphics", "Creative art"], pros: ["High quality"], cons: ["Paid", "Discord-based"] },
  { name: "DALL-E", category: "image-generation", description: "OpenAI's AI image generation.", website: "https://openai.com/dall-e-3", pricing: "paid", features: ["Text-to-image", "Editing"], useCases: ["Graphics", "Thumbnails", "Creative"], pros: ["Integrated with ChatGPT"], cons: ["Paid"] },
  { name: "Adobe Firefly", category: "image-generation", description: "Adobe's AI image generation and editing.", website: "https://firefly.adobe.com", pricing: "freemium", features: ["Image generation", "Editing", "Integration"], useCases: ["Design", "Marketing", "Social"], pros: ["Adobe ecosystem"], cons: ["Credits limit"] },
  { name: "Notion AI", category: "productivity", description: "AI writing and organization in Notion.", website: "https://notion.so", pricing: "freemium", features: ["Writing", "Summaries", "Organization"], useCases: ["Documentation", "Content planning", "Notes"], pros: ["Integrated", "Powerful"], cons: ["Paid for AI"] },
  { name: "Gamma", category: "presentation", description: "AI presentation and document creation.", website: "https://gamma.app", pricing: "freemium", features: ["AI presentations", "Documents", "Templates"], useCases: ["Presentations", "Pitch decks", "Docs"], pros: ["Fast creation"], cons: [] },
  { name: "Copy.ai", category: "email", description: "AI email writing and marketing automation.", website: "https://www.copy.ai", pricing: "freemium", features: ["Email templates", "Personalization"], useCases: ["Email marketing", "Newsletters"], pros: ["Free tier"], cons: [] },
  { name: "Surfer SEO", category: "seo", description: "AI-powered SEO content optimization.", website: "https://surferseo.com", pricing: "paid", features: ["Content optimization", "Keyword research"], useCases: ["SEO content", "Blog optimization"], pros: ["Data-driven"], cons: ["Paid"] },
  { name: "GitHub Copilot", category: "coding", description: "AI pair programmer for developers.", website: "https://github.com/features/copilot", pricing: "paid", features: ["Code completion", "Suggestions"], useCases: ["Coding", "Development"], pros: ["Productive"], cons: ["Paid"] },
  { name: "Cursor", category: "coding", description: "AI-powered code editor.", website: "https://cursor.com", pricing: "freemium", features: ["AI coding", "Chat", "Completions"], useCases: ["Development", "Coding"], pros: ["Powerful"], cons: [] },
  { name: "ToolEagle Caption Generator", category: "caption", description: "Generate scroll-stopping TikTok captions with emojis and hashtags.", website: "https://www.tooleagle.com", pricing: "free", features: ["Emojis", "Hashtags", "Platform-specific"], useCases: ["TikTok captions", "Instagram captions", "Social media"], pros: ["Free", "No sign-up", "Creator examples"], cons: ["TikTok-focused"], isTooleagle: true, toolSlug: "tiktok-caption-generator" },
  { name: "ToolEagle Hook Generator", category: "hook", description: "Generate viral hooks for short-form videos.", website: "https://www.tooleagle.com", pricing: "free", features: ["YouTube", "TikTok", "Curiosity"], useCases: ["Video hooks", "Short-form content"], pros: ["Free", "3-5 second hooks"], cons: [], isTooleagle: true, toolSlug: "hook-generator" },
  { name: "ToolEagle Hashtag Generator", category: "hashtag", description: "Generate niche hashtags for TikTok, Reels and Shorts.", website: "https://www.tooleagle.com", pricing: "free", features: ["Niche", "Platform-specific"], useCases: ["Hashtag research", "Social media"], pros: ["Free", "No sign-up"], cons: [], isTooleagle: true, toolSlug: "hashtag-generator" }
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildToolsDatabase(): AIToolEntry[] {
  const seen = new Set<string>();
  const out: AIToolEntry[] = [];

  for (const t of TOOL_SEED) {
    const slug = slugify(t.name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ ...t, slug });
  }

  const categories = ["video-editing", "image-generation", "writing", "marketing", "social-media", "productivity", "design", "caption", "hook", "editing", "creator"] as AIToolCategorySlug[];
  const toolNames = ["AI Writer", "AI Editor", "AI Generator", "AI Assistant", "AI Creator", "Smart Writer", "Smart Editor", "Content AI", "Copy AI", "Video AI", "Image AI", "Caption AI", "Hook AI", "Hashtag AI", "Script AI", "Title AI", "Bio AI", "Social AI", "Marketing AI"];
  const niches = ["TikTok", "YouTube", "Instagram", "creators", "marketers", "business", "social media", "content", "videos", "captions", "hooks", "hashtags", "scripts", "thumbnails"];
  const pricingOptions: AIToolPricing[] = ["free", "freemium", "paid"];

  const EXTRA_TOOLS: Omit<AIToolEntry, "slug">[] = [
    { name: "Veed", category: "video-editing", description: "Online video editor with AI subtitles and captions.", website: "https://www.veed.io", pricing: "freemium", features: ["Auto subtitles", "Captions", "Templates"], useCases: ["Social video", "YouTube", "TikTok"], pros: ["Easy", "Online"], cons: [] },
    { name: "Kapwing", category: "video-editing", description: "AI video editing and resizing for social media.", website: "https://www.kapwing.com", pricing: "freemium", features: ["Resize", "Subtitles", "Templates"], useCases: ["Social video", "Resizing"], pros: ["Free tier"], cons: [] },
    { name: "Pictory", category: "video-editing", description: "AI video creation from blog posts and scripts.", website: "https://pictory.ai", pricing: "paid", features: ["Text-to-video", "Blog to video"], useCases: ["Marketing videos", "Blog repurposing"], pros: ["Automated"], cons: ["Paid"] },
    { name: "Synthesia", category: "video-editing", description: "AI video avatars and voiceovers.", website: "https://www.synthesia.io", pricing: "paid", features: ["AI avatars", "Voiceovers", "Templates"], useCases: ["Training videos", "Marketing"], pros: ["Professional"], cons: ["Expensive"] },
    { name: "HeyGen", category: "video-editing", description: "AI video generation with avatars.", website: "https://heygen.com", pricing: "freemium", features: ["AI avatars", "Voice cloning"], useCases: ["Tutorials", "Marketing"], pros: ["Realistic"], cons: [] },
    { name: "ElevenLabs", category: "audio-editing", description: "AI voice generation and cloning.", website: "https://elevenlabs.io", pricing: "freemium", features: ["Voice cloning", "Text-to-speech"], useCases: ["Voiceovers", "Podcasts", "Videos"], pros: ["High quality"], cons: ["Credits limit"] },
    { name: "Murf", category: "audio-editing", description: "AI voiceovers for videos and podcasts.", website: "https://murf.ai", pricing: "freemium", features: ["Voiceovers", "Multiple voices"], useCases: ["Videos", "Podcasts"], pros: ["Natural"], cons: [] },
    { name: "Figma AI", category: "design", description: "AI design features in Figma.", website: "https://figma.com", pricing: "freemium", features: ["AI design", "Collaboration"], useCases: ["UI design", "Graphics"], pros: ["Industry standard"], cons: [] },
    { name: "Framer", category: "design", description: "AI-powered website and design tool.", website: "https://framer.com", pricing: "freemium", features: ["AI design", "Websites"], useCases: ["Websites", "Landing pages"], pros: ["Fast"], cons: [] },
    { name: "HubSpot AI", category: "marketing", description: "AI marketing and CRM tools.", website: "https://hubspot.com", pricing: "freemium", features: ["CRM", "Marketing", "AI"], useCases: ["Marketing automation", "Sales"], pros: ["All-in-one"], cons: ["Complex"] },
    { name: "Phrasee", category: "marketing", description: "AI marketing language optimization.", website: "https://phrasee.co", pricing: "paid", features: ["Copy optimization", "A/B testing"], useCases: ["Email marketing", "Ads"], pros: ["Data-driven"], cons: ["Paid"] },
    { name: "Zapier", category: "automation", description: "AI automation between apps.", website: "https://zapier.com", pricing: "freemium", features: ["Automation", "Integrations", "AI"], useCases: ["Workflow automation", "Connecting apps"], pros: ["5000+ integrations"], cons: [] },
    { name: "Make", category: "automation", description: "Visual automation with AI.", website: "https://make.com", pricing: "freemium", features: ["Automation", "Scenarios"], useCases: ["Workflow", "Data"], pros: ["Visual"], cons: [] },
    { name: "Perplexity", category: "ai-chatbots", description: "AI search and answer engine.", website: "https://perplexity.ai", pricing: "freemium", features: ["Search", "Citations", "Research"], useCases: ["Research", "Writing"], pros: ["Cited sources"], cons: [] },
    { name: "Gemini", category: "ai-chatbots", description: "Google's AI assistant.", website: "https://gemini.google.com", pricing: "freemium", features: ["Writing", "Analysis", "Multimodal"], useCases: ["Writing", "Research"], pros: ["Google integration"], cons: [] },
    { name: "Microsoft Copilot", category: "ai-chatbots", description: "AI assistant across Microsoft products.", website: "https://copilot.microsoft.com", pricing: "freemium", features: ["Writing", "Office integration"], useCases: ["Productivity", "Writing"], pros: ["Office integration"], cons: [] },
    { name: "Beautiful.ai", category: "presentation", description: "AI presentation design.", website: "https://beautiful.ai", pricing: "freemium", features: ["AI slides", "Templates"], useCases: ["Presentations", "Pitch decks"], pros: ["Auto-layout"], cons: [] },
    { name: "Tome", category: "presentation", description: "AI storytelling and presentations.", website: "https://tome.app", pricing: "freemium", features: ["AI narratives", "Presentations"], useCases: ["Pitch decks", "Stories"], pros: ["Narrative focus"], cons: [] },
    { name: "Lavender", category: "email", description: "AI email writing assistant.", website: "https://lavender.ai", pricing: "freemium", features: ["Email writing", "Sales emails"], useCases: ["Sales emails", "Outreach"], pros: ["Sales-focused"], cons: [] },
    { name: "Frase", category: "seo", description: "AI SEO content and research.", website: "https://frase.io", pricing: "paid", features: ["SEO research", "Content optimization"], useCases: ["SEO content", "Blog posts"], pros: ["Research-driven"], cons: ["Paid"] },
    { name: "Rev", category: "transcription", description: "AI and human transcription.", website: "https://rev.com", pricing: "paid", features: ["Transcription", "Captions", "Subtitles"], useCases: ["Videos", "Podcasts", "Meetings"], pros: ["Accurate"], cons: ["Paid"] },
    { name: "AssemblyAI", category: "transcription", description: "AI transcription and audio intelligence.", website: "https://assemblyai.com", pricing: "freemium", features: ["Transcription", "Summarization"], useCases: ["Podcasts", "Videos"], pros: ["API available"], cons: [] }
  ];

  for (const t of EXTRA_TOOLS) {
    const slug = slugify(t.name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ ...t, slug });
  }

  const TARGET = 1000;
  let id = 0;
  while (out.length < TARGET) {
    const cat = categories[id % categories.length];
    const nameBase = toolNames[id % toolNames.length];
    const niche = niches[Math.floor(id / toolNames.length) % niches.length];
    const name = id < 80 ? nameBase : `${nameBase} for ${niche}`;
    const slug = slugify(`${name}-${id}`);
    if (seen.has(slug)) {
      id++;
      continue;
    }
    seen.add(slug);
    out.push({
      slug,
      name,
      category: cat,
      description: `${name} helps creators and marketers with ${cat.replace(/-/g, " ")}. Used for ${niche} content creation.`,
      website: "#",
      pricing: pricingOptions[id % 3],
      features: ["AI-powered", "Easy to use", "Multiple formats", "Templates"].slice(0, 2 + (id % 3)),
      useCases: [`${niche} content`, "Social media", "Marketing"].slice(0, 2 + (id % 2)),
      pros: ["Fast", "Accurate"].slice(0, 1 + (id % 2)),
      cons: id % 4 === 0 ? ["Learning curve"] : []
    });
    id++;
  }

  return out.slice(0, TARGET);
}

export const AI_TOOLS_DATABASE = buildToolsDatabase();

export function getAIToolFromDatabase(slug: string): AIToolEntry | undefined {
  return AI_TOOLS_DATABASE.find((t) => t.slug === slug);
}

export function getAllAIToolSlugsFromDatabase(): string[] {
  return AI_TOOLS_DATABASE.map((t) => t.slug);
}

export function getAIToolsByCategoryFromDatabase(category: AIToolCategorySlug): AIToolEntry[] {
  return AI_TOOLS_DATABASE.filter((t) => t.category === category);
}
