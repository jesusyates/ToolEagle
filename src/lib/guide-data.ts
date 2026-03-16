/**
 * v40 Guide page data - fetch examples for topic
 */

import { createClient } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache";

const CAPTION_HOOK_TOOLS = [
  "tiktok-caption-generator",
  "instagram-caption-generator",
  "hook-generator",
  "hashtag-generator",
  "title-generator",
  "youtube-title-generator"
];

export type GuideExample = {
  slug: string;
  tool_name: string;
  result: string;
  creator_username?: string;
};

export async function getExamplesForTopic(topic: string): Promise<GuideExample[]> {
  const cacheKey = `guide:${topic}`;
  const cached = await cacheGet<GuideExample[]>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = await createClient();
    const searchTerm = topic.replace(/-/g, " ");
    const { data } = await supabase
      .from("public_examples")
      .select("slug, tool_name, result, creator_username")
      .in("tool_slug", CAPTION_HOOK_TOOLS)
      .ilike("result", `%${searchTerm}%`)
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    let examples = (data ?? []).map((r) => ({
      slug: r.slug,
      tool_name: r.tool_name,
      result: r.result ?? "",
      creator_username: r.creator_username ?? undefined
    }));

    if (examples.length === 0) {
      const { data: fallback } = await supabase
        .from("public_examples")
        .select("slug, tool_name, result, creator_username")
        .in("tool_slug", CAPTION_HOOK_TOOLS)
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      examples = (fallback ?? []).map((r) => ({
        slug: r.slug,
        tool_name: r.tool_name,
        result: r.result ?? "",
        creator_username: r.creator_username ?? undefined
      }));
    }

    await cacheSet(cacheKey, examples);
    return examples;
  } catch {
    return [];
  }
}
