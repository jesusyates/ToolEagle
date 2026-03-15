"use client";

import Link from "next/link";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";
import { tools, popularToolSlugs, type ToolConfig } from "@/config/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { CreatorModeDemo } from "@/components/CreatorModeDemo";

const popularTools = popularToolSlugs
  .map((slug) => tools.find((t) => t.slug === slug))
  .filter((t): t is ToolConfig => t != null)
  .slice(0, 6);

// Platform tools: link to SEO pages (guaranteed to exist) which have CTA to AI tools
const PLATFORM_OPEN_URLS: Record<string, string> = {
  tiktok: "https://www.tiktok.com/",
  youtube: "https://www.youtube.com/",
  instagram: "https://www.instagram.com/"
};

const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

const platformTools: Record<string, { href: string; name: string }[]> = {
  tiktok: [
    { href: "/tiktok/captions/funny", name: "Caption Generator" },
    { href: "/tiktok/hashtags/funny", name: "Hashtag Generator" },
    { href: "/tiktok/titles/gaming", name: "Title Generator" },
    { href: "/tiktok/hooks/funny", name: "Hook Generator" },
    { href: "/tiktok/bio/aesthetic", name: "Bio Generator" }
  ],
  youtube: [
    { href: "/youtube/titles/gaming", name: "Title Generator" },
    { href: "/youtube/captions/funny", name: "Caption Generator" },
    { href: "/youtube/hashtags/funny", name: "Hashtag Generator" },
    { href: "/youtube/hooks/funny", name: "Hook Generator" },
    { href: "/youtube/bio/aesthetic", name: "Bio Generator" }
  ],
  instagram: [
    { href: "/instagram/captions/funny", name: "Caption Generator" },
    { href: "/instagram/hashtags/funny", name: "Hashtag Generator" },
    { href: "/instagram/titles/gaming", name: "Title Generator" },
    { href: "/instagram/hooks/funny", name: "Hook Generator" },
    { href: "/instagram/bio/aesthetic", name: "Bio Generator" }
  ]
};

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
        {/* Hero: Creator Mode as primary CTA */}
        <section className="container pt-10 pb-12">
          <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AI Tools for TikTok, YouTube and Instagram creators
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900">
                  Generate full creator content in one go
                </h1>
                <p className="text-xl text-slate-700 leading-relaxed max-w-2xl">
                  Enter your topic, pick platform and tone—get hook, caption, hashtags and video idea.
                  All editable. No sign-up.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/creator"
                  className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-sm hover:bg-sky-700 transition duration-150 w-full sm:w-auto text-center"
                >
                  Try Creator Mode →
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition duration-150 w-full sm:w-auto text-center"
                >
                  Browse all tools
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition duration-150 w-full sm:w-auto text-center"
                >
                  View pricing
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
                <Link
                  href="/ai-prompts"
                  className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100 transition duration-150"
                >
                  AI Prompts
                </Link>
                <Link
                  href="/ai-prompt-improver"
                  className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100 transition duration-150"
                >
                  Prompt Improver
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
        </section>

        <CreatorModeDemo />

        {/* Three Entry Blocks */}
        <section className="container py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-sky-300 hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-slate-900">Create Viral Content</h2>
              <p className="mt-2 text-sm text-slate-600">
                Generate captions, hooks and titles for your videos.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/tools/tiktok-caption-generator"
                  className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
                >
                  TikTok Captions
                </Link>
                <Link
                  href="/tools/hook-generator"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  YouTube Hooks
                </Link>
                <Link
                  href="/tools/instagram-caption-generator"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Instagram Captions
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-sky-300 hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-slate-900">Learn to Talk to AI</h2>
              <p className="mt-2 text-sm text-slate-600">
                Improve your prompts and get better AI results.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/ai-prompt-improver"
                  className="inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition"
                >
                  Prompt Improver
                </Link>
                <Link
                  href="/ai-prompts"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  AI Prompts Library
                </Link>
                <Link
                  href="/learn-ai"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Learn AI
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-sky-300 hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-slate-900">Creator Inspiration</h2>
              <p className="mt-2 text-sm text-slate-600">
                See what other creators are making. Get featured.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/examples"
                  className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition"
                >
                  Creator Examples
                </Link>
                <Link
                  href="/creators"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Creators
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Tools: TikTok, YouTube, Instagram */}
        <section className="bg-slate-50 border-y border-slate-200">
          <div className="container py-12">
            <h2 className="text-lg font-semibold text-slate-900">Platform tools</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Pick your platform and use the right tool for captions, titles, hooks and more.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {(["tiktok", "youtube", "instagram"] as const).map((platform) => (
                <div
                  key={platform}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Link href={`/${platform}-tools`} className="group block">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-700 transition">
                      {PLATFORM_DISPLAY_NAMES[platform]} Tools →
                    </h3>
                  </Link>
                  <ul className="mt-3 space-y-2">
                    {platformTools[platform].map(({ href, name }) => (
                      <li key={`${platform}-${name}`}>
                        <Link
                          href={href}
                          className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                        >
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/${platform}/captions/funny`}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Browse {platform} ideas →
                    </Link>
                    <a
                      href={PLATFORM_OPEN_URLS[platform]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-sky-600 hover:text-sky-800"
                    >
                      Open {PLATFORM_DISPLAY_NAMES[platform]} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-12">
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

