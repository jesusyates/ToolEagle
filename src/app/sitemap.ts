import type { MetadataRoute } from "next";
import { tools } from "@/config/tools";
import { generators } from "@/config/generators";
import { getAllPosts } from "@/lib/blog";
import { getSeoPageSlugs } from "@/config/seoPages";
import { getSeoPageParams } from "@/config/seo-pages";
import { getAllSeoParams } from "@/config/seo/index";
import { createClient } from "@/lib/supabase/server";
import { BACKLINK_MAGNETS } from "@/config/backlink-magnets";
import { PROMPT_CATEGORIES } from "@/config/prompt-library";
import { getAllLearnAiSlugs } from "@/config/learn-ai";
import { getAllAnswerSlugs } from "@/config/answers";
import { getAllProgrammaticBlogParams, getProgrammaticBlogSlug } from "@/config/programmatic-blog";
import { getAllTrendingSlugs } from "@/config/trending";
import { getAllExampleCategorySlugs } from "@/config/example-categories";
import { getAllCompareSlugs } from "@/config/compare-pages";
import { getAllBestContentSlugs } from "@/config/best-content";
import { getAllTopicSlugs, getAllTopicClusterSlugs } from "@/config/topics";
import { CAPTION_HOOK_TOPICS } from "@/config/caption-hook-topics";
import { getAllLibrarySlugs } from "@/config/library-pages";
import { getVariationSlugs } from "@/lib/example-variations";

const BASE_URL = "https://www.tooleagle.com";
const MAX_URLS_PER_SITEMAP = 5000;

export async function generateSitemaps() {
  const seoV2Params = getAllSeoParams();
  const seoChunks = Math.ceil(seoV2Params.length / MAX_URLS_PER_SITEMAP);
  const ids: { id: string }[] = [
    { id: "static" },
    { id: "tools" },
    { id: "blog" },
    { id: "creators" },
    { id: "examples" },
    ...Array.from({ length: seoChunks }, (_, i) => ({ id: `seo-${i + 1}` }))
  ];
  return ids;
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;

  if (id === "static") {
    return [
      { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
      { url: `${BASE_URL}/creator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.95 },
      { url: `${BASE_URL}/tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
      { url: `${BASE_URL}/tiktok`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/youtube`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/instagram`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/tiktok-tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/youtube-tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/instagram-tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
      { url: `${BASE_URL}/blog/tiktok`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/blog/youtube`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/blog/instagram`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/blog/creator-tips`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/blog/ai-tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/creators`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/ai-tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/ai-tools-directory`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/examples`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/launch`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/submit-ai-tool`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/creator-invite`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/ai-prompt-improver`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/ai-prompts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      ...PROMPT_CATEGORIES.map((c) => ({
        url: `${BASE_URL}/ai-prompts/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      { url: `${BASE_URL}/learn-ai`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/answers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/questions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.85 },
      { url: `${BASE_URL}/trending`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/trending/today`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.85 },
      { url: `${BASE_URL}/trending/week`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.85 },
      ...getAllTrendingSlugs().map((slug) => ({
        url: `${BASE_URL}/trending/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      { url: `${BASE_URL}/weekly-best`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      { url: `${BASE_URL}/creator-share`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/submit`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/topics`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      ...getAllTopicSlugs().map((slug) => ({
        url: `${BASE_URL}/topics/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...getAllTopicClusterSlugs().map((slug) => ({
        url: `${BASE_URL}/topics/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.75
      })),
      { url: `${BASE_URL}/captions`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
      { url: `${BASE_URL}/hooks`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
      { url: `${BASE_URL}/library`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
      ...getAllLibrarySlugs().map((slug) => ({
        url: `${BASE_URL}/library/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.75
      })),
      ...CAPTION_HOOK_TOPICS.flatMap((topic) => [
        { url: `${BASE_URL}/captions/${topic}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.75 },
        { url: `${BASE_URL}/hooks/${topic}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.75 }
      ]),
      { url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      ...getAllCompareSlugs().map((slug) => ({
        url: `${BASE_URL}/compare/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...getAllBestContentSlugs().map((slug) => ({
        url: `${BASE_URL}/best/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...getAllExampleCategorySlugs().map((slug) => ({
        url: `${BASE_URL}/examples/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...getAllAnswerSlugs().map((slug) => ({
        url: `${BASE_URL}/answers/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...getAllLearnAiSlugs().map((slug) => ({
        url: `${BASE_URL}/learn-ai/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      { url: `${BASE_URL}/prompt-playground`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
      ...BACKLINK_MAGNETS.map((m) => ({
        url: `${BASE_URL}/${m.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...getSeoPageSlugs().map((slug) => ({
        url: `${BASE_URL}/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...getSeoPageParams().map(({ category, topic }) => ({
        url: `${BASE_URL}/ideas/${category}/${topic}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.75
      }))
    ];
  }

  if (id === "tools") {
    const toolSlugs = tools
      .filter(
        (t) =>
          t.slug in generators ||
          ["tiktok-caption-generator", "hashtag-generator", "hook-generator", "title-generator"].includes(t.slug)
      )
      .map((t) => t.slug);
    return toolSlugs.map((slug) => ({
      url: `${BASE_URL}/tools/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }));
  }

  if (id === "blog") {
    const posts = await getAllPosts();
    const programmaticUrls = getAllProgrammaticBlogParams().map(({ topic, platform, type }) => ({
      url: `${BASE_URL}/blog/${getProgrammaticBlogSlug(topic, platform, type)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }));
    return [
      ...posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.frontmatter.slug}`,
        lastModified: new Date(post.frontmatter.date),
        changeFrequency: "monthly" as const,
        priority: 0.7
      })),
      ...programmaticUrls
    ];
  }

  if (id === "creators") {
    try {
      const supabase = await createClient();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("username, updated_at")
        .not("username", "is", null);
      return (profiles ?? []).map((p) => ({
        url: `${BASE_URL}/creators/${p.username}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6
      }));
    } catch {
      return [];
    }
  }

  if (id === "examples") {
    try {
      const supabase = await createClient();
      const { data: examples } = await supabase
        .from("public_examples")
        .select("slug, created_at")
        .not("slug", "is", null);
      const baseUrls = (examples ?? []).map((e) => ({
        url: `${BASE_URL}/examples/${e.slug}`,
        lastModified: e.created_at ? new Date(e.created_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7
      }));
      const variationUrls = (examples ?? []).flatMap((e) =>
        getVariationSlugs(e.slug!).map((v) => ({
          url: `${BASE_URL}/examples/${v}`,
          lastModified: e.created_at ? new Date(e.created_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.65
        }))
      );
      return [...baseUrls, ...variationUrls];
    } catch {
      return [];
    }
  }

  if (id.startsWith("seo-")) {
    const chunkIndex = parseInt(id.replace("seo-", ""), 10) - 1;
    const seoV2Params = getAllSeoParams();
    const start = chunkIndex * MAX_URLS_PER_SITEMAP;
    const chunk = seoV2Params.slice(start, start + MAX_URLS_PER_SITEMAP);
    return chunk.map(({ platform, type, topic }) => ({
      url: `${BASE_URL}/${platform}/${type}/${topic}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.75
    }));
  }

  return [];
}
