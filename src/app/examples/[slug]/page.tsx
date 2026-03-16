import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { ExamplesClient } from "../ExamplesClient";
import { ExampleEmbed } from "@/components/examples/ExampleEmbed";
import { PageShareButtons } from "@/components/share/PageShareButtons";
import { getExampleCategory } from "@/config/example-categories";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";
import { RelatedAITools } from "@/components/tools/RelatedAITools";
import { getRelatedContent } from "@/lib/related-content";
import { ExampleReactions } from "@/components/example/ExampleReactions";
import { ExampleViewTracker } from "@/components/analytics/ExampleViewTracker";
import { RemixButton } from "@/components/remix/RemixButton";
import {
  parseExampleSlug,
  generateVariation,
  getVariationSlugs,
  VARIATION_COUNT
} from "@/lib/example-variations";
import { BASE_URL } from "@/config/site";

const EXAMPLE_TIPS = [
  "Hook in the first line—under 150 characters works best",
  "Use 1–3 emojis max to add personality without cluttering",
  "Add a CTA: follow, comment, save to boost engagement",
  "Match the tone of your video for authenticity",
  "Test different angles and double down on what works"
];

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const category = getExampleCategory(slug);
  if (category) {
    return {
      title: `${category.title} | ToolEagle`,
      description: category.intro.slice(0, 160),
      alternates: { canonical: `${BASE_URL}/examples/${slug}` },
      openGraph: {
        title: `${category.title} | ToolEagle`,
        description: category.intro.slice(0, 160),
        url: `${BASE_URL}/examples/${slug}`
      }
    };
  }

  try {
    const { baseSlug } = parseExampleSlug(slug);
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_examples")
      .select("tool_name, result")
      .eq("slug", baseSlug)
      .single();

    if (!data) return { title: "Example Not Found" };

    const title = `${data.tool_name} Example | ToolEagle`;
    const description = (data.result ?? "").slice(0, 160);

    return {
      title,
      description,
      alternates: { canonical: `${BASE_URL}/examples/${slug}` },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/examples/${slug}`
      }
    };
  } catch {
    return { title: "Example Not Found" };
  }
}

async function getCategoryExamples(toolSlugs: string[]) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_examples")
      .select("slug, tool_name, tool_slug, input, result, creator_username")
      .in("tool_slug", toolSlugs)
      .order("created_at", { ascending: false })
      .limit(24);

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

function ExampleCard({
  slug,
  tool,
  toolSlug,
  prompt,
  result,
  creator
}: {
  slug: string | null;
  tool: string;
  toolSlug: string;
  prompt: string;
  result: string;
  creator: string | null;
}) {
  const card = (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-sky-600">{tool}</span>
        {creator && (
          <Link
            href={`/creators/${creator}`}
            className="text-xs text-slate-500 hover:text-sky-600"
            onClick={(e) => slug && e.stopPropagation()}
          >
            @{creator}
          </Link>
        )}
      </div>
      <p className="text-xs text-slate-500 line-clamp-1">Prompt: {prompt}</p>
      <p className="mt-2 text-sm text-slate-800 line-clamp-3">{result}</p>
      <ExamplesClient text={result} />
    </>
  );
  const className = "block rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition";
  return slug ? (
    <Link href={`/examples/${slug}`} className={className}>
      {card}
    </Link>
  ) : (
    <div className={className}>{card}</div>
  );
}

export default async function ExampleSlugPage({ params }: Props) {
  const { slug } = await params;

  const category = getExampleCategory(slug);
  if (category) {
    const examples = await getCategoryExamples(category.toolSlugs);

    return (
      <main className="min-h-screen bg-white text-slate-900 flex flex-col">
        <SiteHeader />

        <div className="flex-1">
          <article className="container max-w-4xl py-12">
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              ← Creator Examples
            </Link>

            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              {category.title}
            </h1>
            <p className="mt-3 text-lg text-slate-600">{category.intro}</p>

            <section className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Examples</h2>
              {examples.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {examples.map((ex, i) => (
                    <ExampleCard
                      key={ex.slug ?? i}
                      slug={ex.slug}
                      tool={ex.tool}
                      toolSlug={ex.toolSlug}
                      prompt={ex.prompt}
                      result={ex.result}
                      creator={ex.creator}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">
                  No examples yet. Be the first—generate with our {category.toolName} and share to examples.
                </p>
              )}
            </section>

            <section className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Generate your own</h2>
              <p className="mt-2 text-sm text-slate-600">
                Use our {category.toolName} to create captions or hooks like these. Try different prompts and find your style.
              </p>
              <Link
                href={`/tools/${category.toolSlug}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Try {category.toolName} →
              </Link>
            </section>

            <section className="mt-10 flex flex-wrap gap-4">
              <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
                All examples →
              </Link>
              <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
                Trending content →
              </Link>
              <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
                All tools →
              </Link>
            </section>
          </article>
        </div>

        <SiteFooter />
      </main>
    );
  }

  const { baseSlug, variationIndex } = parseExampleSlug(slug);
  const lookupSlug = baseSlug;

  const supabase = await createClient();
  const { data: example } = await supabase
    .from("public_examples")
    .select("tool_name, tool_slug, input, result, creator_username, created_at")
    .eq("slug", lookupSlug)
    .single();

  if (!example) notFound();

  const displayResult =
    variationIndex !== null
      ? generateVariation(example.result ?? "", variationIndex, example.tool_slug ?? "")
      : (example.result ?? "");

  const toolSlug = example.tool_slug ?? "tiktok-caption-generator";

  const [relatedExamplesRes, relatedContent] = await Promise.all([
    supabase
      .from("public_examples")
      .select("slug, tool_name, result, creator_username")
      .eq("tool_slug", toolSlug)
      .not("slug", "is", null)
      .neq("slug", lookupSlug)
      .order("created_at", { ascending: false })
      .limit(6),
    getRelatedContent({
      topic: example.result?.slice(0, 50).replace(/\s+/g, "-").toLowerCase(),
      toolSlug,
      limit: 6
    })
  ]);
  const relatedExamples = relatedExamplesRes.data ?? [];

  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${example.tool_name} Example`,
    description: (example.result ?? "").slice(0, 200),
    text: example.result,
    author: example.creator_username
      ? {
          "@type": "Person",
          name: `@${example.creator_username}`
        }
      : undefined,
    datePublished: example.created_at
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
            ← Creator Examples
          </Link>

          <ExampleViewTracker exampleSlug={lookupSlug} />
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {example.tool_name} Example
            {variationIndex !== null && (
              <span className="ml-2 text-lg font-normal text-slate-500">(Variation {variationIndex})</span>
            )}
          </h1>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {variationIndex !== null ? "Caption" : "Example content"}
            </h2>
            <p className="mt-3 text-slate-800 whitespace-pre-line leading-relaxed">
              {displayResult}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <ExampleReactions exampleSlug={lookupSlug} content={displayResult} />
              <RemixButton
                content={displayResult}
                toolSlug={toolSlug}
                toolName={example.tool_name ?? "Generator"}
              />
              <ExamplesClient text={displayResult} />
              <PageShareButtons
                pageUrl={`${BASE_URL}/examples/${slug}`}
                redditTitle={`${example.tool_name} Example - Creator content from ToolEagle`}
              />
            </div>
            <ExampleEmbed
              content={displayResult}
              pageUrl={`${BASE_URL}/examples/${slug}`}
              toolName={example.tool_name ?? "Creator Example"}
              creator={example.creator_username}
            />
          </div>

          {example.creator_username && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Creator
              </h2>
              <Link
                href={`/creators/${example.creator_username}`}
                className="mt-2 inline-block text-sky-600 hover:underline font-medium"
              >
                @{example.creator_username}
              </Link>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Tips
            </h2>
            <ul className="mt-2 space-y-1 text-slate-600">
              {EXAMPLE_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sky-500">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Why this works
            </h2>
            <p className="mt-2 text-slate-600 leading-relaxed">
              This example uses a clear hook, relatable tone, and engaging format that fits
              short-form content. The best captions and hooks feel natural and add personality
              to your videos.
            </p>
          </section>

          <section className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Generate similar result
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Use our {example.tool_name} to create your own. Try a similar prompt or
              experiment with different angles.
            </p>
            <Link
              href={`/tools/${toolSlug}`}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
            >
              Try {example.tool_name} →
            </Link>
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              More variations
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={`/examples/${lookupSlug}`} className="text-sm font-medium text-sky-600 hover:underline">
                Original
              </Link>
              {getVariationSlugs(lookupSlug).slice(0, 8).map((s, i) => (
                <Link key={s} href={`/examples/${s}`} className="text-sm font-medium text-sky-600 hover:underline">
                  {i + 1}
                </Link>
              ))}
              <Link href="/examples" className="text-sm font-medium text-slate-600 hover:underline">
                All examples →
              </Link>
            </div>
          </section>

          <RelatedContentCard
            examples={relatedContent.examples}
            answers={relatedContent.answers}
          />
          <RelatedAITools limit={4} />
          <RelatedLinks examples={false} />

          {(relatedExamples?.length ?? 0) > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Related examples
              </h2>
              <ul className="mt-3 space-y-2">
                {(relatedExamples ?? []).map((ex) => (
                  <li key={ex.slug}>
                    <Link
                      href={`/examples/${ex.slug}`}
                      className="block rounded-lg border border-slate-200 px-4 py-2 hover:border-sky-300 transition"
                    >
                      <p className="text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                      {ex.creator_username && (
                        <span className="text-xs text-slate-500">@{ex.creator_username}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkSchema) }}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
