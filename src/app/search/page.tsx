import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { SearchClient } from "./SearchClient";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Search Examples | ToolEagle",
  description:
    "Search creator examples, captions, and hooks. Find inspiration for your next TikTok, YouTube, or Instagram content.",
  alternates: { canonical: `${BASE_URL}/search` },
  openGraph: {
    title: "Search Examples | ToolEagle",
    description: "Search captions and hooks from the creator community.",
    url: `${BASE_URL}/search`
  }
};

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Search Examples
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Search across captions, hooks, and creator examples. Find inspiration for your next post.
            </p>
            <div className="mt-4">
              <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
                Browse all examples →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <SearchClient />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
