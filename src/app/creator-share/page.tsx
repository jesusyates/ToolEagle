import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { CreatorShareClient } from "./CreatorShareClient";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Creator Share | ToolEagle",
  description:
    "Generate Twitter, Reddit, and LinkedIn posts from your creator content. Share captions and hooks across platforms.",
  alternates: { canonical: `${BASE_URL}/creator-share` },
  openGraph: {
    title: "Creator Share | ToolEagle",
    description: "Generate Twitter, Reddit, and LinkedIn posts from your content.",
    url: `${BASE_URL}/creator-share`
  }
};

export default function CreatorSharePage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Creator Share
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Paste your example content to generate shareable posts for Twitter, Reddit, and LinkedIn.
            </p>
            <div className="mt-4">
              <Link
                href="/examples"
                className="text-sm font-medium text-sky-600 hover:underline"
              >
                Browse creator examples →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <CreatorShareClient />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
