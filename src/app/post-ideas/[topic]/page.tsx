import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getSeoExpansionConfig, getSeoExpansionStaticParamsForPageType } from "@/config/seo-expansion";
import { SeoExpansionTemplate } from "@/components/seo/SeoExpansionTemplate";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return getSeoExpansionStaticParamsForPageType("post-ideas");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const config = getSeoExpansionConfig("post-ideas", topic);
  if (!config) return { title: "Not Found" };
  return {
    title: config.metaTitle,
    description: config.description.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/post-ideas/${topic}` },
    openGraph: { title: config.metaTitle, description: config.description.slice(0, 160), url: `${BASE_URL}/post-ideas/${topic}` }
  };
}

export default async function PostIdeasPage({ params }: Props) {
  const { topic } = await params;
  const config = getSeoExpansionConfig("post-ideas", topic);
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
