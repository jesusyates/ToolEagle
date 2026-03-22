import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { LEARN_AI_ARTICLES } from "@/config/learn-ai";
import { BookOpen } from "lucide-react";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Learn to Talk to AI | Prompt Guide & Tips",
  description:
    "Free guides on how to prompt ChatGPT, write better prompts, and communicate with AI. ROLE, TASK, CONTEXT, FORMAT framework.",
  alternates: { canonical: `${BASE_URL}/learn-ai` },
  openGraph: {
    title: "Learn to Talk to AI | ToolEagle",
    description: "Guides on prompting, frameworks, and AI communication.",
    url: `${BASE_URL}/learn-ai`
  }
};

export default async function LearnAiPage() {
  const t = await getTranslations("learnAi");
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {t("title")}
              </h1>
            </div>
            <p className="mt-3 text-slate-600">{t("subtitle")}</p>

            <div className="mt-10 space-y-4">
              {LEARN_AI_ARTICLES.map((article) => (
                <Link
                  key={article.slug}
                  href={`/learn-ai/${article.slug}`}
                  className="block rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
                >
                  <h2 className="font-semibold text-slate-900">{t(`articles.${article.slug}.title`)}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t(`articles.${article.slug}.description`)}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-sky-600">
                    {t("readArticle")}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/ai-prompt-improver" className="text-sm font-medium text-sky-600 hover:underline">
                {t("improvePrompts")}
              </Link>
              <Link href="/ai-prompts" className="text-sm font-medium text-sky-600 hover:underline">
                {t("promptLibrary")}
              </Link>
              <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
                {t("useTools")}
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
