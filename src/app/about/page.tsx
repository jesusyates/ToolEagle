import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";

export const metadata = {
  title: "About",
  description: "ToolEagle’s mission is to give every creator free, focused tools."
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="max-w-3xl mx-auto px-4 pt-10 pb-16 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
            About ToolEagle
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            ToolEagle exists to give creators a small set of free, focused tools that remove
            friction between ideas and published work.
          </p>
          <p className="text-sm sm:text-base text-slate-300">
            Instead of bloated dashboards and endless settings, ToolEagle focuses on one clear
            question: &quot;What text do you need right now to ship your next piece of content?&quot;
          </p>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

