import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getComparePage, getAllCompareSlugs } from "@/config/compare-pages";
import { Check, X } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllCompareSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparePage(slug);
  if (!page) return { title: "Not Found" };

  return {
    title: `${page.title} | ToolEagle`,
    description: page.intro.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/compare/${slug}` },
    openGraph: {
      title: `${page.title} | ToolEagle`,
      description: page.intro.slice(0, 160),
      url: `${BASE_URL}/compare/${slug}`
    }
  };
}

export default async function CompareSlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getComparePage(slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/compare" className="text-sm font-medium text-sky-600 hover:underline">
            ← Compare AI Tools
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {page.title}
          </h1>

          <p className="mt-6 text-slate-600 leading-relaxed">{page.intro}</p>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Tool comparison</h2>
            <div className="mt-6 space-y-8">
              {page.tools.map((tool) => (
                <div
                  key={tool.name}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{tool.name}</h3>
                    {tool.slug && (
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="text-sm font-medium text-sky-600 hover:underline"
                      >
                        Try now →
                      </Link>
                    )}
                  </div>
                  {tool.bestFor && (
                    <p className="mt-2 text-sm text-slate-500">Best for: {tool.bestFor}</p>
                  )}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                        Pros
                      </p>
                      <ul className="mt-2 space-y-1">
                        {tool.pros.map((p, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-700">
                            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                        Cons
                      </p>
                      <ul className="mt-2 space-y-1">
                        {tool.cons.map((c, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-700">
                            <X className="h-4 w-4 shrink-0 text-amber-500" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Example captions</h2>
            <p className="mt-2 text-sm text-slate-600">
              The kind of output you can expect from a creator-focused caption generator.
            </p>
            <ul className="mt-4 space-y-3">
              {page.examples.map((ex, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
                >
                  &ldquo;{ex}&rdquo;
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Try {page.ctaToolName}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Generate captions in seconds. No sign-up required. Built for creators.
            </p>
            <Link
              href={`/tools/${page.ctaToolSlug}`}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
            >
              Try {page.ctaToolName} →
            </Link>
          </section>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/compare" className="text-sm font-medium text-sky-600 hover:underline">
              All comparisons →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              All tools →
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Examples →
            </Link>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
