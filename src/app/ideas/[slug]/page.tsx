import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIdeasByTopic } from "@/lib/generated-content";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getTopic, getAllTopicSlugs } from "@/config/topics";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";
import { getRelatedContent } from "@/lib/related-content";
import { Lightbulb } from "lucide-react";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTopic(slug);
  if (!t) return { title: "Not Found" };
  const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${label} Content Ideas | ToolEagle`;
  const description = `100+ ${label.toLowerCase()} content ideas for TikTok, YouTube and Instagram. Captions, hooks, hashtags and more.`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/ideas/${slug}` },
    openGraph: { title, description, url: `${BASE_URL}/ideas/${slug}` }
  };
}

export default async function IdeasTopicPage({ params }: Props) {
  const { slug } = await params;
  const t = getTopic(slug);
  if (!t) notFound();

  const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const term = slug.replace(/-/g, " ");
  const supabase = await createClient();

  const { data: examples } = await supabase
    .from("public_examples")
    .select("slug, tool_name, result, creator_username")
    .ilike("result", `%${term}%`)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(12);

  const displayExamples = examples ?? [];
  const { items: generatedIdeas } = await getIdeasByTopic(slug, 0);
  const related = await getRelatedContent({ topic: slug, limit: 6 });
  const tool = tools.find((x) => x.slug === t.toolSlug);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/topics" className="text-sm font-medium text-sky-600 hover:underline">← Topics</Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {label} Content Ideas
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">
            {t.intro}
          </p>

          {generatedIdeas.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">AI-generated ideas</h2>
              <ul className="mt-3 space-y-2">
                {generatedIdeas.slice(0, 12).map((idea) => (
                  <li key={idea.id}>
                    <Link
                      href={`/ideas/${slug}/${idea.id}`}
                      className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                    >
                      <p className="text-sm text-slate-800 line-clamp-2">{idea.content}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              {generatedIdeas.length > 12 && (
                <p className="mt-2 text-sm text-slate-600">
                  + {generatedIdeas.length - 12} more ideas. Click any to view full detail.
                </p>
              )}
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Example content</h2>
            {displayExamples.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {displayExamples.map((ex) => (
                  <li key={ex.slug}>
                    <Link
                      href={`/examples/${ex.slug}`}
                      className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                    >
                      <p className="text-sm text-slate-800 line-clamp-3">{ex.result}</p>
                      <span className="mt-1 text-xs text-slate-500">{ex.tool_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No examples yet. Generate your own below!</p>
            )}
          </section>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Link
              href={`/captions-for/${slug}`}
              className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
            >
              <h3 className="font-semibold text-slate-900">Captions</h3>
              <p className="mt-1 text-sm text-slate-600">TikTok & Instagram captions</p>
            </Link>
            <Link
              href={`/hooks-for/${slug}`}
              className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
            >
              <h3 className="font-semibold text-slate-900">Hooks</h3>
              <p className="mt-1 text-sm text-slate-600">YouTube & TikTok hooks</p>
            </Link>
            <Link
              href={`/hashtags-for/${slug}`}
              className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
            >
              <h3 className="font-semibold text-slate-900">Hashtags</h3>
              <p className="mt-1 text-sm text-slate-600">Niche hashtags</p>
            </Link>
          </div>

          <SeoToolCTA
            toolName={t.toolName}
            toolSlug={t.toolSlug}
            description={`Generate ${label.toLowerCase()} content with AI`}
            icon={<Lightbulb className="h-6 w-6 text-amber-500" />}
            buttonLabel={`Try ${t.toolName}`}
          />

          <RelatedContentCard examples={related.examples} answers={related.answers} />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={`/captions-for/${slug}`} className="text-sm font-medium text-sky-600 hover:underline">Captions</Link>
            <Link href={`/hooks-for/${slug}`} className="text-sm font-medium text-sky-600 hover:underline">Hooks</Link>
            <Link href={`/hashtags-for/${slug}`} className="text-sm font-medium text-sky-600 hover:underline">Hashtags</Link>
            <Link href="/topics" className="text-sm font-medium text-sky-600 hover:underline">All Topics</Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">AI Tools</Link>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
