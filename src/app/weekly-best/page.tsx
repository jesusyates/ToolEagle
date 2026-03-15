import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { TRENDING_CATEGORIES } from "@/config/trending";
import { ExamplesClient } from "../examples/ExamplesClient";
import { Trophy } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";

export const metadata: Metadata = {
  title: "Weekly Best Content | ToolEagle",
  description:
    "Top captions, hooks, and creators this week. Curated picks plus trending examples to inspire your next post.",
  alternates: { canonical: `${BASE_URL}/weekly-best` },
  openGraph: {
    title: "Weekly Best Content | ToolEagle",
    description: "Top captions, hooks, and creators this week.",
    url: `${BASE_URL}/weekly-best`
  }
};

export const dynamic = "force-dynamic";

async function getTopExamples() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_examples")
      .select("slug, tool_name, tool_slug, input, result, creator_username")
      .order("created_at", { ascending: false })
      .limit(12);

    return (data ?? []).map((r) => ({
      slug: r.slug ?? null,
      tool: r.tool_name ?? "",
      toolSlug: r.tool_slug ?? "",
      prompt: r.input ?? "",
      result: r.result ?? "",
      creator: r.creator_username ?? null
    }));
  } catch {
    return [];
  }
}

async function getTopCreators() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name")
      .not("username", "is", null)
      .limit(12);

    return (data ?? []).map((p) => ({
      username: p.username ?? "",
      displayName: p.display_name ?? null
    }));
  } catch {
    return [];
  }
}

export default async function WeeklyBestPage() {
  const [examples, creators] = await Promise.all([getTopExamples(), getTopCreators()]);

  const captions = examples.filter(
    (e) =>
      e.toolSlug?.includes("caption") ||
      e.tool?.toLowerCase().includes("caption")
  );
  const hooks = examples.filter(
    (e) =>
      e.toolSlug?.includes("hook") || e.tool?.toLowerCase().includes("hook")
  );
  const otherExamples = examples.filter(
    (e) =>
      !e.toolSlug?.includes("caption") &&
      !e.tool?.toLowerCase().includes("caption") &&
      !e.toolSlug?.includes("hook") &&
      !e.tool?.toLowerCase().includes("hook")
  );
  const topCaptions = captions.slice(0, 4);
  const topHooks = hooks.slice(0, 4);
  const topOther = otherExamples.slice(0, 4);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-amber-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Weekly Best
              </h1>
            </div>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Top captions, hooks, and creators this week. Plus trending examples to inspire your next post.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/trending"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Trending content →
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                All examples →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Top captions</h2>
              {topCaptions.length > 0 ? (
                <ul className="space-y-3">
                  {topCaptions.map((ex, i) => (
                    <li key={ex.slug ?? i}>
                      <ExampleCard ex={ex} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-600 text-sm">No captions yet. Generate and share to examples.</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Top hooks</h2>
              {topHooks.length > 0 ? (
                <ul className="space-y-3">
                  {topHooks.map((ex, i) => (
                    <li key={ex.slug ?? i}>
                      <ExampleCard ex={ex} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-600 text-sm">No hooks yet. Generate and share to examples.</p>
              )}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Top creators</h2>
            {creators.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {creators.map((c) => (
                  <Link
                    key={c.username}
                    href={`/creators/${c.username}`}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 transition"
                  >
                    @{c.username}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm">No creators yet.</p>
            )}
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Trending examples</h2>
            <p className="text-sm text-slate-600 mb-4">
              Formats and styles that are working right now. Adapt to your niche.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRENDING_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/trending/${cat.slug}`}
                  className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
                >
                  <h3 className="font-medium text-slate-900">{cat.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{cat.intro}</p>
                  <span className="mt-2 inline-block text-xs font-medium text-sky-600">
                    View trending →
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
              Trending content →
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator examples →
            </Link>
            <Link href="/questions" className="text-sm font-medium text-sky-600 hover:underline">
              Creator questions →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              All tools →
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

function ExampleCard({
  ex
}: {
  ex: {
    slug: string | null;
    tool: string;
    toolSlug: string;
    prompt: string;
    result: string;
    creator: string | null;
  }
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-sky-600">{ex.tool}</span>
        {ex.creator && (
          <Link href={`/creators/${ex.creator}`} className="text-xs text-slate-500 hover:text-sky-600">
            @{ex.creator}
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-800 line-clamp-2">{ex.result}</p>
      <ExamplesClient text={ex.result} />
    </>
  );

  const className = "block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition";

  return ex.slug ? (
    <Link href={`/examples/${ex.slug}`} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
