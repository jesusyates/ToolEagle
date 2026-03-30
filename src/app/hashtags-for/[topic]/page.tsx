import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedHashtagForExamples } from "@/lib/seo/cached-public-examples";
import { robotsForHashtagsForTopic } from "@/lib/seo/topic-for-page-meta";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getTopic, getAllTopicSlugs } from "@/config/topics";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";
import { getRelatedContent } from "@/lib/related-content";
import { Hash } from "lucide-react";
import { BASE_URL } from "@/config/site";
import { limitBuildStaticParams } from "@/lib/build-static-params-limit";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return limitBuildStaticParams(getAllTopicSlugs().map((topic) => ({ topic })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const t = getTopic(topic);
  if (!t) return { title: "Not Found" };
  const label = topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${label} Hashtags | ToolEagle`;
  const description = `Best ${label.toLowerCase()} hashtags for TikTok, Instagram and Reels. Copy or generate with AI.`;
  const robots = await robotsForHashtagsForTopic(topic);
  return {
    title,
    description,
    robots,
    alternates: { canonical: `${BASE_URL}/hashtags-for/${topic}` },
    openGraph: { title, description, url: `${BASE_URL}/hashtags-for/${topic}` }
  };
}

export default async function HashtagsForPage({ params }: Props) {
  const { topic } = await params;
  const t = getTopic(topic);
  if (!t) notFound();

  const label = topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const displayExamples = await getCachedHashtagForExamples(topic);
  const related = await getRelatedContent({ topic, limit: 6 });
  const tool = tools.find((x) => x.slug === "hashtag-generator");

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/tools/hashtag-generator" className="text-sm font-medium text-sky-600 hover:underline">← Hashtag Generator</Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {label} Hashtags
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">
            {label} hashtags for TikTok, Instagram and Reels. Copy or generate with AI.
          </p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Example hashtags</h2>
            {displayExamples.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {displayExamples.map((ex) => (
                  <li key={ex.slug}>
                    <Link
                      href={`/examples/${ex.slug}`}
                      className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                    >
                      <p className="text-sm text-slate-800 line-clamp-3">{ex.result}</p>
                      {ex.creator_username && (
                        <span className="mt-1 text-xs text-slate-500">@{ex.creator_username}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No examples yet. Generate your own below!</p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Tips</h2>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li>• Mix broad and niche hashtags</li>
              <li>• Use 3–5 hashtags for TikTok</li>
              <li>• Up to 30 for Instagram</li>
              <li>• Include branded hashtags</li>
            </ul>
          </section>

          <SeoToolCTA
            toolName={tool?.name ?? "Hashtag Generator"}
            toolSlug="hashtag-generator"
            description={`Generate ${label.toLowerCase()} hashtags instantly with AI`}
            icon={<Hash className="h-6 w-6 text-sky-700" />}
            buttonLabel={`Generate ${label} Hashtags`}
          />

          <RelatedContentCard examples={related.examples} answers={related.answers} />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/tools/hashtag-generator" className="text-sm font-medium text-sky-600 hover:underline">Hashtag Generator</Link>
            <Link href="/captions" className="text-sm font-medium text-sky-600 hover:underline">Captions</Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">AI Tools</Link>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
