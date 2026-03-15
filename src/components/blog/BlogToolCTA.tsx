import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { getRecommendedToolSlug } from "@/components/blog/TryToolCard";
import { BLOG_CATEGORY_TOOL } from "@/config/blog-tools";
import { tools } from "@/config/tools";
import { Video } from "lucide-react";
import type { BlogFrontmatter } from "@/lib/blog";

type BlogToolCTAProps = {
  frontmatter: BlogFrontmatter;
};

export function BlogToolCTA({ frontmatter }: BlogToolCTAProps) {
  const cat = frontmatter.category?.toLowerCase();
  const tagPlatform = frontmatter.tags?.find((t) =>
    ["tiktok", "youtube", "instagram"].includes(t.toLowerCase())
  )?.toLowerCase();

  const toolSlug =
    frontmatter.recommendedTools?.[0] ??
    (cat ? BLOG_CATEGORY_TOOL[cat] : undefined) ??
    (tagPlatform ? BLOG_CATEGORY_TOOL[tagPlatform] : undefined) ??
    getRecommendedToolSlug(frontmatter.tags);

  const tool = tools.find((t) => t.slug === toolSlug);
  const Icon = tool?.icon ?? Video;

  return (
    <SeoToolCTA
      toolName={tool?.name ?? "TikTok Caption Generator"}
      toolSlug={toolSlug}
      description={tool?.description ?? "Generate viral captions instantly with AI"}
      icon={<Icon className="h-6 w-6 text-sky-700" />}
      buttonLabel="Generate with AI"
    />
  );
}
