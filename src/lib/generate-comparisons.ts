/**
 * v51 - Tool Comparison Generator
 * Only compare tools in same category. Max 20,000 comparisons.
 */

import {
  AI_TOOLS_DATABASE,
  getAIToolFromDatabase,
  getAIToolsByCategoryFromDatabase
} from "@/config/ai-tools-database";
import type { AIToolEntry } from "@/config/ai-tools-database";

const MAX_COMPARISONS = 20000;

export type ComparePair = {
  slug: string;
  toolA: string;
  toolB: string;
};

function toCompareSlug(slugA: string, slugB: string): string {
  const [a, b] = [slugA, slugB].sort();
  return `${a}-vs-${b}`;
}

export function getAllComparePairs(): ComparePair[] {
  const seen = new Set<string>();
  const pairs: ComparePair[] = [];

  const categories = [...new Set(AI_TOOLS_DATABASE.map((t) => t.category))];

  for (const cat of categories) {
    const tools = getAIToolsByCategoryFromDatabase(cat);
    for (let i = 0; i < tools.length && pairs.length < MAX_COMPARISONS; i++) {
      for (let j = i + 1; j < tools.length && pairs.length < MAX_COMPARISONS; j++) {
        const slug = toCompareSlug(tools[i].slug, tools[j].slug);
        if (seen.has(slug)) continue;
        seen.add(slug);
        pairs.push({
          slug,
          toolA: tools[i].slug,
          toolB: tools[j].slug
        });
      }
    }
  }

  return pairs.slice(0, MAX_COMPARISONS);
}

export function parseCompareSlug(slug: string): { toolA: string; toolB: string } | null {
  const match = slug.match(/^(.+)-vs-(.+)$/);
  if (!match) return null;
  const [, a, b] = match;
  if (!a || !b) return null;
  return { toolA: a.trim(), toolB: b.trim() };
}

export function getComparePair(slug: string): { toolA: AIToolEntry; toolB: AIToolEntry } | null {
  const parsed = parseCompareSlug(slug);
  if (!parsed) return null;

  const toolA = getAIToolFromDatabase(parsed.toolA);
  const toolB = getAIToolFromDatabase(parsed.toolB);
  if (!toolA || !toolB) return null;
  if (toolA.category !== toolB.category) return null;

  return { toolA, toolB };
}

export function getRelatedComparisons(toolASlug: string, toolBSlug: string, limit = 6): ComparePair[] {
  const all = getAllComparePairs();
  return all.filter(
    (p) =>
      (p.toolA === toolASlug || p.toolB === toolASlug || p.toolA === toolBSlug || p.toolB === toolBSlug) &&
      p.slug !== toCompareSlug(toolASlug, toolBSlug)
  ).slice(0, limit);
}

export function getAllComparePairSlugs(): string[] {
  return getAllComparePairs().map((p) => p.slug);
}
