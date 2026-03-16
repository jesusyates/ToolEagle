import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getBestContentPage, getAllBestContentSlugs } from "@/config/best-content";
import { getAnswerPage } from "@/config/answers";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { tools } from "@/config/tools";
import { Video } from "lucide-react";
import { BASE_URL } from "@/config/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllBestContentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getBestContentPage(slug);
  if (!page) return { title: "Not Found" };

  return {
    title: `${page.title} | ToolEagle`,
    description: page.intro.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/best/${slug}` },
    openGraph: {
      title: `${page.title} | ToolEagle`,
      description: page.intro.slice(0, 160),
      url: `${BASE_URL}/best/${slug}`
    }
  };
}

export default async function BestContentPage({ params }: Props) {
  const { slug } = await params;
  const page = getBestContentPage(slug);
  if (!page) notFound();

  const tool = tools.find((t) => t.slug === page.toolSlug);
  const ToolIcon = tool?.icon ?? Video;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
            ← Creator Examples
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {page.title}
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">{page.intro}</p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Best examples</h2>
            <ul className="mt-3 space-y-3">
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

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Tips</h2>
            <ol className="mt-3 space-y-2">
              {page.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="shrink-0 font-medium text-sky-600">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </section>

          <SeoToolCTA
            toolName={page.toolName}
            toolSlug={page.toolSlug}
            description={`Generate ${page.toolName.toLowerCase().replace(" generator", "")}s with AI`}
            icon={<ToolIcon className="h-6 w-6 text-sky-700" />}
            buttonLabel={`Try ${page.toolName}`}
          />

          <section className="mt-10">
            <h2 className="text-sm font-semibold text-slate-700">Related answers</h2>
            <ul className="mt-2 space-y-2">
              {page.relatedAnswerSlugs.map((s) => {
                const ans = getAnswerPage(s);
                return (
                  <li key={s}>
                    <Link href={`/answers/${s}`} className="text-sm font-medium text-sky-600 hover:underline">
                      {ans?.question ?? s.replace(/-/g, " ")} →
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Examples →
            </Link>
            <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
              Trending content →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              All tools →
            </Link>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
