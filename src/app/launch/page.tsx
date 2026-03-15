import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { Sparkles, Zap, MessageSquareText, Hash, Type, Video } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";

export const metadata: Metadata = {
  title: "ToolEagle Launch | AI Tools for Creators",
  description:
    "ToolEagle: 50+ free AI tools for TikTok, YouTube and Instagram creators. Caption generator, hook generator, prompt improver. No sign-up required.",
  alternates: { canonical: `${BASE_URL}/launch` },
  robots: { index: true, follow: true }
};

export default function LaunchPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-16">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm font-semibold text-sky-600 uppercase tracking-wider">
                Launching on Product Hunt
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                ToolEagle
              </h1>
              <p className="mt-6 text-xl text-slate-600 leading-relaxed">
                50+ free AI tools for TikTok, YouTube and Instagram creators. Generate captions, hooks, hashtags and titles in seconds. No sign-up required.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/creator"
                  className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-4 text-base font-semibold text-white hover:bg-sky-700 transition"
                >
                  Try Creator Mode →
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Browse all tools
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-16">
          <h2 className="text-2xl font-semibold text-slate-900 text-center">What is ToolEagle?</h2>
          <p className="mt-6 max-w-2xl mx-auto text-slate-600 leading-relaxed text-center">
            ToolEagle is a free toolkit for content creators. Enter a topic, pick your platform (TikTok, YouTube, Instagram), and get AI-generated hooks, captions, hashtags and video ideas. All editable. No account needed.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                <MessageSquareText className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Caption Generator</h3>
              <p className="mt-2 text-sm text-slate-600">
                Generate scroll-stopping captions for TikTok, Reels and Shorts. Add emojis and hashtags.
              </p>
              <Link href="/tools/tiktok-caption-generator" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                Try it →
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                <Zap className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Hook Generator</h3>
              <p className="mt-2 text-sm text-slate-600">
                Viral hooks that stop the scroll in 2 seconds. For short-form video and carousels.
              </p>
              <Link href="/tools/hook-generator" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                Try it →
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                <Sparkles className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">AI Prompt Improver</h3>
              <p className="mt-2 text-sm text-slate-600">
                Turn rough ideas into powerful prompts. Learn to talk to AI better.
              </p>
              <Link href="/ai-prompt-improver" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                Try it →
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 border-y border-slate-200 py-16">
          <div className="container">
            <h2 className="text-2xl font-semibold text-slate-900 text-center">Key tools</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/tools/tiktok-caption-generator" className="rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-200 transition text-center">
                <MessageSquareText className="h-8 w-8 mx-auto text-slate-600" />
                <p className="mt-2 font-medium text-slate-900">TikTok Captions</p>
              </Link>
              <Link href="/tools/hashtag-generator" className="rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-200 transition text-center">
                <Hash className="h-8 w-8 mx-auto text-slate-600" />
                <p className="mt-2 font-medium text-slate-900">Hashtags</p>
              </Link>
              <Link href="/tools/hook-generator" className="rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-200 transition text-center">
                <Zap className="h-8 w-8 mx-auto text-slate-600" />
                <p className="mt-2 font-medium text-slate-900">Hooks</p>
              </Link>
              <Link href="/tools/title-generator" className="rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-200 transition text-center">
                <Type className="h-8 w-8 mx-auto text-slate-600" />
                <p className="mt-2 font-medium text-slate-900">Titles</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-slate-900 text-center">Creator system</h2>
            <p className="mt-6 text-slate-600 leading-relaxed text-center">
              Creator Mode generates full content in one go: hook, caption, hashtags and video idea. Creators get a public profile, save favorites, and sync across devices when they sign up.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/creator"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-base font-semibold text-white hover:bg-sky-700 transition"
              >
                <Video className="h-5 w-5" />
                Try Creator Mode
              </Link>
            </div>
          </div>
        </section>

        <section className="container pb-16">
          <div className="max-w-xl mx-auto rounded-2xl border-2 border-sky-200 bg-sky-50 p-8 text-center">
            <p className="font-semibold text-slate-900">Launching on Product Hunt</p>
            <p className="mt-2 text-sm text-slate-600">
              Upvote and support ToolEagle on Product Hunt. Free tools for creators, forever.
            </p>
            <a
              href="https://www.producthunt.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition"
            >
              View on Product Hunt →
            </a>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
