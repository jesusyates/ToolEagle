import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { LIBRARY_PAGES } from "@/config/library-pages";
import { MessageSquareText, Zap } from "lucide-react";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Content Library | ToolEagle",
  description: "100+ caption and hook examples for TikTok, YouTube, and Instagram. Copy or generate with AI.",
  alternates: { canonical: `${BASE_URL}/library` },
  openGraph: { title: "Content Library | ToolEagle", url: `${BASE_URL}/library` }
};

export default function LibraryIndexPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container max-w-3xl py-12">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Content Library
          </h1>
          <p className="mt-4 text-slate-600">
            100+ examples for each category. Copy, customize, or generate more with AI.
          </p>

          <ul className="mt-8 space-y-4">
            {LIBRARY_PAGES.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/library/${p.slug}`}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
                >
                  {p.slug.includes("hook") ? (
                    <Zap className="h-8 w-8 text-sky-600" />
                  ) : (
                    <MessageSquareText className="h-8 w-8 text-sky-600" />
                  )}
                  <div>
                    <h2 className="font-semibold text-slate-900">{p.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{p.intro}</p>
                  </div>
                  <span className="ml-auto text-sm text-sky-600">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <RelatedLinks library={false} />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
