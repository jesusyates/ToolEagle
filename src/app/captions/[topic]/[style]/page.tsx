import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import {
  getCaptionStyleConfig,
  getAllCaptionStyleParams,
  CAPTION_STYLES,
  type CaptionStyle
} from "@/config/caption-styles";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";
import { getRelatedContent } from "@/lib/related-content";
import { tools } from "@/config/tools";
import { MessageSquareText } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";
const CAPTION_TOOLS = ["tiktok-caption-generator", "instagram-caption-generator"];

type Props = { params: Promise<{ topic: string; style: string }> };

export async function generateStaticParams() {
  return getAllCaptionStyleParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic, style } = await params;
  if (!CAPTION_STYLES.includes(style as CaptionStyle)) return { title: "Not Found" };
  const config = getCaptionStyleConfig(topic, style as CaptionStyle);
  if (!config) return { title: "Not Found" };
  return {
    title: config.metaTitle,
    description: config.description.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/captions/${topic}/${style}` },
    openGraph: {
      title: config.metaTitle,
      description: config.description.slice(0, 160),
      url: `${BASE_URL}/captions/${topic}/${style}`
    }
  };
}

export default async function CaptionStylePage({ params }: Props) {
  const { topic, style } = await params;
  if (!CAPTION_STYLES.includes(style as CaptionStyle)) notFound();
  const config = getCaptionStyleConfig(topic, style as CaptionStyle);
  if (!config) notFound();

  const term = topic.replace(/-/g, " ");
  const supabase = await createClient();

  const { data: examples } = await supabase
    .from("public_examples")
    .select("slug, tool_name, result, creator_username")
    .in("tool_slug", CAPTION_TOOLS)
    .ilike("result", `%${term}%`)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(12);

  const fallback =
    (examples?.length ?? 0) === 0
      ? await supabase
          .from("public_examples")
          .select("slug, tool_name, result, creator_username")
          .in("tool_slug", CAPTION_TOOLS)
          .not("slug", "is", null)
          .order("created_at", { ascending: false })
          .limit(12)
      : null;

  const displayExamples = (examples?.length ? examples : fallback?.data) ?? [];
  const related = await getRelatedContent({ topic, limit: 6 });
  const tool = tools.find((x) => x.slug === "tiktok-caption-generator");

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href={`/captions/${topic}`} className="text-sm font-medium text-sky-600 hover:underline">
            ← {config.title.replace(` ${style.charAt(0).toUpperCase() + style.slice(1)} `, " ")}
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {config.title}
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">{config.description}</p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Examples</h2>
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
            <ol className="mt-3 space-y-2">
              {config.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="shrink-0 font-medium text-sky-600">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </section>

          <SeoToolCTA
            toolName="TikTok Caption Generator"
            toolSlug="tiktok-caption-generator"
            description={`Generate ${config.title.toLowerCase()} with AI`}
            icon={<MessageSquareText className="h-6 w-6 text-sky-700" />}
            buttonLabel="Try TikTok Caption Generator"
          />

          <RelatedContentCard examples={related.examples} answers={related.answers} />

          <div className="mt-10 flex flex-wrap gap-4">
            {CAPTION_STYLES.filter((s) => s !== style).map((s) => (
              <Link
                key={s}
                href={`/captions/${topic}/${s}`}
                className="text-sm font-medium text-sky-600 hover:underline"
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} captions
              </Link>
            ))}
            <Link href={`/captions-for/${topic}`} className="text-sm font-medium text-sky-600 hover:underline">
              All {topic} captions
            </Link>
            <Link href="/captions" className="text-sm font-medium text-sky-600 hover:underline">
              Captions
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              All tools
            </Link>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
