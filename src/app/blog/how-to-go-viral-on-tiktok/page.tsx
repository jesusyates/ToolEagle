import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const metadata = {
  title: "How to Go Viral on TikTok",
  description:
    "A simple framework for going viral on TikTok using hooks, captions, titles and hashtags."
};

export default function HowToGoViralOnTikTokPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="max-w-3xl mx-auto px-4 pt-10 pb-16 prose prose-invert prose-sm sm:prose-base">
          <h1>How to Go Viral on TikTok in 2026</h1>
          <p>
            This article will eventually outline a simple, repeatable process for planning TikToks,
            crafting hooks and pairing them with strong captions and hashtags.
          </p>
          <p>
            For now it serves as a landing page that supports your tools: TikTok Caption Generator,
            Hook Generator and Hashtag Generator.
          </p>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}

