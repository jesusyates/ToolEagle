import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const metadata = {
  title: "YouTube Title Formulas",
  description:
    "Battle-tested YouTube title formulas and patterns you can adapt for your own channel."
};

export default function YoutubeTitleFormulasPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="max-w-3xl mx-auto px-4 pt-10 pb-16 prose prose-invert prose-sm sm:prose-base">
          <h1>YouTube Title Formulas that Drive Clicks</h1>
          <p>
            Over time this page can hold a library of title formulas, grouped by niche and goal. It
            pairs well with the Title Generator tool by giving creators more ideas to customise.
          </p>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}

