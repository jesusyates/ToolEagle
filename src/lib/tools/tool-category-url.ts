import { toolCategories, type ToolCategory } from "@/config/tools";

export function toolCategoryToSegment(category: ToolCategory): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

export function segmentToToolCategory(segment: string): ToolCategory | null {
  const normalized = segment.trim().toLowerCase();
  for (const category of toolCategories) {
    if (toolCategoryToSegment(category) === normalized) return category;
  }
  return null;
}

