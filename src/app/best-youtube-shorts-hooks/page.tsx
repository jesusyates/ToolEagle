import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { getMagnetExamples } from "@/config/seo/content-templates";

export const metadata = {
  title: "200 Best YouTube Shorts Hooks (2026)",
  description:
    "Scroll-stopping hooks for YouTube Shorts. Get more views with these proven opening lines. Copy or generate more with AI.",
  openGraph: {
    title: "200 Best YouTube Shorts Hooks (2026)",
    description: "Scroll-stopping hooks for YouTube Shorts. Copy or generate more with AI."
  }
};

export default function BestYouTubeShortsHooksPage() {
  const examples = getMagnetExamples("hooks", 200);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              200 Best YouTube Shorts Hooks (2026)
            </h1>
            <p className="mt-4 text-xl text-slate-700 leading-relaxed">
              Scroll-stopping hooks for YouTube Shorts. Copy what works, or generate more with our free AI tool.
            </p>

            <SeoToolCTA
              toolName="Hook Generator"
              toolSlug="hook-generator"
              description="Generate viral hooks for Shorts and Reels instantly with AI"
              icon={<span className="text-2xl">⚡</span>}
            />

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">200 YouTube Shorts Hooks</h2>
              <p className="mt-2 text-sm text-slate-600">
                Copy any hook below. The first 2 seconds decide if viewers stay.
              </p>
              <ol className="mt-6 space-y-2 list-decimal list-inside">
                {examples.map((ex, i) => (
                  <li key={i} className="text-slate-700 pl-2">
                    {ex}
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Generate more with AI</h2>
              <p className="mt-2 text-sm text-slate-600">
                Need hooks for your specific niche? Use our free Hook Generator.
              </p>
              <Link
                href="/tools/hook-generator"
                className="mt-4 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Generate with AI →
              </Link>
            </section>

            <div className="mt-10">
              <Link href="/youtube" className="text-sm font-medium text-sky-600 hover:underline">
                Browse all YouTube tools →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
