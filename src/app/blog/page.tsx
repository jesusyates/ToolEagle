import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";

export const metadata = {
  title: "Creator Resources & Tips",
  description:
    "Articles, tips and case studies on how to use ToolEagle tools to publish better content, faster."
};

const posts = [
  {
    slug: "tiktok-caption-ideas",
    title: "50 TikTok Caption Ideas that Actually Work",
    description:
      "Caption formulas and angles you can plug into ToolEagle’s TikTok Caption Generator.",
    tag: "TikTok"
  },
  {
    slug: "how-to-go-viral-on-tiktok",
    title: "How to Go Viral on TikTok in 2026",
    description: "A simple framework for hooks, pacing and captions.",
    tag: "TikTok"
  },
  {
    slug: "best-hashtags-for-reels",
    title: "Best Hashtags for Reels in 2026",
    description: "How to use hashtags to get more reach without looking spammy.",
    tag: "Reels"
  },
  {
    slug: "youtube-title-formulas",
    title: "YouTube Title Formulas that Drive Clicks",
    description: "Battle-tested title patterns you can adapt in seconds.",
    tag: "YouTube"
  }
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-10 pb-16">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              Resources
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Creator playbook & case studies
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Short, practical articles on how real creators use ToolEagle tools to publish better
              content, faster.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-sky-500/70 hover:bg-slate-900 transition"
              >
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                  <span className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/70">
                    {post.tag}
                  </span>
                  <span>Playbook</span>
                </div>
                <h2 className="text-sm font-semibold text-slate-50">
                  {post.title}
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  {post.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

