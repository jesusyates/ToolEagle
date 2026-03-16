import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAITool, getAllAIToolSlugs } from "@/config/ai-tools-marketplace";
import { AIToolPage } from "@/components/tools/AIToolPage";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllAIToolSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getAITool(slug);
  if (!tool) return { title: "Not Found" };
  return {
    title: `${tool.name} | ToolEagle`,
    description: tool.description.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/ai-tools/${slug}` },
    openGraph: {
      title: `${tool.name} | ToolEagle`,
      description: tool.description.slice(0, 160),
      url: `${BASE_URL}/ai-tools/${slug}`
    }
  };
}

export default async function AIToolSlugPage({ params }: Props) {
  const { slug } = await params;
  const tool = getAITool(slug);
  if (!tool) notFound();

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <AIToolPage tool={tool} />
      </div>
      <SiteFooter />
    </main>
  );
}
