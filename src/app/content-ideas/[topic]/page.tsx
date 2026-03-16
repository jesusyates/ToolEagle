import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getSeoExpansionConfig, getSeoExpansionSlugsForPageType } from "@/config/seo-expansion";
import { SeoExpansionTemplate } from "@/components/seo/SeoExpansionTemplate";

const BASE_URL = "https://www.tooleagle.com";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return getSeoExpansionSlugsForPageType("content-ideas");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const config = getSeoExpansionConfig("content-ideas", topic);
  if (!config) return { title: "Not Found" };
  return {
    title: config.metaTitle,
    description: config.description.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/content-ideas/${topic}` },
    openGraph: { title: config.metaTitle, description: config.description.slice(0, 160), url: `${BASE_URL}/content-ideas/${topic}` }
  };
}

export default async function ContentIdeasPage({ params }: Props) {
  const { topic } = await params;
  const config = getSeoExpansionConfig("content-ideas", topic);
  if (!config) notFound();

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <SeoExpansionTemplate config={config} backHref="/ideas" backLabel="Ideas" />
      </div>
      <SiteFooter />
    </main>
  );
}
