import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { TitleGeneratorClient } from "./pageClient";
import { ToolStructuredData } from "@/components/seo/ToolStructuredData";
import { RelatedToolsCard } from "@/components/tools/RelatedToolsCard";
import { RelatedArticlesCard } from "@/components/tools/RelatedArticlesCard";
import { LearnAiLinkCard } from "@/components/tools/LearnAiLinkCard";
import { ToolContentLinksCard } from "@/components/tools/ToolContentLinksCard";
import { toolSeo } from "@/config/seo";
import { toolToBlogTags } from "@/lib/seo";
import { getToolMetaDescriptionEn } from "@/lib/tool-display";

import { BASE_URL } from "@/config/site";

const slug = "title-generator";
const seo = toolSeo[slug];
const metaDescription = getToolMetaDescriptionEn(slug) ?? seo.description;

export const metadata = {
  title: seo.title,
  description: metaDescription,
  alternates: { canonical: `${BASE_URL}/tools/${slug}` },
  openGraph: {
    title: seo.title,
    description: metaDescription,
    url: `${BASE_URL}/tools/${slug}`,
    type: "website" as const,
    siteName: "ToolEagle"
  },
  twitter: {
    card: "summary_large_image" as const,
    title: seo.title,
    description: metaDescription
  }
};

export default function TitleGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <TitleGeneratorClient
          relatedAside={
            <>
              <RelatedToolsCard currentSlug={slug} category="Titles" />
              <RelatedArticlesCard tags={toolToBlogTags[slug] ?? []} />
              <LearnAiLinkCard />
              <ToolContentLinksCard toolSlug={slug} />
            </>
          }
        />
        <ToolStructuredData
          slug={slug}
          name="Title Generator"
          description={metaDescription}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
