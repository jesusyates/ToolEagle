import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SeoToolCTA } from "./SeoToolCTA";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";
import { RelatedAITools } from "@/components/tools/RelatedAITools";
import { getRelatedContent } from "@/lib/related-content";
import { tools } from "@/config/tools";
import type { SeoExpansionConfig } from "@/config/seo-expansion";
import { MessageSquareText, Zap } from "lucide-react";

const CAPTION_TOOLS = ["tiktok-caption-generator", "instagram-caption-generator"];
const HOOK_TOOLS = ["hook-generator", "youtube-hook-generator"];

type Props = {
  config: SeoExpansionConfig;
  backHref: string;
  backLabel: string;
};

export async function SeoExpansionTemplate({ config, backHref, backLabel }: Props) {
  const term = config.topic.replace(/-/g, " ");
  const supabase = await createClient();

  const toolSlugs =
    config.pageType === "best-captions" || config.pageType === "caption-ideas"
      ? CAPTION_TOOLS
      : HOOK_TOOLS;

  const { data: examples } = await supabase
    .from("public_examples")
    .select("slug, tool_name, result, creator_username")
    .in("tool_slug", toolSlugs)
    .ilike("result", `%${term}%`)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(12);

  const fallback =
    (examples?.length ?? 0) === 0
      ? await supabase
          .from("public_examples")
          .select("slug, tool_name, result, creator_username")
          .in("tool_slug", toolSlugs)
          .not("slug", "is", null)
          .order("created_at", { ascending: false })
          .limit(12)
      : null;

  const displayExamples = (examples?.length ? examples : fallback?.data) ?? [];
  const related = await getRelatedContent({ topic: config.topic, limit: 6 });
  const tool = tools.find((x) => x.slug === config.toolSlug);
  const ToolIcon = tool?.icon ?? (config.pageType.includes("caption") ? MessageSquareText : Zap);

  return (
    <article className="container max-w-3xl py-12">
      <Link href={backHref} className="text-sm font-medium text-sky-600 hover:underline">
        ← {backLabel}
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
        toolName={config.toolName}
        toolSlug={config.toolSlug}
        description={`Generate ${config.title.toLowerCase()} with AI`}
        icon={<ToolIcon className="h-6 w-6 text-sky-700" />}
        buttonLabel={`Try ${config.toolName}`}
      />

      <RelatedContentCard examples={related.examples} answers={related.answers} />
      <RelatedAITools category={config.pageType === "best-captions" || config.pageType === "caption-ideas" ? "caption" : config.pageType === "best-hooks" ? "hook" : "creator"} limit={4} />

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href={`/captions-for/${config.topic}`} className="text-sm font-medium text-sky-600 hover:underline">
          {config.topic} Captions
        </Link>
        <Link href={`/hooks-for/${config.topic}`} className="text-sm font-medium text-sky-600 hover:underline">
          {config.topic} Hooks
        </Link>
        <Link href={`/ideas/${config.topic}`} className="text-sm font-medium text-sky-600 hover:underline">
          {config.topic} Ideas
        </Link>
        <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
          Creator Examples
        </Link>
        <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
          All tools
        </Link>
      </div>
    </article>
  );
}
