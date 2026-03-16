import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getLibraryPage, getAllLibrarySlugs } from "@/config/library-pages";
import { getMagnetExamples } from "@/config/seo/content-templates";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { LibraryExampleCard } from "@/components/save/LibraryExampleCard";
import { MessageSquareText, Zap } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";
const MIN_EXAMPLES = 100;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllLibrarySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getLibraryPage(slug);
  if (!page) return { title: "Not Found" };

  return {
    title: `${page.title} | ToolEagle`,
    description: page.intro.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/library/${slug}` },
    openGraph: {
      title: `${page.title} | ToolEagle`,
      description: page.intro.slice(0, 160),
      url: `${BASE_URL}/library/${slug}`
    }
  };
}

export default async function LibraryPage({ params }: Props) {
  const { slug } = await params;
  const page = getLibraryPage(slug);
  if (!page) notFound();

  const supabase = await createClient();
  const { data: dbExamples } = await supabase
    .from("public_examples")
    .select("slug, tool_name, result, creator_username")
    .in("tool_slug", page.toolSlugs)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(150);

  const isCaption = slug.includes("caption");
  const curated = getMagnetExamples(isCaption ? "captions" : "hooks", MIN_EXAMPLES);

  const dbCount = dbExamples?.length ?? 0;
  const fillCount = Math.max(0, MIN_EXAMPLES - dbCount);
  const fillExamples = curated.slice(0, fillCount).map((result) => ({
    slug: null as string | null,
    tool_name: page.toolName,
    result,
    creator_username: null as string | null
  }));
  const examples = [...(dbExamples ?? []), ...fillExamples];

  const tool = tools.find((t) => t.slug === page.toolSlug);
  const Icon = slug.includes("hook") ? Zap : MessageSquareText;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <Link href="/library" className="text-sm font-medium text-sky-600 hover:underline">
            ← Library
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {page.title}
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">{page.intro}</p>

          <SeoToolCTA
            toolName={page.toolName}
            toolSlug={page.toolSlug}
            description={`Generate more ${page.title.toLowerCase()} with AI`}
            icon={<Icon className="h-6 w-6 text-sky-700" />}
            buttonLabel={`Try ${page.toolName}`}
          />

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">
              {examples.length} Examples
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {examples.map((ex, i) => (
                <li key={ex.slug ?? `curated-${i}`}>
                  <LibraryExampleCard
                    slug={ex.slug}
                    result={ex.result}
                    toolName={page.toolName}
                    toolSlug={page.toolSlug}
                    creatorUsername={ex.creator_username}
                    itemType={isCaption ? "caption" : "hook"}
                  />
                </li>
              ))}
            </ul>
          </section>

          <RelatedLinks library={false} />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/library/tiktok-captions" className="text-sm font-medium text-sky-600 hover:underline">
              TikTok Captions
            </Link>
            <Link href="/library/youtube-hooks" className="text-sm font-medium text-sky-600 hover:underline">
              YouTube Hooks
            </Link>
            <Link href="/library/instagram-captions" className="text-sm font-medium text-sky-600 hover:underline">
              Instagram Captions
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Examples →
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
