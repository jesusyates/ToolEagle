/**
 * v47 - Prompt topic list page
 * /prompts/tiktok, /prompts/startup, etc.
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { getPromptsByTopic, getAllPromptTopics } from "@/lib/generated-content";
import { tools } from "@/config/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { BASE_URL } from "@/config/site";

const PAGE_SIZE = 50;

type Props = { params: Promise<{ topic: string }>; searchParams: Promise<{ page?: string }> };

export async function generateStaticParams() {
  const topics = await getAllPromptTopics();
  return topics.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const label = formatTopicLabel(topic);
  const title = `100+ ${label} AI Prompts for Viral Content | ToolEagle`;
  const description = `Free AI prompts for ${label.toLowerCase()} content. ChatGPT prompts, copy-paste ready. Create scroll-stopping ${label.toLowerCase()} in seconds.`;
  const url = `${BASE_URL}/prompts/${topic}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    keywords: [`AI prompts for ${label}`, `${label} prompts`, `ChatGPT prompts ${label}`]
  };
}

function formatTopicLabel(topic: string): string {
  return topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PromptsTopicPage({ params, searchParams }: Props) {
  const { topic } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(0, parseInt(pageStr ?? "0", 10) || 0);

  const { items, total } = await getPromptsByTopic(topic, page);
  if (items.length === 0 && page === 0) notFound();

  const label = formatTopicLabel(topic);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/ai-prompts" className="text-sm font-medium text-sky-600 hover:underline">
            ← AI Prompts
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Best {label} AI Prompts
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">
            {total}+ ChatGPT prompts for {label.toLowerCase()} content. Copy, paste, and customize for your videos.
          </p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Prompts</h2>
            <ul className="mt-3 space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/prompts/${topic}/${item.id}`}
                    className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                  >
                    <p className="text-sm text-slate-800 line-clamp-2">{item.content}</p>
                    {item.platform && (
                      <span className="mt-1 text-xs text-slate-500 capitalize">{item.platform}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav className="mt-6 flex gap-2 flex-wrap">
                {page > 0 && (
                  <Link
                    href={`/prompts/${topic}?page=${page - 1}`}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:border-sky-300"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-slate-600">
                  Page {page + 1} of {totalPages}
                </span>
                {page < totalPages - 1 && (
                  <Link
                    href={`/prompts/${topic}?page=${page + 1}`}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:border-sky-300"
                  >
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </section>

          <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Generate with AI</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use our free AI tools to create {label.toLowerCase()} content in seconds.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/tools/tiktok-caption-generator"
                className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                TikTok Caption Generator →
              </Link>
              <Link
                href="/tools/hook-generator"
                className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-sky-300 transition"
              >
                Hook Generator →
              </Link>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold text-slate-900">Related tools</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {tools
                .filter((t) =>
                  ["tiktok-caption-generator", "hook-generator", "hashtag-generator"].includes(t.slug)
                )
                .slice(0, 4)
                .map((t) => (
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
            <Link href="/ai-prompts" className="text-sm font-medium text-sky-600 hover:underline">
              All AI Prompts
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
