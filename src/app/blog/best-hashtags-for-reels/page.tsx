import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const metadata = {
  title: "Best Hashtags for Reels",
  description:
    "Learn how to choose hashtags for Instagram Reels that actually help discovery instead of hurting it."
};

export default function BestHashtagsForReelsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="max-w-3xl mx-auto px-4 pt-10 pb-16 prose prose-invert prose-sm sm:prose-base">
          <h1>Best Hashtags for Reels in 2026</h1>
          <p>
            This page supports the Hashtag Generator tool by capturing search interest around
            Instagram Reels hashtags. Later you can add concrete examples, lists and niche‑specific
            hashtag sets.
          </p>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}

