import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ToolCard } from "@/components/tools/ToolCard";
import { tools } from "@/config/tools";
import {
  getSeoPageEntry,
  getSeoPageParams,
  formatTopicLabel,
  getExamplesForTopic,
  getCategoryLabel,
  getRelatedBlogSlugs,
  getRelatedSeoPages,
  getWritingTips
} from "@/config/seo-pages";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://www.tooleagle.com";
const IDEAS_PREFIX = "/ideas";

type Props = {
  params: Promise<{ category: string; topic: string }>;
};

export async function generateStaticParams() {
  return getSeoPageParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, topic } = await params;
  const entry = getSeoPageEntry(category, topic);
  if (!entry) return { title: "Not Found" };

  const topicLabel = formatTopicLabel(topic);
  const categoryLabel = getCategoryLabel(category);
  const title = `${topicLabel} ${categoryLabel} – 100+ Ideas for Your Videos`;
  const description = `Free AI generator for ${topicLabel.toLowerCase()} ${categoryLabel}. Get 100+ ideas, examples, and templates. Create scroll-stopping content in seconds.`;

  const url = `${BASE_URL}${IDEAS_PREFIX}/${category}/${topic}`;
  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url
    }
  };
}

export default async function SeoTopicPage({ params }: Props) {
  const { category, topic } = await params;
  const entry = getSeoPageEntry(category, topic);
  if (!entry) notFound();

  const tool = tools.find((t) => t.slug === entry.tool);
  const topicLabel = formatTopicLabel(topic);
  const categoryLabel = getCategoryLabel(category);
  const examples = getExamplesForTopic(topic, category);
  const relatedBlogSlugs = getRelatedBlogSlugs(category, topic);
  const relatedSeoPages = getRelatedSeoPages(category, topic);
  const writingTips = getWritingTips(topic);
  const allPosts = await getAllPosts();
  const relatedPosts = relatedBlogSlugs
    .map((slug) => allPosts.find((p) => p.frontmatter.slug === slug))
    .filter(Boolean);

  const relatedTools = tools.filter(
    (t) =>
      t.slug === entry.tool ||
      (t.category === tool?.category && t.slug !== entry.tool)
  ).slice(0, 4);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {topicLabel} {categoryLabel}
            </h1>
            <p className="mt-4 text-xl text-slate-700 leading-relaxed">
              {topicLabel} {categoryLabel} that get views and engagement. Use our free AI generator to create multiple options in seconds.
            </p>
            <p className="mt-6 text-base text-slate-600 leading-relaxed">
              Great {topicLabel.toLowerCase()} hook viewers, add personality, and fit your niche. Generate ideas with our AI tool—then pick the one that fits your voice.
            </p>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">
                Example {topicLabel} {categoryLabel}
              </h2>
              <ul className="mt-3 space-y-2">
                {examples.slice(0, 10).map((ex, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 pl-4 border-l-2 border-slate-200"
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Generate your own with AI
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Use our free AI tool to create {topicLabel.toLowerCase()} in seconds. No sign-up required.
              </p>
              <Link
                href={`/tools/${entry.tool}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition duration-150"
              >
                Try {tool?.name ?? "AI Generator"} →
              </Link>
            </section>

            {writingTips.length > 0 && (
              <section className="mt-12">
                <h2 className="text-lg font-semibold text-slate-900">
                  Tips for writing good {topicLabel.toLowerCase()}
                </h2>
                <ul className="mt-3 space-y-2">
                  {writingTips.map((tip, i) => (
                    <li key={i} className="text-sm text-slate-700 pl-4 border-l-2 border-slate-200">
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">
                More {topicLabel} tools
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Generate AI-powered {topicLabel.toLowerCase()} in seconds.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {relatedTools.slice(0, 3).map((t) => (
                  <ToolCard
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    icon={t.icon}
                    name={t.name}
                    description={t.description}
                    category={t.category}
                  />
                ))}
              </div>
            </section>

            {relatedSeoPages.length > 0 && (
              <section className="mt-12">
                <h2 className="text-lg font-semibold text-slate-900">
                  Related {categoryLabel} pages
                </h2>
                <ul className="mt-3 space-y-2">
                  {relatedSeoPages.map(({ category: c, topic: t }) => (
                    <li key={`${c}-${t}`}>
                      <Link
                        href={`${IDEAS_PREFIX}/${c}/${t}`}
                        className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        {formatTopicLabel(t)} {getCategoryLabel(c)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {relatedPosts.length > 0 && (
              <section className="mt-12">
                <h2 className="text-lg font-semibold text-slate-900">
                  Related articles
                </h2>
                <ul className="mt-3 space-y-2">
                  {relatedPosts.map((post) =>
                    post ? (
                      <li key={post.frontmatter.slug}>
                        <Link
                          href={`/blog/${post.frontmatter.slug}`}
                          className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                        >
                          {post.frontmatter.title}
                        </Link>
                      </li>
                    ) : null
                  )}
                </ul>
              </section>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Browse all tools →
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
              >
                Creator Playbook →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
