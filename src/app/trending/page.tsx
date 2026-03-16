import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { TRENDING_CATEGORIES } from "@/config/trending";
import { TrendingUp } from "lucide-react";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Trending Captions & Hooks | ToolEagle",
  description:
    "Trending TikTok captions, Instagram captions, and YouTube hooks that get engagement. Copy, adapt, and generate your own with AI.",
  alternates: { canonical: `${BASE_URL}/trending` },
  openGraph: {
    title: "Trending Content | ToolEagle",
    description: "Trending captions and hooks for TikTok, Instagram, and YouTube.",
    url: `${BASE_URL}/trending`
  }
};

export default function TrendingIndexPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Trending Content
              </h1>
            </div>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Captions and hooks that are working right now. Get inspiration and generate your own with AI.
            </p>
            <div className="mt-6">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Generate with AI →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="mb-8 flex flex-wrap gap-4">
            <Link
              href="/trending/today"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 hover:border-sky-300 transition"
            >
              Trending Today
            </Link>
            <Link
              href="/trending/week"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 hover:border-sky-300 transition"
            >
              Trending This Week
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRENDING_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/trending/${cat.slug}`}
                className="block rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
              >
                <h2 className="font-semibold text-slate-900">{cat.title}</h2>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{cat.intro}</p>
                <span className="mt-3 inline-block text-sm font-medium text-sky-600">
                  View trending →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Examples →
            </Link>
            <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Answers →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              All tools →
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
