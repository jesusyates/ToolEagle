import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { getAnswersByPlatform } from "@/config/answers";
import { HelpCircle } from "lucide-react";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Creator Answers – How to Write Captions, Hooks & Titles",
  description:
    "Quick answers: how to write TikTok captions, YouTube hooks, Instagram captions, best caption length, and viral hooks. With examples, tips, and AI tools.",
  alternates: { canonical: `${BASE_URL}/answers` },
  openGraph: {
    title: "Creator Answers | ToolEagle",
    description: "How to write captions, hooks, and titles. Examples, tips, and AI generators.",
    url: `${BASE_URL}/answers`
  }
};

const PLATFORM_LABELS = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" } as const;

export default function AnswersIndexPage() {
  const { tiktok, youtube, instagram } = getAnswersByPlatform();

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Creator Answers
              </h1>
            </div>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Quick answers: how to write TikTok captions, YouTube hooks, Instagram captions, best caption length, and viral hooks. With examples and AI tools.
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
          <div className="max-w-3xl space-y-10">
            {(["tiktok", "youtube", "instagram"] as const).map((platform) => {
              const pages = platform === "tiktok" ? tiktok : platform === "youtube" ? youtube : instagram;
              const label = PLATFORM_LABELS[platform];
              return (
                <div key={platform}>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">{label}</h2>
                  <div className="space-y-4">
                    {pages.map((page) => (
                      <Link
                        key={page.slug}
                        href={`/answers/${page.slug}`}
                        className="block rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
                      >
                        <h3 className="font-semibold text-slate-900">{page.question}</h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{page.shortAnswer}</p>
                        <span className="mt-3 inline-block text-sm font-medium text-sky-600">
                          Read answer →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/questions" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Questions →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              All tools →
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator examples →
            </Link>
            <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
              Trending content →
            </Link>
            <Link href="/blog" className="text-sm font-medium text-sky-600 hover:underline">
              Blog →
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
