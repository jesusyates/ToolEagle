/**
 * v50 - AI Tools Category Page
 * /ai-tools/category/video-editing
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import {
  getAIToolCategory,
  getAIToolsByCategory,
  AI_TOOL_CATEGORIES,
  type AIToolCategory
} from "@/config/ai-tools-marketplace";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return AI_TOOL_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = getAIToolCategory(slug);
  if (!cat) return { title: "Not Found" };
  return {
    title: `Best ${cat.name} (2026) | ToolEagle`,
    description: `${cat.description} Browse ${cat.name} for creators and marketers.`,
    alternates: { canonical: `${BASE_URL}/ai-tools/category/${slug}` },
    openGraph: {
      title: `Best ${cat.name} | ToolEagle`,
      description: cat.description,
      url: `${BASE_URL}/ai-tools/category/${slug}`
    }
  };
}

export default async function AIToolsCategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = getAIToolCategory(slug);
  if (!cat) notFound();

  const tools = getAIToolsByCategory(slug as AIToolCategory);
  const relatedCategories = AI_TOOL_CATEGORIES.filter((c) => c.slug !== slug).slice(0, 6);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
            ← AI Tools Directory
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {cat.name}
          </h1>
          <p className="mt-4 text-slate-600 leading-relaxed">{cat.description}</p>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Tools</h2>
            <p className="mt-2 text-sm text-slate-600">{tools.length} tools in this category</p>
            <ul className="mt-4 space-y-3">
              {tools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={t.isTooleagle && t.toolSlug ? `/tools/${t.toolSlug}` : `/ai-tools/${t.slug}`}
                    className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{t.name}</span>
                      {t.isTooleagle && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Related Categories</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {relatedCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/ai-tools/category/${c.slug}`}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:border-sky-300 hover:text-sky-700 transition"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Guides</h2>
            <p className="mt-2 text-sm text-slate-600">Learn how to use these tools effectively.</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/how-to/grow-on-tiktok" className="text-sm text-sky-600 hover:underline">
                  How to Grow on TikTok
                </Link>
              </li>
              <li>
                <Link href="/how-to/get-youtube-subscribers" className="text-sm text-sky-600 hover:underline">
                  How to Get YouTube Subscribers
                </Link>
              </li>
              <li>
                <Link href="/how-to/create-viral-hooks" className="text-sm text-sky-600 hover:underline">
                  How to Create Viral Hooks
                </Link>
              </li>
              <li>
                <Link href="/ai-prompts-for/startup" className="text-sm text-sky-600 hover:underline">
                  AI Prompts for Startup
                </Link>
              </li>
              <li>
                <Link href="/content-strategy/creator" className="text-sm text-sky-600 hover:underline">
                  Content Strategy for Creator
                </Link>
              </li>
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
              All AI tools
            </Link>
            <Link href={`/best-ai-tools/${slug}`} className="text-sm font-medium text-sky-600 hover:underline">
              Best {cat.name}
            </Link>
            <Link href="/compare" className="text-sm font-medium text-sky-600 hover:underline">
              Compare tools
            </Link>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
