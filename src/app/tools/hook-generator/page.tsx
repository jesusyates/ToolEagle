import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { HookGeneratorClient } from "./pageClient";
import { ToolStructuredData } from "@/components/seo/ToolStructuredData";
import { RelatedToolsCard } from "@/components/tools/RelatedToolsCard";
import { RelatedArticlesCard } from "@/components/tools/RelatedArticlesCard";
import { LearnAiLinkCard } from "@/components/tools/LearnAiLinkCard";
import { toolSeo } from "@/config/seo";
import { toolToBlogTags } from "@/lib/seo";

const slug = "hook-generator";
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

export default function HookGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <HookGeneratorClient
          relatedAside={
            <>
              <RelatedToolsCard currentSlug={slug} category="Hooks" />
              <RelatedArticlesCard tags={toolToBlogTags[slug] ?? []} />
              <LearnAiLinkCard />
            </>
          }
        />
        <ToolStructuredData
          slug={slug}
          name="Hook Generator"
          description={seo.description}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
