import { Suspense } from "react";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PostPackageToolClient } from "@/components/tools/PostPackageToolClient";
import { ToolStructuredData } from "@/components/seo/ToolStructuredData";
import { RelatedToolsCard } from "@/components/tools/RelatedToolsCard";
import { RelatedArticlesCard } from "@/components/tools/RelatedArticlesCard";
import { LearnAiLinkCard } from "@/components/tools/LearnAiLinkCard";
import { toolSeo } from "@/config/seo";
import { toolToBlogTags } from "@/lib/seo";
import { BASE_URL } from "@/config/site";
import { getToolPageCopyEn } from "@/config/tool-page-copy-en";
import { getToolMetaDescriptionEn } from "@/lib/tool-display";

const slug = "ai-caption-generator";
const AI_CAPTION_COPY = getToolPageCopyEn(slug)!;
const seo = toolSeo[slug];
const metaDescription = getToolMetaDescriptionEn(slug) ?? seo.description;

export const metadata = {
  title: seo.title,
  description: metaDescription,
  alternates: { canonical: `${BASE_URL}/${slug}` },
  openGraph: {
    title: seo.title,
    description: metaDescription,
    url: `${BASE_URL}/${slug}`,
    type: "website" as const,
    siteName: "ToolEagle"
  },
  twitter: {
    card: "summary_large_image" as const,
    title: seo.title,
    description: metaDescription
  }
};

export default function AiCaptionGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <PostPackageToolClient
            toolSlug={slug}
            toolKind="ai_caption"
            eyebrow="V95 · Cross-platform"
            title="AI Caption Generator"
            description={AI_CAPTION_COPY.hero}
            introProblem={AI_CAPTION_COPY.steps}
            introAudience=""
            tryExample="Launching a new Notion template for creators who batch content weekly"
            inputLabel="Topic or offer"
            placeholder="What are you posting about? (product, story, tip, or trend)"
            generateButtonLabel="Generate a post package"
            resultTitle="Your AI post packages"
            emptyMessage="Add your topic to get structured packages — ready to adapt for TikTok, Reels, or Shorts."
            howItWorksSteps={[
              { step: 1, text: "Describe what you're promoting or teaching in plain language." },
              { step: 2, text: "Generate structured packages with hooks, beats, and CTAs." },
              { step: 3, text: "Copy into your platform, add your voice, and publish." }
            ]}
            proTips={[
              "Mention your audience (e.g. “new creators”) for tighter CTAs.",
              "Use Save template to keep winning structures in your browser.",
              "Pro adds more variants and deeper strategy per generation."
            ]}
            examplesCategory="ai_caption"
            valueProofVariant="ai_caption"
            relatedAside={
              <>
                <RelatedToolsCard currentSlug={slug} category="Captions" />
                <RelatedArticlesCard tags={toolToBlogTags["instagram-caption-generator"] ?? []} />
                <LearnAiLinkCard />
              </>
            }
          />
        </Suspense>
        <ToolStructuredData slug={slug} name="AI Caption Generator" description={metaDescription} />
      </div>
      <SiteFooter />
    </main>
  );
}
