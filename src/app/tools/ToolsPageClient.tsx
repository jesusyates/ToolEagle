"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { tools, toolCategories, popularToolSlugs, type ToolConfig } from "@/config/tools";
import { getToolUsageCounts } from "@/lib/storage";
import { ToolCard } from "@/components/tools/ToolCard";

function filterTools(toolsList: ToolConfig[], query: string): ToolConfig[] {
  const q = query.trim().toLowerCase();
  if (!q) return toolsList;
  return toolsList.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
  );
}

function getBadgeForTool(
  slug: string,
  usageCounts: Record<string, number>,
  tool: ToolConfig
): "Popular" | "Trending" | undefined {
  const sorted = [...tools]
    .filter((t) => (usageCounts[t.slug] ?? 0) > 0)
    .sort((a, b) => (usageCounts[b.slug] ?? 0) - (usageCounts[a.slug] ?? 0));
  const popularSlugs = new Set(sorted.slice(0, 6).map((t) => t.slug));
  const trendingSlugs = new Set(sorted.slice(6, 12).map((t) => t.slug));
  if (popularSlugs.has(slug)) return "Popular";
  if (trendingSlugs.has(slug)) return "Trending";
  if (tool.isPopular && Object.keys(usageCounts).length === 0) return "Popular";
  return undefined;
}

export function ToolsPageClient() {
  const [search, setSearch] = useState("");
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setUsageCounts(getToolUsageCounts());
  }, []);

  const filteredByCategory = toolCategories.map((category) => {
    const categoryTools = tools.filter((t) => t.category === category);
    const filtered = filterTools(categoryTools, search);
    return { category, tools: filtered };
  });

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

          <div className="mt-6">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools..."
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80 transition duration-150"
            />
          </div>

          <section className="mt-10">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Popular tools</h2>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                Trending
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Most used by creators. Start here.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularToolSlugs
                .map((slug) => tools.find((t) => t.slug === slug))
                .filter(Boolean)
                .map((tool) =>
                  tool ? (
                    <ToolCard
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      icon={tool.icon}
                      name={tool.name}
                      description={tool.description}
                      category={tool.category}
                      badge={getBadgeForTool(tool.slug, usageCounts, tool)}
                    />
                  ) : null
                )}
            </div>
          </section>

          <div className="mt-12 space-y-12">
            {filteredByCategory.map(({ category, tools: categoryTools }) => {
              if (categoryTools.length === 0) return null;

              return (
                <section key={category} className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {category}
                      </h2>
                      <p className="text-sm text-slate-600">
                        Tools to help with your {category.toLowerCase()}.
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {categoryTools.length} tools
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryTools.map((tool) => (
                      <ToolCard
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        icon={tool.icon}
                        name={tool.name}
                        description={tool.description}
                        category={tool.category}
                        badge={getBadgeForTool(tool.slug, usageCounts, tool)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
