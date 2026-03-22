import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { COMPARE_PAGES } from "@/config/compare-pages";
import { Scale } from "lucide-react";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "AI Tool Comparisons | ToolEagle",
  description:
    "Compare ToolEagle with ChatGPT, Jasper, and other AI caption generators. Find the best tool for creator content.",
  alternates: { canonical: `${BASE_URL}/compare` },
  openGraph: {
    title: "AI Tool Comparisons | ToolEagle",
    description: "Compare AI caption generators for creators.",
    url: `${BASE_URL}/compare`
  }
};

export default function CompareIndexPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <div className="flex items-center gap-2">
              <Scale className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Compare AI Tools
              </h1>
            </div>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              See how ToolEagle compares to ChatGPT, Jasper, and other AI caption generators. Built for creators.
            </p>
            <div className="mt-6">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Try ToolEagle →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COMPARE_PAGES.map((page) => (
              <Link
                key={page.slug}
                href={`/compare/${page.slug}`}
                className="block rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
              >
                <h2 className="font-semibold text-slate-900">{page.title}</h2>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{page.intro}</p>
                <span className="mt-3 inline-block text-sm font-medium text-sky-600">
                  Read comparison →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              All tools →
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Examples →
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
