import { Suspense } from "react";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { HookGeneratorClient } from "./pageClient";
import { ToolStructuredData } from "@/components/seo/ToolStructuredData";
import { RelatedToolsCard } from "@/components/tools/RelatedToolsCard";
import { RelatedArticlesCard } from "@/components/tools/RelatedArticlesCard";
import { LearnAiLinkCard } from "@/components/tools/LearnAiLinkCard";
import { ToolContentLinksCard } from "@/components/tools/ToolContentLinksCard";
import { toolSeo } from "@/config/seo";
import { toolToBlogTags } from "@/lib/seo";

import { BASE_URL } from "@/config/site";

const slug = "hook-generator";
const seo = toolSeo[slug];

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
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
        <HookGeneratorClient
          relatedAside={
            <>
              <RelatedToolsCard currentSlug={slug} category="Hooks" />
              <RelatedArticlesCard tags={toolToBlogTags[slug] ?? []} />
              <LearnAiLinkCard />
              <ToolContentLinksCard toolSlug={slug} />
            </>
          }
        />
        </Suspense>
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
