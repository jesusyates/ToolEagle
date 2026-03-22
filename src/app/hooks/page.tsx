import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { CAPTION_HOOK_TOPICS, formatTopicLabel } from "@/config/caption-hook-topics";
import { Zap } from "lucide-react";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Hook Ideas by Topic | ToolEagle",
  description: "Browse hooks by topic: motivation, gym, business, food, travel, startup, productivity. Copy examples or generate with AI.",
  alternates: { canonical: `${BASE_URL}/hooks` },
  openGraph: { title: "Hook Ideas by Topic | ToolEagle", url: `${BASE_URL}/hooks` }
};

export default function HooksIndexPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container max-w-3xl py-12">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Hook Ideas by Topic
          </h1>
          <p className="mt-4 text-slate-600">
            Browse hooks for YouTube, TikTok and Shorts by topic. Copy examples or generate your own with AI.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {CAPTION_HOOK_TOPICS.map((topic) => (
              <li key={topic}>
                <Link
                  href={`/hooks/${topic}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-md transition"
                >
                  <Zap className="h-5 w-5 text-sky-600" />
                  <span className="font-medium text-slate-900">{formatTopicLabel(topic)}</span>
                  <span className="ml-auto text-sm text-sky-600">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/captions" className="text-sm font-medium text-sky-600 hover:underline">
              Caption Ideas by Topic →
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              All Examples →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              AI Tools →
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
