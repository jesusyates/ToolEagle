import Link from "next/link";
import { Metadata } from "next";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import {
  AI_TOOL_CATEGORIES,
  AI_TOOLS_MARKETPLACE,
  getAIToolsByCategory
} from "@/config/ai-tools-marketplace";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Tools for Creators (2026) | Caption, Hook, Hashtag Generators",
  description:
    "The largest AI creator tool directory. Caption generators, hook writers, hashtag tools, script generators. Free and paid options for TikTok, YouTube, Instagram.",
  openGraph: {
    title: "AI Tools for Creators (2026)",
    description: "Caption generators, hook writers, hashtag tools. Free and paid AI for creators."
  }
};

export default function AiToolsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              AI Tools for Creators
            </h1>
            <p className="mt-4 text-xl text-slate-600">
              The largest directory of AI tools for content creators. Caption generators, hook writers,
              hashtag tools, script generators. Free and paid options for TikTok, YouTube, Instagram.
            </p>
          </div>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-sky-500" />
              Browse by category
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AI_TOOL_CATEGORIES.map((cat) => {
                const tools = getAIToolsByCategory(cat.slug);
                return (
                  <Link
                    key={cat.slug}
                    href={`/ai-tools/category/${cat.slug}`}
                    className="block rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
                  >
                    <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{cat.description}</p>
                    <span className="mt-2 inline-block text-sm font-medium text-sky-600">
                      {tools.length} tools →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-2xl font-semibold text-slate-900">All tools</h2>
            <p className="mt-2 text-slate-600">{AI_TOOLS_MARKETPLACE.length} AI tools for creators</p>
            <ul className="mt-6 space-y-3">
              {AI_TOOLS_MARKETPLACE.slice(0, 100).map((t) => (
                <li key={t.slug}>
                  <Link
                    href={t.isTooleagle && t.toolSlug ? `/tools/${t.toolSlug}` : `/ai-tools/${t.slug}`}
                    className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{t.name}</span>
                      {t.isTooleagle && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                          ToolEagle
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                    <span className="mt-2 inline-block text-sm text-sky-600 hover:underline">
                      {t.isTooleagle ? "Try free →" : "View details →"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {AI_TOOLS_MARKETPLACE.length > 100 && (
              <p className="mt-4 text-sm text-slate-600">
                Showing 100 of {AI_TOOLS_MARKETPLACE.length}. Browse by category above for more tools.
              </p>
            )}
          </section>

          <section className="mt-16 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Try ToolEagle for free</h2>
            <p className="mt-2 text-slate-600">
              Generate captions, hooks, hashtags and more in seconds. No credit card required.
            </p>
            <Link
              href="/tools/tiktok-caption-generator"
              className="mt-4 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Start with Caption Generator →
            </Link>
          </section>

          <div className="mt-12">
            <Link href="/" className="text-sm font-medium text-sky-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
