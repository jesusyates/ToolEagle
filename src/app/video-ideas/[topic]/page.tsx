import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getSeoExpansionConfig, getSeoExpansionStaticParamsForPageType } from "@/config/seo-expansion";
import { SeoExpansionTemplate } from "@/components/seo/SeoExpansionTemplate";
import { BASE_URL } from "@/config/site";
import { robotsForExpansionPage } from "@/lib/seo/expansion-page-meta";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return getSeoExpansionStaticParamsForPageType("video-ideas");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const config = getSeoExpansionConfig("video-ideas", topic);
  if (!config) return { title: "Not Found" };
  const robots = await robotsForExpansionPage(topic, "video-ideas");
  return {
    title: config.metaTitle,
    description: config.description.slice(0, 160),
    robots,
    alternates: { canonical: `${BASE_URL}/video-ideas/${topic}` },
    openGraph: { title: config.metaTitle, description: config.description.slice(0, 160), url: `${BASE_URL}/video-ideas/${topic}` }
  };
}

export default async function VideoIdeasPage({ params }: Props) {
  const { topic } = await params;
  const config = getSeoExpansionConfig("video-ideas", topic);
  if (!config) notFound();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <SeoExpansionTemplate config={config} backHref="/ideas" backLabel="Ideas" />
      </div>
      <SiteFooter />
    </main>
  );
}
