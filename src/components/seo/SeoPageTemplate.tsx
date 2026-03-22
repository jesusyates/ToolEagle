import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ToolCard } from "@/components/tools/ToolCard";
import { tools } from "@/config/tools";
import type { SeoPageConfig } from "@/config/seoPages";

type Props = {
  page: SeoPageConfig;
};

export function SeoPageTemplate({ page }: Props) {
  const recommendedTools = page.toolSlugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {page.h1}
            </h1>
            <p className="mt-4 text-xl text-slate-700 leading-relaxed">
              {page.description}
            </p>
            <p className="mt-6 text-base text-slate-600 leading-relaxed">
              {page.intro}
            </p>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">
                Example {page.h1}
              </h2>
              <ul className="mt-3 space-y-2">
                {page.examples.map((ex, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 pl-4 border-l-2 border-slate-200"
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">
                Try our {page.h1} tools
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Generate AI-powered {page.h1.toLowerCase()} in seconds.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {recommendedTools.map((tool) =>
                  tool ? (
                    <ToolCard
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      icon={tool.icon}
                      name={tool.name}
                      description={tool.description}
                      category={tool.category}
                    />
                  ) : null
                )}
              </div>
            </section>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Browse all tools →
              </Link>
              <Link
                href="/examples"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Creator Examples →
              </Link>
              <Link
                href="/trending"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Trending content →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
