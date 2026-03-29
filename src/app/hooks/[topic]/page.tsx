import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import {
  CAPTION_HOOK_TOPICS,
  getCaptionHookTopic,
  formatTopicLabel
} from "@/config/caption-hook-topics";
import { getRealExamples } from "@/config/seo/content-templates";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { CaptionHookExampleCard } from "@/components/save/CaptionHookExampleCard";
import { Zap } from "lucide-react";
import { BASE_URL } from "@/config/site";
import { limitBuildStaticParams } from "@/lib/build-static-params-limit";

const HOOK_TOOL_SLUGS = ["hook-generator", "youtube-hook-generator"];

type Props = {
  params: Promise<{ topic: string }>;
};

export async function generateStaticParams() {
  return limitBuildStaticParams(CAPTION_HOOK_TOPICS.map((topic) => ({ topic })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const valid = getCaptionHookTopic(topic);
  if (!valid) return { title: "Not Found" };

  const label = formatTopicLabel(topic);
  const title = `${label} Hooks | ToolEagle`;
  const description = `Best ${label.toLowerCase()} hooks for YouTube, TikTok and Shorts. Copy examples or generate your own with AI.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/hooks/${topic}` },
    openGraph: { title, description, url: `${BASE_URL}/hooks/${topic}` }
  };
}

export default async function HookTopicPage({ params }: Props) {
  const { topic } = await params;
  const valid = getCaptionHookTopic(topic);
  if (!valid) notFound();

  const label = formatTopicLabel(topic);
  const term = topic.replace(/-/g, " ");

  const supabase = await createClient();
  let dbExamples: { slug: string; tool_name: string; result: string; creator_username: string | null }[] | null = null;
  try {
    const { data } = await supabase
      .from("public_examples")
      .select("slug, tool_name, result, creator_username")
      .in("tool_slug", HOOK_TOOL_SLUGS)
      .ilike("result", `%${term}%`)
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(12);
    if ((data?.length ?? 0) > 0) dbExamples = data;
    else {
      const { data: fallback } = await supabase
        .from("public_examples")
        .select("slug, tool_name, result, creator_username")
        .in("tool_slug", HOOK_TOOL_SLUGS)
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(12);
      dbExamples = fallback;
    }
  } catch {
    dbExamples = null;
  }

  const curated = getRealExamples("hooks", topic);
  const hasDb = (dbExamples?.length ?? 0) > 0;
  const examples = hasDb
    ? dbExamples!.map((ex: any) => ({ text: ex.result, slug: ex.slug, creator: ex.creator_username }))
    : curated.slice(0, 12).map((text) => ({ text, slug: null as string | null, creator: null as string | null }));

  const tool = tools.find((t) => t.slug === "hook-generator");

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
            ← Back to Examples
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {label} Hooks
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">
            {label} hooks for YouTube, TikTok and Shorts. Copy these examples or generate your own with AI.
          </p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Example hooks</h2>
            {examples.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {examples.map((ex, i) => (
                  <li key={i}>
                    <CaptionHookExampleCard
                      text={ex.text}
                      slug={ex.slug}
                      toolSlug="hook-generator"
                      toolName="Hook Generator"
                      itemType="hook"
                      creatorUsername={ex.creator}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No examples yet. Generate your own below!</p>
            )}
          </section>

          <SeoToolCTA
            toolName={tool?.name ?? "Hook Generator"}
            toolSlug="hook-generator"
            description={`Generate ${label.toLowerCase()} hooks instantly with AI`}
            icon={<Zap className="h-6 w-6 text-sky-700" />}
            buttonLabel={`Generate ${label} Hooks`}
          />

          <RelatedLinks hooks={false} />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/hooks/motivation" className="text-sm font-medium text-sky-600 hover:underline">
              Motivation
            </Link>
            <Link href="/hooks/gym" className="text-sm font-medium text-sky-600 hover:underline">
              Gym
            </Link>
            <Link href="/hooks/business" className="text-sm font-medium text-sky-600 hover:underline">
              Business
            </Link>
            <Link href="/hooks/food" className="text-sm font-medium text-sky-600 hover:underline">
              Food
            </Link>
            <Link href="/hooks/travel" className="text-sm font-medium text-sky-600 hover:underline">
              Travel
            </Link>
            <Link href="/hooks/startup" className="text-sm font-medium text-sky-600 hover:underline">
              Startup
            </Link>
            <Link href="/hooks/productivity" className="text-sm font-medium text-sky-600 hover:underline">
              Productivity
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              All Examples →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              AI Tools →
            </Link>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
