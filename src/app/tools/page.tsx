import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { tools, toolCategories } from "@/config/tools";
import { ToolCard } from "@/components/tools/ToolCard";

export const metadata = {
  title: "Tools",
  description:
    "Browse ToolEagle tools for creators: captions, hashtags, hooks and more."
};

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Tools
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Free tools for every creator
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              ToolEagle is building a creator-first toolkit you can scan quickly: captions, hooks,
              titles, ideas and scripts.
            </p>
          </div>

          <div className="mt-10 space-y-10">
            {toolCategories.map((category) => {
              const categoryTools = tools.filter((t) => t.category === category);
              if (categoryTools.length === 0) return null;

              return (
                <div key={category}>
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {category}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {categoryTools.length} tools
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryTools.map((tool) => (
                      <ToolCard
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        icon={tool.icon}
                        name={tool.name}
                        description={tool.description}
                        category={tool.category}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

