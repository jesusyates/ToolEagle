import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { CAPTION_HOOK_TOPICS, formatTopicLabel } from "@/config/caption-hook-topics";
import { MessageSquareText } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";

export const metadata: Metadata = {
  title: "Caption Ideas by Topic | ToolEagle",
  description: "Browse captions by topic: motivation, gym, business, food, travel, startup, productivity. Copy examples or generate with AI.",
  alternates: { canonical: `${BASE_URL}/captions` },
  openGraph: { title: "Caption Ideas by Topic | ToolEagle", url: `${BASE_URL}/captions` }
};

export default function CaptionsIndexPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container max-w-3xl py-12">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Caption Ideas by Topic
          </h1>
          <p className="mt-4 text-slate-600">
            Browse captions for TikTok and Instagram by topic. Copy examples or generate your own with AI.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {CAPTION_HOOK_TOPICS.map((topic) => (
              <li key={topic}>
                <Link
                  href={`/captions/${topic}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-md transition"
                >
                  <MessageSquareText className="h-5 w-5 text-sky-600" />
                  <span className="font-medium text-slate-900">{formatTopicLabel(topic)}</span>
                  <span className="ml-auto text-sm text-sky-600">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/hooks" className="text-sm font-medium text-sky-600 hover:underline">
              Hook Ideas by Topic →
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
