import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";

export const metadata = {
  title: "Tools",
  description:
    "Browse ToolEagle tools for creators: captions, hashtags, hooks and more."
};

const tools = [
  {
    slug: "tiktok-caption-generator",
    name: "TikTok Caption Generator",
    description:
      "Turn a simple idea into a ready-to-post TikTok caption with hooks, emojis and hashtags."
  },
  {
    slug: "hashtag-generator",
    name: "Hashtag Generator",
    description: "Generate niche-friendly hashtags for TikTok, Reels and Shorts."
  },
  {
    slug: "hook-generator",
    name: "Hook Generator",
    description: "Create scroll-stopping hooks for short-form videos and carousels."
  },
  {
    slug: "title-generator",
    name: "Title Generator",
    description: "Generate titles for YouTube, TikTok, Reels and Shorts."
  }
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-10 pb-16">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              Tools
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Free tools for every creator
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              ToolEagle is building a small, focused set of utilities to help you move from idea to
              published content faster.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/80 rounded-2xl"
              >
                <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-sky-500/60 hover:bg-slate-900 transition h-full">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
                    Live
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-50">
                    {tool.name}
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-300">
                    {tool.description}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

