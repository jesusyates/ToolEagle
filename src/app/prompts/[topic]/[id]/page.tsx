/**
 * v47 - Prompt detail page
 * /prompts/tiktok/123, /prompts/startup/456
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { getPromptById, getPromptsByTopic } from "@/lib/generated-content";
import { tools } from "@/config/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { PromptCopyButton } from "./PromptCopyButton";
import { PromptViewTracker } from "./PromptViewTracker";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ topic: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic, id } = await params;
  const item = await getPromptById(id);
  if (!item) return { title: "Not Found" };

  const label = formatTopicLabel(topic);
  const title = `${label} AI Prompt | ToolEagle`;
  const description = (item.content ?? "").slice(0, 160);
  const url = `${BASE_URL}/prompts/${topic}/${id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url }
  };
}

function formatTopicLabel(topic: string): string {
  return topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PromptDetailPage({ params }: Props) {
  const { topic, id } = await params;
  const item = await getPromptById(id);
  if (!item || (item.topic !== topic && item.platform !== topic)) notFound();

  const label = formatTopicLabel(topic);
  const { items: related } = await getPromptsByTopic(topic, 0);
  const relatedPrompts = related.filter((p) => p.id !== id).slice(0, 5);
  const relatedTools = tools
    .filter((t) =>
      ["tiktok-caption-generator", "hook-generator", "hashtag-generator"].includes(t.slug)
    )
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <PromptViewTracker topic={topic} id={id} />
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href={`/prompts/${topic}`} className="text-sm font-medium text-sky-600 hover:underline">
            ← {label} Prompts
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Best {label} AI Prompts
          </h1>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Prompt</h2>
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 relative">
              <p className="text-slate-800 whitespace-pre-wrap">{item.content}</p>
              <PromptCopyButton content={item.content} topic={topic} id={id} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">How to Use</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>1. Copy the prompt above</li>
              <li>2. Paste into ChatGPT, Claude, or your AI tool</li>
              <li>3. Customize with your niche or style</li>
              <li>4. Generate content and iterate</li>
            </ul>
          </section>

          {relatedPrompts.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">Related Prompts</h2>
              <ul className="mt-3 space-y-2">
                {relatedPrompts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/prompts/${topic}/${p.id}`}
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
            <Link href={`/prompts/${topic}`} className="text-sm font-medium text-sky-600 hover:underline">
              More {label} Prompts
            </Link>
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
