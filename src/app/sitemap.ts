import { MetadataRoute } from "next";
import { tools } from "@/config/tools";
import { generators } from "@/config/generators";
import { getAllPosts } from "@/lib/blog";
import { getSeoPageSlugs } from "@/config/seoPages";
import { getSeoPageParams } from "@/config/seo-pages";
import { getAllSeoParams } from "@/config/seo/index";

const BASE_URL = "https://www.tooleagle.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const toolSlugs = tools
    .filter((t) => t.slug in generators || ["tiktok-caption-generator", "hashtag-generator", "hook-generator", "title-generator"].includes(t.slug))
    .map((t) => t.slug);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/creator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.95 },
    { url: `${BASE_URL}/tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/tiktok`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/youtube`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/instagram`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog/tiktok`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/blog/youtube`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/blog/instagram`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/blog/creator-tips`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/blog/ai-tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 }
  ];

  const toolPages: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: `${BASE_URL}/tools/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  const posts = await getAllPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.frontmatter.slug}`,
    lastModified: new Date(post.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));

  const seoPageSlugs = getSeoPageSlugs();
  const seoPages: MetadataRoute.Sitemap = seoPageSlugs.map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  const programmaticParams = getSeoPageParams();
  const programmaticSeoPages: MetadataRoute.Sitemap = programmaticParams.map(({ category, topic }) => ({
    url: `${BASE_URL}/ideas/${category}/${topic}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75
  }));

  const seoV2Params = getAllSeoParams();
  const seoV2Pages: MetadataRoute.Sitemap = seoV2Params.map(({ platform, type, topic }) => ({
    url: `${BASE_URL}/${platform}/${type}/${topic}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75
  }));

  return [...staticPages, ...toolPages, ...blogPages, ...seoPages, ...programmaticSeoPages, ...seoV2Pages];
}
