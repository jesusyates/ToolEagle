import { Suspense } from "react";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { HookGeneratorClient } from "./pageClient";
import { ToolStructuredData } from "@/components/seo/ToolStructuredData";
import { ToolPageStandardAsideLead } from "@/components/tools/ToolPageStandardAsideLead";
import { RelatedArticlesCard } from "@/components/tools/RelatedArticlesCard";
import { LearnAiLinkCard } from "@/components/tools/LearnAiLinkCard";
import { ToolContentLinksCard } from "@/components/tools/ToolContentLinksCard";
import { toolSeo } from "@/config/seo";
import { toolToBlogTags } from "@/lib/seo";
import { getToolMetaDescriptionEn } from "@/lib/tool-display";

import { BASE_URL } from "@/config/site";

const slug = "hook-generator";
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

export default function HookGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
        <HookGeneratorClient
          relatedAside={
            <>
              <ToolPageStandardAsideLead toolSlug={slug} />
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
          description={metaDescription}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
