/**
 * Related Content Engine - v27
 * Recommends related examples, captions, hooks, answers by topic/keywords/platform
 */

import { createClient } from "@/lib/supabase/server";
import { getAllAnswerSlugs, getAnswerPage } from "@/config/answers";

export type RelatedExample = {
  slug: string;
  toolName: string;
  result: string;
  creatorUsername: string | null;
  href: string;
};

export type RelatedAnswer = {
  slug: string;
  question: string;
  href: string;
};

export async function getRelatedContent(params: {
  topic?: string;
  keywords?: string[];
  platform?: string;
  toolSlug?: string;
  limit?: number;
}): Promise<{
  examples: RelatedExample[];
  answers: RelatedAnswer[];
}> {
  const { topic, keywords = [], platform, toolSlug, limit = 6 } = params;
  const terms = [
    ...(topic ? [topic.replace(/-/g, " ")] : []),
    ...keywords
  ].filter(Boolean);
  if (terms.length === 0) return { examples: [], answers: [] };

  const supabase = await createClient();
  const toolSlugs = platform
    ? platform === "instagram"
      ? ["instagram-caption-generator", "hook-generator"]
      : platform === "youtube"
        ? ["hook-generator", "youtube-hook-generator"]
        : ["tiktok-caption-generator", "hook-generator"]
    : toolSlug
      ? [toolSlug]
      : ["tiktok-caption-generator", "instagram-caption-generator", "hook-generator"];

  const searchTerm = terms[0];
  let query = supabase
    .from("public_examples")
    .select("slug, tool_name, result, creator_username")
    .in("tool_slug", toolSlugs)
    .not("slug", "is", null)
    .ilike("result", `%${searchTerm}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  const { data: examples } = await query;

  const answerSlugs = getAllAnswerSlugs();
  const answers: RelatedAnswer[] = [];
  for (const slug of answerSlugs) {
    if (answers.length >= 3) break;
    const page = getAnswerPage(slug);
    if (!page) continue;
    const matches = terms.some(
      (t) =>
        page.question.toLowerCase().includes(t) ||
        page.shortAnswer.toLowerCase().includes(t)
    );
    if (matches) {
      answers.push({
        slug,
        question: page.question,
        href: `/answers/${slug}`
      });
    }
  }

  return {
    examples: (examples ?? []).map((ex) => ({
      slug: ex.slug!,
      toolName: ex.tool_name,
      result: ex.result,
      creatorUsername: ex.creator_username,
      href: `/examples/${ex.slug}`
    })),
    answers
  };
}
