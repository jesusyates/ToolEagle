import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { TitleGeneratorClient } from "./pageClient";
import { ToolStructuredData } from "@/components/seo/ToolStructuredData";
import { RelatedToolsCard } from "@/components/tools/RelatedToolsCard";
import { RelatedArticlesCard } from "@/components/tools/RelatedArticlesCard";
import { toolSeo } from "@/config/seo";
import { toolToBlogTags } from "@/lib/seo";

const slug = "title-generator";
const seo = toolSeo[slug];
const BASE_URL = "https://www.tooleagle.com";

export const metadata = {
  title: seo.title,
  description: seo.description,
  alternates: { canonical: `${BASE_URL}/tools/${slug}` },
  openGraph: {
    title: seo.title,
    description: seo.description,
    url: `${BASE_URL}/tools/${slug}`,
    type: "website" as const,
    siteName: "ToolEagle"
  },
  twitter: {
    card: "summary_large_image" as const,
    title: seo.title,
    description: seo.description
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
            </>
          }
        />
        <ToolStructuredData
          slug={slug}
          name="Title Generator"
          description={seo.description}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
