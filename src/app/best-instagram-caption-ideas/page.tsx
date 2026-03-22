import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { getMagnetExamples } from "@/config/seo/content-templates";

export const metadata = {
  title: "200 Best Instagram Caption Ideas (2026)",
  description:
    "Instagram caption ideas for Reels, posts and stories. Copy, share, or generate more with AI. Free and shareable.",
  openGraph: {
    title: "200 Best Instagram Caption Ideas (2026)",
    description: "Instagram caption ideas for Reels and posts. Copy or generate more with AI."
  }
};

export default function BestInstagramCaptionIdeasPage() {
  const examples = getMagnetExamples("captions", 200);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              200 Best Instagram Caption Ideas (2026)
            </h1>
            <p className="mt-4 text-xl text-slate-700 leading-relaxed">
              Instagram caption ideas for Reels, posts and stories. Copy what works, or generate more with our free AI tool.
            </p>

            <SeoToolCTA
              toolName="Instagram Caption Generator"
              toolSlug="instagram-caption-generator"
              description="Generate viral Instagram captions instantly with AI"
              icon={<span className="text-2xl">📸</span>}
            />

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">200 Instagram Caption Ideas</h2>
              <p className="mt-2 text-sm text-slate-600">
                Copy any caption below. Works for Reels, feed posts and stories.
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
                Need captions for your niche? Use our free Instagram Caption Generator.
              </p>
              <Link
                href="/tools/instagram-caption-generator"
                className="mt-4 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Generate with AI →
              </Link>
            </section>

            <div className="mt-10">
              <Link href="/instagram" className="text-sm font-medium text-sky-600 hover:underline">
                Browse all Instagram tools →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
