import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { tools } from "@/config/tools";
import { AI_DIRECTORY_CATEGORIES, TOOL_CATEGORY_TO_DIRECTORY, DESIGN_TOOL_SLUGS } from "@/config/ai-tools-directory";
import { ToolCard } from "@/components/tools/ToolCard";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "AI Tools Directory for Creators – Video, Writing, Design & Marketing",
  description:
    "Top AI tools for creators: caption generators, hook generators, hashtag tools and more. ToolEagle's free AI tools for TikTok, YouTube and Instagram.",
  alternates: { canonical: `${BASE_URL}/ai-tools-directory` },
  openGraph: {
    title: "AI Tools Directory | ToolEagle",
    description: "Top AI tools for creators. Free caption, hook and hashtag generators.",
    url: `${BASE_URL}/ai-tools-directory`
  }
};

export default function AiToolsDirectoryPage() {
  const toolsByCategory = AI_DIRECTORY_CATEGORIES.map((cat) => ({
    ...cat,
    tools: tools.filter((t) => {
      if (cat.id === "design") return DESIGN_TOOL_SLUGS.includes(t.slug);
      return TOOL_CATEGORY_TO_DIRECTORY[t.category] === cat.id;
    })
  }));

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              AI Tools Directory for Creators
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl">
              Top AI tools for video creators: captions, hooks, hashtags, titles and more. All free. No sign-up required.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Browse all tools →
              </Link>
              <Link
                href="/creator"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Creator Mode →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="space-y-12">
            {toolsByCategory.map((cat) => (
              <div key={cat.id}>
                <h2 className="text-xl font-semibold text-slate-900">{cat.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{cat.description}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.tools.slice(0, 9).map((tool) => (
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
                {cat.tools.length === 0 && (
                  <p className="mt-4 text-sm text-slate-500">More tools coming soon.</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="container pb-16">
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Submit your AI tool</h2>
            <p className="mt-2 text-sm text-slate-600">
              Have an AI tool for creators? Submit it to our directory and get a backlink.
            </p>
            <Link
              href="/submit-ai-tool"
              className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
            >
              Submit your tool →
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
