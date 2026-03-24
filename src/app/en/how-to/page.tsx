import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { getAllEnHowToSlugs, getEnHowToContent } from "@/lib/en-how-to-content";
import { EN_HOW_TO_CATEGORIES, inferEnHowToCategory } from "@/lib/en-how-to-categories";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "How-To Guides for Creators",
  description:
    "Learn how to grow on TikTok, monetize your content, and create click-worthy YouTube titles. Free guides for creators.",
  openGraph: {
    title: "How-To Guides for Creators | ToolEagle",
    description:
      "Learn how to grow on TikTok, monetize your content, and create click-worthy YouTube titles.",
    url: `${BASE_URL}/en/how-to`,
    type: "website"
  }
};

export default function EnHowToHubPage() {
  const slugs = getAllEnHowToSlugs();
  const items = slugs
    .map((slug) => getEnHowToContent(slug))
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const categoryStats = EN_HOW_TO_CATEGORIES.map((c) => ({
    ...c,
    count: items.filter((item) => inferEnHowToCategory(item.slug) === c.slug).length
  }));

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container pt-6 pb-12">
          <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">All categories</h2>
                <ul className="mt-3 space-y-2">
                  {categoryStats.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/en/how-to/category/${cat.slug}`}
                        className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                      >
                        <span>{cat.label}</span>
                        <span className="text-xs tabular-nums text-slate-500">{cat.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="max-w-4xl">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-lg">
                <div className="relative px-6 py-12 sm:px-10 sm:py-16">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(99,102,241,0.35),transparent_42%),linear-gradient(135deg,#020617,#0f172a_45%,#1e1b4b)]" />
                  <div className="absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
                  <div className="absolute -right-12 bottom-1/4 h-52 w-52 rounded-full bg-indigo-400/15 blur-3xl" />
                  <div className="relative max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/95">
                      Creator Playbooks
                    </p>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                      Learn what works before you publish
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-slate-200">
                      Practical guides for TikTok, YouTube, and Instagram creators. Build better content systems,
                      grow your audience, and turn ideas into consistent output with proven workflows.
                    </p>
                  </div>
                </div>
              </section>

            <div className="mt-10">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Browse all tools →
              </Link>
            </div>
          </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
