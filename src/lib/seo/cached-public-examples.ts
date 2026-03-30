/**
 * V171.2 — Dedupe Supabase reads for SEO pages (generateMetadata + page body).
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

const CAPTION_TOOLS = ["tiktok-caption-generator", "instagram-caption-generator"];
const HOOK_TOOLS = ["hook-generator", "youtube-hook-generator"];
const HASHTAG_TOOLS = ["hashtag-generator", "tiktok-hashtag-generator", "instagram-hashtag-generator"];

async function fetchExamplesForTools(term: string, toolSlugs: string[]) {
  const supabase = await createClient();
  const { data: examples } = await supabase
    .from("public_examples")
    .select("slug, tool_name, result, creator_username")
    .in("tool_slug", toolSlugs)
    .ilike("result", `%${term}%`)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(12);

  if ((examples?.length ?? 0) > 0) return examples ?? [];

  const { data: fallback } = await supabase
    .from("public_examples")
    .select("slug, tool_name, result, creator_username")
    .in("tool_slug", toolSlugs)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(12);

  return fallback ?? [];
}

export const getCachedCaptionForExamples = cache((topic: string) =>
  fetchExamplesForTools(topic.replace(/-/g, " "), CAPTION_TOOLS)
);

export const getCachedHookForExamples = cache((topic: string) =>
  fetchExamplesForTools(topic.replace(/-/g, " "), HOOK_TOOLS)
);

export const getCachedHashtagForExamples = cache((topic: string) =>
  fetchExamplesForTools(topic.replace(/-/g, " "), HASHTAG_TOOLS)
);

export const getCachedExpansionExamples = cache(async (term: string, pageType: string) => {
  const toolSlugs =
    pageType === "best-captions" || pageType === "caption-ideas"
      ? CAPTION_TOOLS
      : HOOK_TOOLS;
  return fetchExamplesForTools(term.replace(/-/g, " "), toolSlugs);
});
