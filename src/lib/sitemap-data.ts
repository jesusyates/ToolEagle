/**
 * Sitemap URL generators - shared across sitemap index and split sitemaps.
 * Supports 50k URLs per sitemap.
 */

import { tools } from "@/config/tools";
import { generators } from "@/config/generators";
import { getSeoPageSlugs } from "@/config/seoPages";
import { getSeoPageParams } from "@/config/seo-pages";
import { getIndexableSeoParams } from "@/config/seo/index";
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
import { getAllSeoExpansionParams } from "@/config/seo-expansion";
import { getAllCaptionStyleParams } from "@/config/caption-styles";
import { getAllGuideParams } from "@/config/traffic-topics";
import { SITE_URL } from "@/config/site";
import { createAdminClient } from "@/lib/supabase/admin";

export const BASE_URL = SITE_URL;

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

const MAX_URLS_PER_SITEMAP = 50000;

export function staticAndToolUrls(): SitemapEntry[] {
  const toolSlugs = tools
    .filter(
      (t) =>
        t.slug in generators ||
        ["tiktok-caption-generator", "hashtag-generator", "hook-generator", "title-generator"].includes(t.slug)
    )
    .map((t) => t.slug);

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
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/zh/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/zh/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/creators`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/community`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/community/prompts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/community/ideas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/community/guides`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/ai-tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/ai-tools-directory`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/examples`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/launch`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/submit-ai-tool`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/creator-invite`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/ai-prompt-improver`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/ai-prompts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/tiktok-caption-generator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/youtube-title-generator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/hook-generator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
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
    { url: `${BASE_URL}/collections`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.75 },
    { url: `${BASE_URL}/topics`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/captions`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/hooks`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/library`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
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
    ...getIndexableSeoParams().map(({ platform, type, topic }) => ({
      url: `${BASE_URL}/${platform}/${type}/${topic}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.75
    })),
    ...toolSlugs.map((slug) => ({
      url: `${BASE_URL}/tools/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}

export function topicUrls(): SitemapEntry[] {
  const now = new Date();
  return [
    ...getAllTopicSlugs().map((slug) => ({
      url: `${BASE_URL}/topics/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...getAllTopicClusterSlugs().map((slug) => ({
      url: `${BASE_URL}/topics/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75
    })),
    ...CAPTION_HOOK_TOPICS.flatMap((topic) => [
      { url: `${BASE_URL}/captions/${topic}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.75 },
      { url: `${BASE_URL}/hooks/${topic}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.75 }
    ]),
    ...getAllCompareSlugs().map((slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...getAllBestContentSlugs().map((slug) => ({
      url: `${BASE_URL}/best/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...getAllExampleCategorySlugs().map((slug) => ({
      url: `${BASE_URL}/examples/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}

export async function exampleUrls(): Promise<SitemapEntry[]> {
  try {
    const supabase = createAdminClient();
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
    return [...baseUrls, ...variationUrls].slice(0, MAX_URLS_PER_SITEMAP);
  } catch {
    return [];
  }
}

const SEO_EXPANSION_PATHS = [
  "best-captions",
  "best-hooks",
  "caption-ideas",
  "content-ideas",
  "video-ideas",
  "post-ideas"
];

export async function promptsUrls(): Promise<SitemapEntry[]> {
  const now = new Date();
  try {
    const supabase = createAdminClient();
    const { data: prompts } = await supabase
      .from("generated_content")
      .select("id, topic, platform")
      .eq("type", "prompt");
    const topicSet = new Set<string>();
    const entries: SitemapEntry[] = [];
    (prompts ?? []).forEach((p) => {
      if (p.topic) topicSet.add(p.topic);
      if (p.platform) topicSet.add(p.platform);
    });
    topicSet.forEach((topic) => {
      entries.push({
        url: `${BASE_URL}/prompts/${topic}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75
      });
    });
    (prompts ?? []).forEach((p) => {
      const topic = p.platform || p.topic;
      if (topic && p.id) {
        entries.push({
          url: `${BASE_URL}/prompts/${topic}/${p.id}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.7
        });
      }
    });
    return entries.slice(0, MAX_URLS_PER_SITEMAP);
  } catch {
    return [];
  }
}

export function ideasUrls(): SitemapEntry[] {
  const now = new Date();
  return [
    ...getSeoPageParams().map(({ category, topic }) => ({
      url: `${BASE_URL}/ideas/${category}/${topic}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75
    })),
    ...getAllTopicSlugs().flatMap((slug) => [
      { url: `${BASE_URL}/ideas/${slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.75 },
      { url: `${BASE_URL}/captions-for/${slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.75 },
      { url: `${BASE_URL}/hooks-for/${slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.75 },
      { url: `${BASE_URL}/hashtags-for/${slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.75 },
      ...SEO_EXPANSION_PATHS.map((path) => ({
        url: `${BASE_URL}/${path}/${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.72
      }))
    ]),
    ...getAllCaptionStyleParams().map(({ topic, style }) => ({
      url: `${BASE_URL}/captions/${topic}/${style}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.72
    }))
  ].slice(0, MAX_URLS_PER_SITEMAP);
}

export async function generatedIdeaDetailUrls(): Promise<SitemapEntry[]> {
  const now = new Date();
  try {
    const supabase = createAdminClient();
    const { data: ideas } = await supabase
      .from("generated_content")
      .select("id, topic")
      .eq("type", "idea");
    return (ideas ?? [])
      .map((p) => ({
        url: `${BASE_URL}/ideas/${p.topic}/${p.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7
      }))
      .slice(0, MAX_URLS_PER_SITEMAP);
  } catch {
    return [];
  }
}

export function libraryUrls(): SitemapEntry[] {
  const now = new Date();
  return getAllLibrarySlugs().map((slug) => ({
    url: `${BASE_URL}/library/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75
  }));
}

export function answerUrls(): SitemapEntry[] {
  const now = new Date();
  return [
    ...getAllAnswerSlugs().map((slug) => ({
      url: `${BASE_URL}/answers/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...getAllLearnAiSlugs().map((slug) => ({
      url: `${BASE_URL}/learn-ai/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}

export async function blogUrls(): Promise<SitemapEntry[]> {
  const programmaticUrls = getAllProgrammaticBlogParams().map(({ topic, platform, type }) => ({
    url: `${BASE_URL}/blog/${getProgrammaticBlogSlug(topic, platform, type)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));
  try {
    const { getAllPosts } = await import("@/lib/blog");
    const posts = await getAllPosts();
    return [
      ...posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.frontmatter.slug}`,
        lastModified: new Date(post.frontmatter.date),
        changeFrequency: "monthly" as const,
        priority: 0.7
      })),
      ...programmaticUrls
    ];
  } catch {
    return programmaticUrls;
  }
}

export function guideUrls(): SitemapEntry[] {
  const now = new Date();
  const params = getAllGuideParams();
  return params.map(({ pageType, topic }) => {
    const basePath = pageType === "how-to" ? "/how-to" : pageType === "ai-prompts" ? "/ai-prompts-for" : pageType === "content-strategy" ? "/content-strategy" : "/viral-examples";
    return {
      url: `${BASE_URL}${basePath}/${topic}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75
    };
  });
}

export async function creatorUrls(): Promise<SitemapEntry[]> {
  try {
    const supabase = createAdminClient();
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

function toXml(entries: SitemapEntry[]): string {
  const urlEntries = entries
    .map(
      (e) =>
        `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastModified.toISOString().split("T")[0]}</lastmod>
    ${e.changeFrequency ? `<changefreq>${e.changeFrequency}</changefreq>` : ""}
    ${e.priority !== undefined ? `<priority>${e.priority}</priority>` : ""}
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export function sitemapToXml(entries: SitemapEntry[]): string {
  return toXml(entries);
}

export function sitemapIndexXml(sitemaps: { loc: string; lastmod?: Date }[]): string {
  const entries = sitemaps
    .map(
      (s) =>
        `  <sitemap>
    <loc>${s.loc}</loc>
    ${s.lastmod ? `<lastmod>${s.lastmod.toISOString().split("T")[0]}</lastmod>` : ""}
  </sitemap>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}
