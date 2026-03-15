import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import {
  getTopic,
  getAllTopicSlugs,
  parseTopicClusterSlug,
  getAllTopicClusterSlugs,
  type TopicClusterType
} from "@/config/topics";
import { answerQuestions } from "@/config/answer-questions";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { Video } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const base = getAllTopicSlugs().map((slug) => ({ slug }));
  const clusters = getAllTopicClusterSlugs().map((slug) => ({ slug }));
  return [...base, ...clusters];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cluster = parseTopicClusterSlug(slug);
  const topic = getTopic(cluster?.baseSlug ?? slug);
  if (!topic) return { title: "Not Found" };

  const clusterLabel =
    cluster?.clusterType === "captions"
      ? " Captions"
      : cluster?.clusterType === "hooks"
        ? " Hooks"
        : cluster?.clusterType === "ideas"
          ? " Ideas"
          : "";
  const title = `${topic.title}${clusterLabel} | ToolEagle`;

  return {
    title,
    description: topic.intro.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/topics/${slug}` },
    openGraph: {
      title,
      description: topic.intro.slice(0, 160),
      url: `${BASE_URL}/topics/${slug}`
    }
  };
}

const CAPTION_TOOL_SLUGS = ["tiktok-caption-generator", "instagram-caption-generator"];
const HOOK_TOOL_SLUGS = ["hook-generator", "youtube-hook-generator"];

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const cluster = parseTopicClusterSlug(slug);
  const baseSlug = cluster?.baseSlug ?? slug;
  const topic = getTopic(baseSlug);
  if (!topic) notFound();

  const clusterType = cluster?.clusterType;
  const toolSlugs =
    clusterType === "captions"
      ? CAPTION_TOOL_SLUGS
      : clusterType === "hooks"
        ? HOOK_TOOL_SLUGS
        : [...CAPTION_TOOL_SLUGS, ...HOOK_TOOL_SLUGS];

  const tool = tools.find((t) => t.slug === topic.toolSlug);
  const ToolIcon = tool?.icon ?? Video;

  const term = baseSlug.replace(/-/g, " ");
  const [examples, blogPosts] = await Promise.all([
    (async () => {
      try {
        const supabase = await createClient();
        const { data } = await supabase
          .from("public_examples")
          .select("slug, tool_name, result, creator_username")
          .in("tool_slug", toolSlugs)
          .ilike("result", `%${term}%`)
          .not("slug", "is", null)
          .order("created_at", { ascending: false })
          .limit(12);
        if ((data?.length ?? 0) > 0) return data ?? [];
        const { data: fallback } = await supabase
          .from("public_examples")
          .select("slug, tool_name, result, creator_username")
          .in("tool_slug", toolSlugs)
          .not("slug", "is", null)
          .order("created_at", { ascending: false })
          .limit(12);
        return fallback ?? [];
      } catch {
        return [];
      }
    })(),
    (async () => {
      try {
        const { getAllPosts } = await import("@/lib/blog");
        const posts = await getAllPosts();
        const term = baseSlug.toLowerCase();
        return posts
          .filter(
            (p) =>
              p.frontmatter.title?.toLowerCase().includes(term) ||
              p.frontmatter.tags?.some((t: string) => t.toLowerCase().includes(term))
          )
          .slice(0, 5);
      } catch {
        return [];
      }
    })()
  ]);

  const relatedAnswers = answerQuestions.filter(
    (q) =>
      q.question.toLowerCase().includes(baseSlug) ||
      ["how-to-write-tiktok-captions", "how-to-write-instagram-captions", "how-to-write-youtube-hooks"].includes(
        q.slug
      )
  ).slice(0, 5);

  const clusterLabel =
    clusterType === "captions"
      ? " Captions"
      : clusterType === "hooks"
        ? " Hooks"
        : clusterType === "ideas"
          ? " Ideas"
          : "";

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/topics" className="text-sm font-medium text-sky-600 hover:underline">
            ← Topics
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {topic.title}{clusterLabel}
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed">{topic.intro}</p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Examples</h2>
            {examples.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {examples.map((ex: any) => (
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
              <p className="mt-2 text-sm text-slate-600">No examples yet. Submit your content!</p>
            )}
            <Link href="/submit" className="mt-2 inline-block text-sm font-medium text-sky-600 hover:underline">
              Submit example →
            </Link>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Related answers</h2>
            <ul className="mt-3 space-y-2">
              {relatedAnswers.map((q) => (
                <li key={q.slug}>
                  <Link href={`/answers/${q.slug}`} className="text-sm font-medium text-sky-600 hover:underline">
                    {q.question} →
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/answers" className="mt-2 inline-block text-sm font-medium text-sky-600 hover:underline">
              All answers →
            </Link>
          </section>

          {blogPosts.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">Blog posts</h2>
              <ul className="mt-3 space-y-2">
                {blogPosts.map((p: any) => (
                  <li key={p.frontmatter.slug}>
                    <Link href={`/blog/${p.frontmatter.slug}`} className="text-sm font-medium text-sky-600 hover:underline">
                      {p.frontmatter.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Library</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/library/tiktok-captions" className="text-sm font-medium text-sky-600 hover:underline">
                  TikTok Captions Library →
                </Link>
              </li>
              <li>
                <Link href="/library/youtube-hooks" className="text-sm font-medium text-sky-600 hover:underline">
                  YouTube Hooks Library →
                </Link>
              </li>
              <li>
                <Link href="/library/instagram-captions" className="text-sm font-medium text-sky-600 hover:underline">
                  Instagram Captions Library →
                </Link>
              </li>
            </ul>
          </section>

          <SeoToolCTA
            toolName={topic.toolName}
            toolSlug={topic.toolSlug}
            description={`Generate ${topic.title.toLowerCase()} with AI`}
            icon={<ToolIcon className="h-6 w-6 text-sky-700" />}
            buttonLabel={`Try ${topic.toolName}`}
          />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/topics" className="text-sm font-medium text-sky-600 hover:underline">
              All topics →
            </Link>
            <Link href={`/topics/${baseSlug}-captions`} className="text-sm font-medium text-sky-600 hover:underline">
              {topic.title} Captions →
            </Link>
            <Link href={`/topics/${baseSlug}-hooks`} className="text-sm font-medium text-sky-600 hover:underline">
              {topic.title} Hooks →
            </Link>
            <Link href={`/topics/${baseSlug}-ideas`} className="text-sm font-medium text-sky-600 hover:underline">
              {topic.title} Ideas →
            </Link>
            <Link href="/captions" className="text-sm font-medium text-sky-600 hover:underline">
              Caption ideas →
            </Link>
            <Link href="/hooks" className="text-sm font-medium text-sky-600 hover:underline">
              Hook ideas →
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Examples →
            </Link>
            <Link href="/library" className="text-sm font-medium text-sky-600 hover:underline">
              Library →
            </Link>
            <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
              Answers →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              All tools →
            </Link>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
