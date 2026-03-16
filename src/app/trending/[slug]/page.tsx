import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getTrendingCategory, getAllTrendingSlugs, TRENDING_PERIODS } from "@/config/trending";
import { sortByTrendingScore } from "@/lib/trending-score";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { Video, MessageSquareText, Zap, User } from "lucide-react";
import { BASE_URL } from "@/config/site";

const CAPTION_SLUGS = ["tiktok-caption-generator", "instagram-caption-generator"];
const HOOK_SLUGS = ["hook-generator", "youtube-hook-generator"];

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const categories = getAllTrendingSlugs().map((slug) => ({ slug }));
  const periods = TRENDING_PERIODS.map((slug) => ({ slug }));
  return [...categories, ...periods];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "today") {
    return {
      title: "Trending Today | ToolEagle",
      description: "Top captions, hooks, and creators trending today. Fresh content from the community.",
      alternates: { canonical: `${BASE_URL}/trending/today` },
      openGraph: { title: "Trending Today | ToolEagle", url: `${BASE_URL}/trending/today` }
    };
  }
  if (slug === "week") {
    return {
      title: "Trending This Week | ToolEagle",
      description: "Top captions, hooks, and creators trending this week. Best content from the community.",
      alternates: { canonical: `${BASE_URL}/trending/week` },
      openGraph: { title: "Trending This Week | ToolEagle", url: `${BASE_URL}/trending/week` }
    };
  }
  const cat = getTrendingCategory(slug);
  if (!cat) return { title: "Not Found" };

  return {
    title: `${cat.title} | ToolEagle`,
    description: cat.intro.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/trending/${slug}` },
    openGraph: {
      title: cat.title,
      description: cat.intro.slice(0, 160),
      url: `${BASE_URL}/trending/${slug}`
    }
  };
}

async function getTrendingByPeriod(period: "today" | "week") {
  const key = cacheKey("trending", period);
  const cached = await cacheGet<{
    topCaptions: { slug: string; tool_name: string; result: string; creator_username: string | null; created_at: string }[];
    topHooks: { slug: string; tool_name: string; result: string; creator_username: string | null; created_at: string }[];
    topCreators: string[];
  }>(key);
  if (cached) return cached;
  const data = await fetchTrendingByPeriod(period);
  await cacheSet(key, data);
  return data;
}

async function fetchTrendingByPeriod(period: "today" | "week") {
  const supabase = await createClient();
  const since = new Date();
  if (period === "today") since.setDate(since.getDate() - 1);
  else since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString();

  const [captionsRes, hooksRes, creatorsRes, likesRes, savesRes] = await Promise.all([
    supabase
      .from("public_examples")
      .select("slug, tool_name, result, creator_username, created_at")
      .in("tool_slug", CAPTION_SLUGS)
      .gte("created_at", sinceStr)
      .not("slug", "is", null)
      .limit(50),
    supabase
      .from("public_examples")
      .select("slug, tool_name, result, creator_username, created_at")
      .in("tool_slug", HOOK_SLUGS)
      .gte("created_at", sinceStr)
      .not("slug", "is", null)
      .limit(50),
    supabase
      .from("public_examples")
      .select("creator_username")
      .gte("created_at", sinceStr)
      .not("creator_username", "is", null),
    supabase.from("example_likes").select("example_slug"),
    supabase
      .from("user_saves")
      .select("example_slug")
      .not("example_slug", "is", null)
  ]);

  const likesMap: Record<string, number> = {};
  for (const r of likesRes.data ?? []) {
    if (r.example_slug) likesMap[r.example_slug] = (likesMap[r.example_slug] ?? 0) + 1;
  }
  const savesMap: Record<string, number> = {};
  for (const r of savesRes.data ?? []) {
    if (r.example_slug) savesMap[r.example_slug] = (savesMap[r.example_slug] ?? 0) + 1;
  }

  const topCaptions = sortByTrendingScore(
    (captionsRes.data ?? []).map((r) => ({ ...r, created_at: r.created_at ?? new Date().toISOString() })),
    likesMap,
    savesMap
  ).slice(0, 15);
  const topHooks = sortByTrendingScore(
    (hooksRes.data ?? []).map((r) => ({ ...r, created_at: r.created_at ?? new Date().toISOString() })),
    likesMap,
    savesMap
  ).slice(0, 15);

  const creatorCounts: Record<string, number> = {};
  for (const r of creatorsRes.data ?? []) {
    if (r.creator_username) {
      creatorCounts[r.creator_username] = (creatorCounts[r.creator_username] ?? 0) + 1;
    }
  }
  const topCreators = Object.entries(creatorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([username]) => username);

  return {
    topCaptions,
    topHooks,
    topCreators
  };
}


export default async function TrendingCategoryPage({ params }: Props) {
  const { slug } = await params;

  if (slug === "today" || slug === "week") {
    const data = await getTrendingByPeriod(slug);
    const periodLabel = slug === "today" ? "Today" : "This Week";

    return (
      <main className="min-h-screen bg-white text-slate-900 flex flex-col">
        <SiteHeader />

        <div className="flex-1">
          <article className="container max-w-3xl py-12">
            <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
              ← Trending Content
            </Link>

            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Trending {periodLabel}
            </h1>
            <p className="mt-6 text-slate-600 leading-relaxed">
              Top captions, hooks, and creators from the community. Automatically updated.
            </p>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-sky-500" />
                Top Captions
              </h2>
              {data.topCaptions.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {data.topCaptions.map((ex) => (
                    <li key={ex.slug}>
                      <Link
                        href={`/examples/${ex.slug}`}
                        className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                      >
                        <p className="text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                        {ex.creator_username && (
                          <span className="mt-1 text-xs text-slate-500">@{ex.creator_username}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No captions yet. Be the first to submit!</p>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Top Hooks
              </h2>
              {data.topHooks.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {data.topHooks.map((ex) => (
                    <li key={ex.slug}>
                      <Link
                        href={`/examples/${ex.slug}`}
                        className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                      >
                        <p className="text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                        {ex.creator_username && (
                          <span className="mt-1 text-xs text-slate-500">@{ex.creator_username}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No hooks yet. Be the first to submit!</p>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-sky-500" />
                Top Creators
              </h2>
              {data.topCreators.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {data.topCreators.map((username) => (
                    <li key={username}>
                      <Link
                        href={`/creators/${username}`}
                        className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                      >
                        @{username}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No creator activity yet.</p>
              )}
            </section>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/trending/today" className="text-sm font-medium text-sky-600 hover:underline">
                Trending Today
              </Link>
              <Link href="/trending/week" className="text-sm font-medium text-sky-600 hover:underline">
                Trending This Week
              </Link>
              <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
                All Trending
              </Link>
              <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
                Examples
              </Link>
              <Link href="/leaderboard" className="text-sm font-medium text-sky-600 hover:underline">
                Leaderboard
              </Link>
            </div>
          </article>
        </div>

        <SiteFooter />
      </main>
    );
  }

  const cat = getTrendingCategory(slug);
  if (!cat) notFound();

  const tool = tools.find((t) => t.slug === cat.toolSlug);
  const ToolIcon = tool?.icon ?? Video;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
            ← Trending Content
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {cat.title}
          </h1>

          <p className="mt-6 text-slate-600 leading-relaxed">{cat.intro}</p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Trending examples</h2>
            <ul className="mt-3 space-y-3">
              {cat.examples.map((ex, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
                >
                  &ldquo;{ex}&rdquo;
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Tips</h2>
            <ol className="mt-3 space-y-2">
              {cat.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="shrink-0 font-medium text-sky-600">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </section>

          <SeoToolCTA
            toolName={cat.toolName}
            toolSlug={cat.toolSlug}
            description={`Generate ${cat.toolName.toLowerCase().replace(" generator", "")}s instantly with AI`}
            icon={<ToolIcon className="h-6 w-6 text-sky-700" />}
            buttonLabel={`Generate with ${cat.toolName}`}
          />

          <section className="mt-10">
            <h2 className="text-sm font-semibold text-slate-700">Related tools</h2>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
                All tools →
              </Link>
              <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
                Creator Examples →
              </Link>
              <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
                Creator Answers →
              </Link>
            </div>
          </section>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
