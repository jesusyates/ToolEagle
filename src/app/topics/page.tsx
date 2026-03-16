import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { TOPICS } from "@/config/topics";
import { Tag } from "lucide-react";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Content Topics | ToolEagle",
  description:
    "Explore content by topic: fitness, motivation, business, food, travel. Examples, answers, and tools for creators.",
  alternates: { canonical: `${BASE_URL}/topics` },
  openGraph: {
    title: "Content Topics | ToolEagle",
    description: "Explore creator content by topic.",
    url: `${BASE_URL}/topics`
  }
};

export default function TopicsIndexPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <div className="flex items-center gap-2">
              <Tag className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Content Topics
              </h1>
            </div>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Explore examples, answers, and tools by topic. Find inspiration for your niche.
            </p>
            <div className="mt-6">
              <Link
                href="/examples"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Browse examples →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => (
              <Link
                key={topic.slug}
                href={`/topics/${topic.slug}`}
                className="block rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
              >
                <h2 className="font-semibold text-slate-900">{topic.title}</h2>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{topic.intro}</p>
                <span className="mt-3 inline-block text-sm font-medium text-sky-600">
                  Explore →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Examples →
            </Link>
            <Link href="/search" className="text-sm font-medium text-sky-600 hover:underline">
              Search examples →
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
