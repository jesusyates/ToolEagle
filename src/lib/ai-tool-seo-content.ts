/**
 * v50 - SEO content for AI tool pages
 * 800-1500 words per tool page
 */

import type { AIToolEntry } from "@/config/ai-tools-database";
import { getAIToolCategory } from "@/config/ai-tool-categories";
import { getAIToolsByCategoryFromDatabase } from "@/config/ai-tools-database";

export function getToolOverview(tool: AIToolEntry): string {
  const cat = getAIToolCategory(tool.category);
  const catName = cat?.name ?? tool.category;
  return `${tool.name} is an AI-powered tool in the ${catName} category. ${tool.description} It offers features like ${(tool.features || []).slice(0, 3).join(", ")} and is commonly used for ${(tool.useCases || []).slice(0, 2).join(" and ")}. ${tool.pricing === "free" ? "The tool is free to use, making it accessible for creators and small teams." : tool.pricing === "freemium" ? "The tool offers a free tier with paid upgrades for advanced features." : "The tool is available through a paid subscription."}`;
}

export function getToolAlternatives(tool: AIToolEntry): AIToolEntry[] {
  const sameCategory = getAIToolsByCategoryFromDatabase(tool.category);
  return sameCategory.filter((t) => t.slug !== tool.slug && t.website !== "#").slice(0, 6);
}

export function getToolRelatedTools(tool: AIToolEntry): AIToolEntry[] {
  const sameCategory = getAIToolsByCategoryFromDatabase(tool.category);
  return sameCategory.filter((t) => t.slug !== tool.slug).slice(0, 8);
}
