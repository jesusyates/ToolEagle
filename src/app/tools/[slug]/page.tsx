import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { GenericToolClient } from "@/components/tools/GenericToolClient";
import { ToolStructuredData } from "@/components/seo/ToolStructuredData";
import { RelatedToolsCard } from "@/components/tools/RelatedToolsCard";
import { RelatedArticlesCard } from "@/components/tools/RelatedArticlesCard";
import { LearnAiLinkCard } from "@/components/tools/LearnAiLinkCard";
import { tools } from "@/config/tools";
import { generators } from "@/config/generators";
import { toolSeo } from "@/config/seo";
import { toolToBlogTags } from "@/lib/seo";
import type { Metadata } from "next";

const BASE_URL = "https://www.tooleagle.com";

const STATIC_TOOL_SLUGS = [
  "tiktok-caption-generator",
  "hashtag-generator",
  "hook-generator",
  "title-generator"
];

export async function generateStaticParams() {
  return Object.keys(generators).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool || !generators[slug]) {
    return { title: "Tool not found" };
  }
  const seo = toolSeo[slug] ?? { title: tool.name, description: tool.description };
  const url = `${BASE_URL}/tools/${slug}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: url },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      type: "website",
      siteName: "ToolEagle"
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description
    }
  };
}

export default function DynamicToolPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (STATIC_TOOL_SLUGS.includes(slug)) {
    notFound();
  }

  const tool = tools.find((t) => t.slug === slug);
  const hasGenerator = slug in generators;

  if (!tool || !hasGenerator) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <GenericToolClient
          slug={slug}
            relatedAside={
            <>
              <RelatedToolsCard currentSlug={slug} category={tool.category} />
              <RelatedArticlesCard tags={toolToBlogTags[slug] ?? []} />
              <LearnAiLinkCard />
            </>
          }
        />
        <ToolStructuredData slug={slug} name={tool.name} description={tool.description} />
      </div>
      <SiteFooter />
    </main>
  );
}
