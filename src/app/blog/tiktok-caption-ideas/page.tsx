import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const metadata = {
  title: "TikTok Caption Ideas",
  description:
    "Caption formulas and examples you can plug into ToolEagle’s TikTok Caption Generator."
};

export default function TikTokCaptionIdeasPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="max-w-3xl mx-auto px-4 pt-10 pb-16 prose prose-invert prose-sm sm:prose-base">
          <h1>50 TikTok Caption Ideas that Actually Work</h1>
          <p>
            This placeholder article exists as an SEO landing page. Over time you can expand it with
            real examples and screenshots from your own content or creators you like.
          </p>
          <p>
            For now, think of it as a resource hub that supports the TikTok Caption Generator tool
            by capturing search traffic for &quot;TikTok caption ideas&quot; and similar queries.
          </p>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}

