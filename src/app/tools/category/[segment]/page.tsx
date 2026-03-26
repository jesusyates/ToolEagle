import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ToolCard } from "@/components/tools/ToolCard";
import {
  popularToolSlugs,
  toolCategories,
  toolsForEnglishSite,
  type ToolCategory
} from "@/config/tools";
import { BASE_URL } from "@/config/site";
import { isPlatformHubScopedSlug } from "@/lib/tools/platform-scope";
import {
  segmentToToolCategory,
  toolCategoryToSegment
} from "@/lib/tools/tool-category-url";

type Props = { params: Promise<{ segment: string }> };

export async function generateStaticParams() {
  return toolCategories.map((c) => ({ segment: toolCategoryToSegment(c) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segment } = await params;
  const category = segmentToToolCategory(segment);
  if (!category) return { title: "Not Found" };
  const t = await getTranslations("tools");
  const blurb = t(`categoryBlurbs.${category}`);
  const url = `${BASE_URL}/tools/category/${toolCategoryToSegment(category)}`;
  return {
    title: `${category} tools | ToolEagle`,
    description: blurb,
    alternates: { canonical: url },
    openGraph: { title: `${category} tools | ToolEagle`, description: blurb, url }
  };
}

function toolsInCategory(category: ToolCategory) {
  return toolsForEnglishSite.filter(
    (tool) => tool.category === category && !isPlatformHubScopedSlug(tool.slug)
  );
}

export default async function ToolCategoryPage({ params }: Props) {
  const { segment } = await params;
  const category = segmentToToolCategory(segment);
  if (!category) notFound();

  const t = await getTranslations("tools");
  const tools = toolsInCategory(category);
  const blurb = t(`categoryBlurbs.${category}`);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <section className="container pt-10 pb-16 max-w-3xl">
          <Link
            href="/tools"
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← {t("title")}
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            {category}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
            {category} tools
          </h1>
          <p className="mt-4 text-slate-600 leading-relaxed">{blurb}</p>
          <p className="mt-2 text-sm text-slate-500">
            {tools.length} {tools.length === 1 ? "tool" : "tools"} in this category
          </p>

          <ul className="mt-8 space-y-4">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <ToolCard
                  href={`/tools/${tool.slug}`}
                  icon={tool.icon}
                  name={tool.name}
                  description={tool.description}
                  category={tool.category}
                  slug={tool.slug}
                  badge={
                    popularToolSlugs.includes(tool.slug)
                      ? "Popular"
                      : undefined
                  }
                  locale="en"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
