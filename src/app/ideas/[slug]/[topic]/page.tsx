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
import { getIdeaById, getIdeasByTopic } from "@/lib/generated-content";
import type { GeneratedContentRow } from "@/lib/generated-content";
import { IdeaViewTracker } from "./IdeaViewTracker";
import { BASE_URL } from "@/config/site";

const IDEAS_PREFIX = "/ideas";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ slug: string; topic: string }>;
};

export async function generateStaticParams() {
  const seoParams = getSeoPageParams().map(({ category, topic }) => ({ slug: category, topic }));
  // v47: idea detail pages are dynamic - skip for static params
  return seoParams;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: category, topic } = await params;
  const entry = getSeoPageEntry(category, topic);
  if (entry) {
    const topicLabel = formatTopicLabel(topic);
    const categoryLabel = getCategoryLabel(category);
    const title = `${topicLabel} ${categoryLabel} – 100+ Ideas for Your Videos`;
    const description = `Free AI generator for ${topicLabel.toLowerCase()} ${categoryLabel}. Get 100+ ideas, examples, and templates. Create scroll-stopping content in seconds.`;
    const url = `${BASE_URL}${IDEAS_PREFIX}/${category}/${topic}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url }
    };
  }
  // v47: idea detail (topic = UUID)
  if (UUID_REGEX.test(topic)) {
    const item = await getIdeaById(topic);
    if (item && item.topic === category) {
      const label = formatTopicLabel(category);
      const title = `${label} Content Idea | ToolEagle`;
      const description = (item.content ?? "").slice(0, 160);
      const url = `${BASE_URL}${IDEAS_PREFIX}/${category}/${topic}`;
      return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url }
      };
    }
  }
  return { title: "Not Found" };
}

export default async function SeoTopicPage({ params }: Props) {
  const { slug: category, topic } = await params;
  const entry = getSeoPageEntry(category, topic);

  // v47: idea detail page when topic is UUID
  if (!entry && UUID_REGEX.test(topic)) {
    const item = await getIdeaById(topic);
    if (item && item.topic === category) {
      return <IdeaDetailPage slug={category} id={topic} item={item} />;
    }
  }

  if (!entry) notFound();

  // Existing SEO page
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

// v47 - Idea detail page from generated_content
async function IdeaDetailPage({
  slug,
  id,
  item
}: {
  slug: string;
  id: string;
  item: GeneratedContentRow;
}) {
  const label = formatTopicLabel(slug);
  const { items: related } = await getIdeasByTopic(slug, 0);
  const relatedIdeas = related.filter((p) => p.id !== id).slice(0, 5);
  const relatedTools = tools
    .filter((t) =>
      ["tiktok-idea-generator", "hook-generator", "tiktok-caption-generator"].includes(t.slug)
    )
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <IdeaViewTracker slug={slug} id={id} />
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href={`/ideas/${slug}`} className="text-sm font-medium text-sky-600 hover:underline">
            ← {label} Ideas
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {label} Content Idea
          </h1>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Idea</h2>
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-800 whitespace-pre-wrap">{item.content}</p>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Generate more with AI</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use our free AI tool to create more {label.toLowerCase()} ideas in seconds.
            </p>
            <Link
              href="/tools/tiktok-idea-generator"
              className="mt-4 inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Try TikTok Idea Generator →
            </Link>
          </section>

          {relatedIdeas.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">Related Ideas</h2>
              <ul className="mt-3 space-y-2">
                {relatedIdeas.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/ideas/${slug}/${p.id}`}
                      className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                    >
                      <p className="text-sm text-slate-800 line-clamp-2">{p.content}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Related Tools</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {relatedTools.map((t) => (
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

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={`/ideas/${slug}`} className="text-sm font-medium text-sky-600 hover:underline">
              More {label} Ideas
            </Link>
            <Link href="/topics" className="text-sm font-medium text-sky-600 hover:underline">
              All Topics
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              AI Tools
            </Link>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
