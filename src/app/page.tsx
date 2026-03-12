"use client";

import Link from "next/link";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";

const popularTools = [
  {
    href: "/tools/tiktok-caption-generator",
    label: "TikTok Caption Generator",
    badge: "Most used",
    description: "Turn a quick idea into a ready-to-post TikTok caption with hooks and hashtags."
  },
  {
    href: "/tools/hashtag-generator",
    label: "Hashtag Generator",
    badge: "New",
    description: "Generate niche-friendly hashtags for TikTok, Reels and Shorts in seconds."
  },
  {
    href: "/tools/title-generator",
    label: "Title Generator",
    badge: "For video & shorts",
    description: "Craft titles for YouTube, TikTok, Reels and Shorts that invite clicks."
  }
];

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
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-10 pb-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 shadow-sm shadow-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Phase 2 · Creator toolkit live
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
                  ToolEagle
                </h1>
                <p className="text-lg text-slate-300">
                  <span className="font-medium text-sky-300">
                    Free tools for creators.
                  </span>{" "}
                  Ship TikTok, Reels, Shorts and YouTube videos faster with small, focused utilities
                  built just for you.
                </p>
              </div>

              <p className="text-sm text-slate-400 max-w-xl">
                Start with captions, hashtags, hooks and titles. No logins, no paywalls—just open
                ToolEagle, use a tool, and get back to creating.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/tools/tiktok-caption-generator"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 hover:brightness-110 transition w-full sm:w-auto text-center"
                >
                  Start with TikTok captions
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-sky-500/70 hover:text-sky-200 transition w-full sm:w-auto text-center"
                >
                  Browse all tools
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm font-medium text-slate-200">
                    No sign‑up
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Open, use and close. No accounts, no onboarding flows.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm font-medium text-slate-200">
                    Creator‑first
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Built around TikTok, Reels, Shorts and YouTube, not generic marketing.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm font-medium text-slate-200">
                    Always free
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Start small, grow the toolkit over time with community feedback.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 sm:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <p className="text-xs font-semibold text-sky-200 uppercase tracking-[0.2em]">
                Toolkit
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-100">
                Your always‑ready creator toolbox
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                ToolEagle keeps a few high‑leverage tools one click away so you can move from idea
                to post without getting stuck writing text.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-200">
                <li>• TikTok Caption Generator for scroll‑stopping text.</li>
                <li>• Hashtag Generator for niche‑friendly discovery.</li>
                <li>• Hook Generator for the first 2 seconds of your video.</li>
                <li>• Title Generator for YouTube, TikTok, Reels and Shorts.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Popular tools
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Start with these tools most creators reach for first.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-sky-500/70 hover:bg-slate-900 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-50">{tool.label}</h3>
                  <span className="text-[11px] rounded-full bg-slate-800 px-2 py-0.5 text-slate-300 border border-slate-700/80">
                    {tool.badge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-300">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Why ToolEagle
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-slate-100">Built for speed</p>
              <p className="mt-1.5 text-xs text-slate-400">
                Open a tool, paste an idea, get text you can ship in under 30 seconds.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-slate-100">Creator‑native UX</p>
              <p className="mt-1.5 text-xs text-slate-400">
                Interfaces optimised for vertical video workflows, not generic marketing funnels.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-slate-100">Always improving</p>
              <p className="mt-1.5 text-xs text-slate-400">
                New tools and playbooks get added over time based on what creators actually use.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                Latest articles
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Learn lightweight tactics to get more from every post.
              </p>
            </div>
            <Link
              href="/blog"
              className="text-xs text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline"
            >
              View all articles
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {latestArticles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="block rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-sky-500/70 hover:bg-slate-900 transition"
              >
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                  <span className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/70">
                    {article.tag}
                  </span>
                  <span>Playbook</span>
                </div>
                <p className="text-sm font-semibold text-slate-50">
                  {article.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

