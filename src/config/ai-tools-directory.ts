/**
 * AI Tools Directory - categories for /ai-tools-directory
 * ToolEagle tools featured first. Structure supports adding external tools for backlinks.
 */

export const AI_DIRECTORY_CATEGORIES = [
  { id: "video", name: "Video", description: "AI tools for video content: captions, hooks, titles, scripts" },
  { id: "writing", name: "Writing", description: "AI writing tools for captions, scripts and descriptions" },
  { id: "design", name: "Design", description: "AI tools for thumbnails, visuals and creative assets" },
  { id: "marketing", name: "Marketing", description: "AI tools for hashtags, bios, usernames and promotion" }
] as const;

/** Map ToolEagle category to directory category */
export const TOOL_CATEGORY_TO_DIRECTORY: Record<string, string> = {
  Captions: "video",
  Titles: "video",
  Hooks: "video",
  Scripts: "video",
  Ideas: "video",
  Descriptions: "writing",
  Hashtags: "marketing",
  Bios: "marketing",
  Usernames: "marketing"
};

/** Slug overrides for design category (thumbnail, etc.) */
export const DESIGN_TOOL_SLUGS = ["youtube-thumbnail-text-generator"];
