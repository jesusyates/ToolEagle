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
import { MessageSquareText } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";
const CAPTION_TOOL_SLUGS = ["tiktok-caption-generator", "instagram-caption-generator"];

type Props = {
  params: Promise<{ topic: string }>;
};

export async function generateStaticParams() {
  return CAPTION_HOOK_TOPICS.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const valid = getCaptionHookTopic(topic);
  if (!valid) return { title: "Not Found" };

  const label = formatTopicLabel(topic);
  const title = `${label} Captions | ToolEagle`;
  const description = `Best ${label.toLowerCase()} captions for TikTok and Instagram. Copy examples or generate your own with AI.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/captions/${topic}` },
    openGraph: { title, description, url: `${BASE_URL}/captions/${topic}` }
  };
}

export default async function CaptionTopicPage({ params }: Props) {
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
      .in("tool_slug", CAPTION_TOOL_SLUGS)
      .ilike("result", `%${term}%`)
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(12);
    if ((data?.length ?? 0) > 0) dbExamples = data;
    else {
      const { data: fallback } = await supabase
        .from("public_examples")
        .select("slug, tool_name, result, creator_username")
        .in("tool_slug", CAPTION_TOOL_SLUGS)
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(12);
      dbExamples = fallback;
    }
  } catch {
    dbExamples = null;
  }

  const curated = getRealExamples("captions", topic);
  const examples =
    (dbExamples?.length ?? 0) > 0
      ? dbExamples!.map((ex: any) => ex.result)
      : curated.slice(0, 12);

  const tool = tools.find((t) => t.slug === "tiktok-caption-generator");

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
            ← Back to Examples
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {label} Captions
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">
            {label} captions for TikTok and Instagram. Copy these examples or generate your own with AI.
          </p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Example captions</h2>
            {examples.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {examples.map((text, i) => (
                  <li key={i}>
                    <div className="rounded-lg border border-slate-200 px-4 py-3 hover:border-slate-300 transition">
                      <p className="text-sm text-slate-800 line-clamp-3">{text}</p>
                      {dbExamples?.[i]?.creator_username && (
                        <span className="mt-1 text-xs text-slate-500">
                          @{dbExamples[i].creator_username}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No examples yet. Generate your own below!</p>
            )}
          </section>

          <SeoToolCTA
            toolName={tool?.name ?? "TikTok Caption Generator"}
            toolSlug="tiktok-caption-generator"
            description={`Generate ${label.toLowerCase()} captions instantly with AI`}
            icon={<MessageSquareText className="h-6 w-6 text-sky-700" />}
            buttonLabel={`Generate ${label} Captions`}
          />

          <RelatedLinks captions={false} />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/captions/motivation" className="text-sm font-medium text-sky-600 hover:underline">
              Motivation
            </Link>
            <Link href="/captions/gym" className="text-sm font-medium text-sky-600 hover:underline">
              Gym
            </Link>
            <Link href="/captions/business" className="text-sm font-medium text-sky-600 hover:underline">
              Business
            </Link>
            <Link href="/captions/food" className="text-sm font-medium text-sky-600 hover:underline">
              Food
            </Link>
            <Link href="/captions/travel" className="text-sm font-medium text-sky-600 hover:underline">
              Travel
            </Link>
            <Link href="/captions/startup" className="text-sm font-medium text-sky-600 hover:underline">
              Startup
            </Link>
            <Link href="/captions/productivity" className="text-sm font-medium text-sky-600 hover:underline">
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
