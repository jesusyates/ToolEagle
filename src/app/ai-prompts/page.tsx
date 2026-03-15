import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PROMPT_CATEGORIES } from "@/config/prompt-library";
import { Sparkles } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";

export const metadata: Metadata = {
  title: "AI Prompt Library | 50+ Ready-to-Use Prompts",
  description:
    "Free library of AI prompts for content creation, marketing, business, coding and study. Copy and use in ChatGPT, Claude, or ToolEagle tools.",
  alternates: { canonical: `${BASE_URL}/ai-prompts` },
  openGraph: {
    title: "AI Prompt Library | ToolEagle",
    description: "50+ ready-to-use AI prompts. Copy and customize.",
    url: `${BASE_URL}/ai-prompts`
  }
};

export default function AiPromptsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                AI Prompt Library
              </h1>
            </div>
            <p className="mt-3 text-slate-600">
              50+ prompts for content creation, marketing, business, coding and study. Copy and use in ChatGPT, Claude, or our tools.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {PROMPT_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/ai-prompts/${cat.slug}`}
                  className="block rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
                >
                  <h2 className="font-semibold text-slate-900">{cat.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">10 prompts</p>
                </Link>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/ai-prompt-improver" className="text-sm font-medium text-sky-600 hover:underline">
                Improve your prompts →
              </Link>
              <Link href="/learn-ai" className="text-sm font-medium text-sky-600 hover:underline">
                Learn to talk to AI →
              </Link>
              <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
                Use this prompt in ToolEagle tools →
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
