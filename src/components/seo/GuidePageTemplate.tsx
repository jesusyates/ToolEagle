import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ToolCard } from "@/components/tools/ToolCard";
import { GuidePromptCard } from "@/components/seo/GuidePromptCard";
import { GuideContentSection } from "@/components/seo/GuideContentSection";
import { GuideRecommendations } from "@/components/seo/GuideRecommendations";
import { GuideViewTracker } from "@/components/seo/GuideViewTracker";
import { tools } from "@/config/tools";
import { formatTopicLabel } from "@/config/traffic-topics";
import { getGuideContent, getGuidePrompts } from "@/config/guide-content";
import type { GuidePageType } from "@/config/traffic-topics";

type ExampleRow = {
  slug: string;
  tool_name: string;
  result: string;
  creator_username?: string;
};

type GuidePageTemplateProps = {
  pageType: GuidePageType;
  topic: string;
  examples: ExampleRow[];
  primaryTool?: string;
};

export function GuidePageTemplate({
  pageType,
  topic,
  examples,
  primaryTool = "tiktok-caption-generator"
}: GuidePageTemplateProps) {
  const topicLabel = formatTopicLabel(topic);
  const prompts = getGuidePrompts(pageType, topic);

  const tool = tools.find((t) => t.slug === primaryTool);
  const relatedTools = tools
    .filter((t) => t.category === tool?.category || ["Captions", "Hooks", "Titles"].includes(t.category))
    .slice(0, 6);

  const pageTitle =
    pageType === "how-to"
      ? `How to ${topicLabel}`
      : pageType === "ai-prompts"
        ? `AI Prompts for ${topicLabel}`
        : pageType === "content-strategy"
          ? `Content Strategy for ${topicLabel}`
          : `Viral ${topicLabel} Examples`;

  const topicSlugForLinks = topic.includes("tiktok")
    ? "tiktok"
    : topic.includes("youtube")
      ? "youtube"
      : topic.includes("instagram")
        ? "instagram"
        : topic;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <GuideViewTracker pageType={pageType} topic={topic} />
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {pageTitle}
            </h1>
            <div className="mt-6 prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed">
                This guide covers everything you need to {topicLabel.toLowerCase()}: proven strategies, viral examples from real creators, copy-paste AI prompts, and free tools to generate content in seconds. Whether you&apos;re just starting or looking to scale, you&apos;ll find actionable tactics you can use today.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                We&apos;ve compiled the best practices from top creators, algorithm insights, and our own data from thousands of AI-generated pieces of content. Use the examples as inspiration, the prompts with ChatGPT or our tools, and the strategy section to plan your growth. No fluff—just what works.
              </p>
            </div>

            <GuideContentSection pageType={pageType} topic={topic} />

            {examples.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">
                  Examples
                </h2>
                <ul className="mt-4 space-y-2">
                  {examples.slice(0, 10).map((ex, i) => (
                    <li key={ex.slug || i} className="pl-4 border-l-2 border-slate-200">
                      <Link
                        href={`/examples/${ex.slug}`}
                        className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        {ex.result?.slice(0, 120)}
                        {(ex.result?.length ?? 0) > 120 ? "…" : ""}
                      </Link>
                      {ex.creator_username && (
                        <span className="text-xs text-slate-500 ml-2">by @{ex.creator_username}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">
                AI Prompts
              </h2>
              <p className="mt-2 text-slate-600">
                Copy these prompts into ChatGPT or our AI tools to generate viral content.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {prompts.slice(0, 20).map((p, i) => (
                  <GuidePromptCard
                    key={i}
                    prompt={p.prompt}
                    example={p.example}
                    topicSlug={topic}
                    index={i}
                  />
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">
                Tools
              </h2>
              <p className="mt-2 text-slate-600">
                Generate captions, hooks and titles in seconds with our free AI tools.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {relatedTools.map((t) => (
                  <ToolCard
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    icon={t.icon}
                    name={t.name}
                    description={t.description}
                    category={t.category}
                    badge={t.isPopular ? "Popular" : undefined}
                  />
                ))}
              </div>
            </section>

            <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Generate viral content with AI
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Create {topicLabel.toLowerCase()} captions and hooks in seconds. No sign-up required.
              </p>
              <Link
                href={`/tools/${primaryTool}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition duration-150"
              >
                Try {tool?.name ?? "Caption Generator"} →
              </Link>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">
                Related Pages
              </h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href={`/topics/${topicSlugForLinks}`} className="text-sm text-sky-700 hover:underline">
                    {formatTopicLabel(topicSlugForLinks)} Topics
                  </Link>
                </li>
                <li>
                  <Link href={`/examples`} className="text-sm text-sky-700 hover:underline">
                    All Examples
                  </Link>
                </li>
                <li>
                  <Link href={`/library/tiktok-captions`} className="text-sm text-sky-700 hover:underline">
                    Caption Library
                  </Link>
                </li>
                <li>
                  <Link href={`/ai-tools/category/caption`} className="text-sm text-sky-700 hover:underline">
                    AI Caption Tools
                  </Link>
                </li>
                <li>
                  <Link href={`/captions/${topicSlugForLinks}`} className="text-sm text-sky-700 hover:underline">
                    {formatTopicLabel(topicSlugForLinks)} Captions
                  </Link>
                </li>
                <li>
                  <Link href={`/hooks/${topicSlugForLinks}`} className="text-sm text-sky-700 hover:underline">
                    {formatTopicLabel(topicSlugForLinks)} Hooks
                  </Link>
                </li>
              </ul>
            </section>

            <GuideRecommendations pageType={pageType} topic={topic} />

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Browse all tools →
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
              >
                Creator Playbook →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
