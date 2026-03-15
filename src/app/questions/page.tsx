import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { answerQuestions } from "@/config/answer-questions";
import { HelpCircle } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

export const metadata: Metadata = {
  title: "Creator Questions | ToolEagle",
  description:
    "Answers to creator questions: TikTok captions, YouTube hooks, Instagram captions. How to write, best practices, and tips.",
  alternates: { canonical: `${BASE_URL}/questions` },
  openGraph: {
    title: "Creator Questions | ToolEagle",
    description: "Answers to creator questions about captions, hooks, and content.",
    url: `${BASE_URL}/questions`
  }
};

export default function QuestionsPage() {
  const popularQuestions = answerQuestions.filter((q) => q.isPopular);
  const newestQuestions = answerQuestions.slice(-15).reverse();
  const byPlatform = {
    tiktok: answerQuestions.filter((q) => q.platform === "tiktok"),
    youtube: answerQuestions.filter((q) => q.platform === "youtube"),
    instagram: answerQuestions.filter((q) => q.platform === "instagram")
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Creator Questions
              </h1>
            </div>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Quick answers on captions, hooks, hashtags, and more. Click any question for the full answer.
            </p>
            <div className="mt-6">
              <Link
                href="/answers"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Browse all answers →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="max-w-3xl space-y-12">
            {popularQuestions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Popular questions</h2>
                <ul className="space-y-3">
                  {popularQuestions.map((q) => (
                    <li key={q.slug}>
                      <Link
                        href={`/answers/${q.slug}`}
                        className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 hover:bg-sky-50/50 transition"
                      >
                        <span className="font-medium text-slate-900">{q.question}</span>
                        <span className="ml-2 text-sm text-sky-600">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {newestQuestions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Newest questions</h2>
                <ul className="space-y-3">
                  {newestQuestions.map((q) => (
                    <li key={q.slug}>
                      <Link
                        href={`/answers/${q.slug}`}
                        className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 hover:bg-sky-50/50 transition"
                      >
                        <span className="font-medium text-slate-900">{q.question}</span>
                        <span className="ml-2 text-sm text-sky-600">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(["tiktok", "youtube", "instagram"] as const).map((platform) => {
              const questions = byPlatform[platform];
              const label = PLATFORM_LABELS[platform] ?? platform;
              return (
                <div key={platform}>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">{label}</h2>
                  <ul className="space-y-3">
                    {questions.map((q) => (
                      <li key={q.slug}>
                        <Link
                          href={`/answers/${q.slug}`}
                          className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 hover:bg-sky-50/50 transition"
                        >
                          <span className="font-medium text-slate-900">{q.question}</span>
                          <span className="ml-2 text-sm text-sky-600">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
              All answers →
            </Link>
            <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
              Trending content →
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
