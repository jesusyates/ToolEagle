"use client";

import Link from "next/link";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";
import { tools, popularToolSlugs, type ToolConfig } from "@/config/tools";
import { ToolCard } from "@/components/tools/ToolCard";

const popularTools = popularToolSlugs
  .map((slug) => tools.find((t) => t.slug === slug))
  .filter((t): t is ToolConfig => t != null)
  .slice(0, 6);

const latestArticles = [
  {
    href: "/blog/tiktok-caption-ideas",
    title: "50 TikTok Caption Ideas that Actually Work",
    tag: "TikTok"
  },
  {
    href: "/blog/how-to-go-viral-on-tiktok",
    title: "How to Go Viral on TikTok in 2026",
    tag: "Strategy"
  },
  {
    href: "/blog/youtube-title-formulas",
    title: "YouTube Title Formulas that Drive Clicks",
    tag: "YouTube"
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AI Tools for TikTok, YouTube and Instagram creators
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">
                  ToolEagle
                </h1>
                <p className="text-xl text-slate-700 leading-relaxed max-w-2xl">
                  <span className="font-semibold text-slate-900">
                    AI Tools for TikTok, YouTube and Instagram creators.
                  </span>{" "}
                  Generate captions, hashtags, hooks and titles in seconds—so you can spend less
                  time writing and more time creating.
                </p>
              </div>

              <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                A clean, creator-first toolkit powered by AI. Fast, scannable, and easy to use on
                mobile. No sign-ups. No distractions.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/tools/tiktok-caption-generator"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition duration-150 w-full sm:w-auto text-center"
                >
                  Start with TikTok captions
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition duration-150 w-full sm:w-auto text-center"
                >
                  Browse all tools
                </Link>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  ⚡ 12,000+ captions generated
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  🚀 Used by creators on TikTok & YouTube
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-3">Popular for creators</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/tools/tiktok-caption-generator"
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition duration-150"
                >
                  TikTok Captions
                </Link>
                <Link
                  href="/tools/hook-generator"
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition duration-150"
                >
                  Hooks
                </Link>
                <Link
                  href="/tools/hashtag-generator"
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition duration-150"
                >
                  Hashtags
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition duration-150">
                  <p className="text-sm font-semibold text-slate-900">
                    No sign‑up
                  </p>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Open, use and close. No accounts, no onboarding flows.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition duration-150">
                  <p className="text-sm font-semibold text-slate-900">
                    Creator‑first
                  </p>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Built around TikTok, Reels, Shorts and YouTube, not generic marketing.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition duration-150">
                  <p className="text-sm font-semibold text-slate-900">
                    Always free
                  </p>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Start small, grow the toolkit over time with community feedback.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-xs font-semibold text-sky-700 uppercase tracking-[0.2em]">
                Product
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Built like a real toolkit
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Every tool is designed as a quick workflow: input → generate → copy → post.
              </p>
              <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">What you can generate</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  <li>• Captions and hashtags that fit your niche</li>
                  <li>• Hooks that stop the scroll in the first 2 seconds</li>
                  <li>• Titles built for clicks on YouTube and Shorts</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 border-y border-slate-200">
          <div className="container py-12">
          <h2 className="text-lg font-semibold text-slate-900">
            Popular tools
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Most used by creators. Quick, scannable workflow—pick one and ship.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                icon={tool.icon}
                name={tool.name}
                description={tool.description}
                category={tool.category}
              />
            ))}
          </div>
          </div>
        </section>

        <section className="container py-12">
          <h2 className="text-lg font-semibold text-slate-900">
            Why ToolEagle
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Strong visual hierarchy, clean cards, and fast workflows—so you can stay in creator mode.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Built for speed</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Open a tool, paste an idea, get text you can ship in under 30 seconds.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Creator‑native UX</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Interfaces optimised for vertical video workflows, not generic marketing funnels.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Always improving</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                New tools and playbooks get added over time based on what creators actually use.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 border-t border-slate-200">
          <div className="container py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Latest articles
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Learn lightweight tactics to get more from every post.
              </p>
            </div>
            <Link
              href="/blog"
              className="text-sm text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline transition duration-150"
            >
              View all articles
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {latestArticles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-150"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="px-2 py-1 rounded-full border border-slate-200 bg-slate-50">
                    {article.tag}
                  </span>
                  <span>Playbook</span>
                </div>
                <p className="text-base font-semibold text-slate-900">
                  {article.title}
                </p>
              </Link>
            ))}
          </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

