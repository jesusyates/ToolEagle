import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getTopic, getAllTopicSlugs } from "@/config/topics";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";
import { getRelatedContent } from "@/lib/related-content";
import { Zap } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";
const HOOK_TOOLS = ["hook-generator", "youtube-hook-generator"];

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return getAllTopicSlugs().map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const t = getTopic(topic);
  if (!t) return { title: "Not Found" };
  const label = topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${label} Hooks | ToolEagle`;
  const description = `Best ${label.toLowerCase()} hooks for YouTube, TikTok and Shorts. Copy examples or generate your own with AI.`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/hooks-for/${topic}` },
    openGraph: { title, description, url: `${BASE_URL}/hooks-for/${topic}` }
  };
}

export default async function HooksForPage({ params }: Props) {
  const { topic } = await params;
  const t = getTopic(topic);
  if (!t) notFound();

  const label = topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const term = topic.replace(/-/g, " ");
  const supabase = await createClient();

  const { data: examples } = await supabase
    .from("public_examples")
    .select("slug, tool_name, result, creator_username")
    .in("tool_slug", HOOK_TOOLS)
    .ilike("result", `%${term}%`)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(12);

  const fallback = (examples?.length ?? 0) === 0
    ? await supabase
        .from("public_examples")
        .select("slug, tool_name, result, creator_username")
        .in("tool_slug", HOOK_TOOLS)
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(12)
    : null;

  const displayExamples = (examples?.length ? examples : fallback?.data) ?? [];
  const related = await getRelatedContent({ topic, limit: 6 });
  const tool = tools.find((x) => x.slug === "hook-generator");

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/hooks" className="text-sm font-medium text-sky-600 hover:underline">← Hooks</Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {label} Hooks
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">
            {label} hooks for YouTube, TikTok and Shorts. Copy these examples or generate your own with AI.
          </p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Example hooks</h2>
            {displayExamples.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {displayExamples.map((ex) => (
                  <li key={ex.slug}>
                    <Link
                      href={`/examples/${ex.slug}`}
                      className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition"
                    >
                      <p className="text-sm text-slate-800 line-clamp-3">{ex.result}</p>
                      {ex.creator_username && (
                        <span className="mt-1 text-xs text-slate-500">@{ex.creator_username}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No examples yet. Generate your own below!</p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Tips</h2>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li>• Hook in the first 2 seconds</li>
              <li>• Create curiosity or promise a payoff</li>
              <li>• Keep under 80 characters</li>
              <li>• Test different angles</li>
            </ul>
          </section>

          <SeoToolCTA
            toolName={tool?.name ?? "Hook Generator"}
            toolSlug="hook-generator"
            description={`Generate ${label.toLowerCase()} hooks instantly with AI`}
            icon={<Zap className="h-6 w-6 text-amber-500" />}
            buttonLabel={`Generate ${label} Hooks`}
          />

          <RelatedContentCard examples={related.examples} answers={related.answers} />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/hooks" className="text-sm font-medium text-sky-600 hover:underline">All Hooks</Link>
            <Link href="/captions" className="text-sm font-medium text-sky-600 hover:underline">Captions</Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">AI Tools</Link>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
