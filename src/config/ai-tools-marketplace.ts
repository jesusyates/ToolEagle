/**
 * v32/v50 — AI Tool Marketplace
 * v50: Uses ai-tools-database (1000 tools) and ai-tool-categories (24 categories)
 */

import {
  AI_TOOLS_DATABASE,
  getAIToolFromDatabase,
  getAllAIToolSlugsFromDatabase,
  getAIToolsByCategoryFromDatabase,
  type AIToolEntry as DatabaseEntry
} from "./ai-tools-database";
import {
  AI_TOOL_CATEGORIES,
  getAIToolCategory as getCategory,
  getAllAIToolCategorySlugs,
  type AIToolCategorySlug
} from "./ai-tool-categories";

export type AIToolCategory = AIToolCategorySlug;

export type AIToolEntry = DatabaseEntry & {
  pricing?: "free" | "freemium" | "paid" | "enterprise";
};

export const AI_TOOLS_MARKETPLACE: AIToolEntry[] = AI_TOOLS_DATABASE.map((t) => ({
  ...t,
  pricing: t.pricing === "freemium" ? "freemium" : t.pricing === "paid" ? "paid" : "free"
}));

export { AI_TOOL_CATEGORIES };

export function getAITool(slug: string): AIToolEntry | undefined {
  const t = getAIToolFromDatabase(slug);
  return t ? { ...t, pricing: t.pricing } : undefined;
}

export function getAllAIToolSlugs(): string[] {
  return getAllAIToolSlugsFromDatabase();
}

export function getAIToolsByCategory(category: AIToolCategory): AIToolEntry[] {
  return getAIToolsByCategoryFromDatabase(category);
}

export const getAIToolCategory = getCategory;

export function getAllAIToolCategories(): AIToolCategory[] {
  return getAllAIToolCategorySlugs();
}

/** Best AI tools categories for /best-ai-tools/[slug] */
export const BEST_AI_TOOLS_CATEGORIES = [
  "caption",
  "hook",
  "hashtag",
  "script",
  "youtube",
  "tiktok",
  "video-editing",
  "editing",
  "marketing",
  "creator"
] as const;
