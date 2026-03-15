import Link from "next/link";
import { Metadata } from "next";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { TOOLEAGLE_TOOLS, EXTERNAL_AI_TOOLS } from "@/config/ai-tools-backlink";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Best AI Tools for Creators (2026)",
  description:
    "Curated list of the best AI tools for content creators. Caption generators, hook writers, hashtag tools, and more. Free and paid options.",
  openGraph: {
    title: "Best AI Tools for Creators (2026)",
    description: "Curated list of AI tools for TikTok, YouTube and Instagram creators."
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
              Best AI Tools for Creators (2026)
            </h1>
            <p className="mt-4 text-xl text-slate-600">
              A curated list of AI tools that help content creators write captions, hooks, titles, and more.
              Free and paid options for TikTok, YouTube, and Instagram.
            </p>
          </div>

          <section className="mt-12 max-w-3xl">
            <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-sky-500" />
              ToolEagle — Free AI Tools for Creators
            </h2>
            <p className="mt-2 text-slate-600">
              ToolEagle offers free AI generators for captions, hooks, hashtags, titles, and scripts.
              No sign-up required for basic use.
            </p>
            <ul className="mt-6 space-y-3">
              {TOOLEAGLE_TOOLS.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tools/${t.slug}`}
                    className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-md transition"
                  >
                    <span className="font-medium text-slate-900">{t.name}</span>
                    <span className="ml-2 text-sm text-slate-500">({t.category})</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/tools"
              className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Browse all ToolEagle tools →
            </Link>
          </section>

          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-semibold text-slate-900">Other AI Tools for Creators</h2>
            <p className="mt-2 text-slate-600">
              Additional AI tools that creators use for writing, design, and social media.
            </p>
            <ul className="mt-6 space-y-3">
              {EXTERNAL_AI_TOOLS.map((t) => (
                <li key={t.name}>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-md transition"
                  >
                    <span className="font-medium text-slate-900">{t.name}</span>
                    <span className="ml-2 text-sm text-slate-500">— {t.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-16 max-w-3xl rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
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
