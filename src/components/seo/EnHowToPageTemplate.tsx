/**
 * V77: EN how-to page template for AI citation.
 * Same structure as zh: Direct Answer, steps, examples, FAQ, tool recommendation.
 */

import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ToolCard } from "@/components/tools/ToolCard";
import { tools } from "@/config/tools";
import { DirectAnswerBlock } from "@/components/seo/DirectAnswerBlock";
import { ZhToolEmbeddingSentence } from "@/components/seo/ZhToolEmbeddingSentence";
import { parseZhFaqForSchema, buildZhFaqSchemaWithDirectAnswer, buildZhArticleSchema } from "@/lib/zh-ctr";
import { buildBreadcrumbSchema } from "@/lib/zh-breadcrumb-schema";
import { BASE_URL } from "@/config/site";
import { getEnHowToContent, type EnHowToContent } from "@/lib/en-how-to-content";

function renderMarkdownBlock(text: string) {
  const blocks = text.split(/\n(?=## |### )/).filter(Boolean);
  return blocks.map((block, i) => {
    if (block.startsWith("## ")) {
      const rest = block.slice(3).trim();
      const [title, ...contentLines] = rest.split("\n");
      const content = contentLines.join("\n").trim();
      return (
        <div key={i}>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4 first:mt-0">{title}</h2>
          {content && (
            <div className="space-y-2 text-slate-700 leading-relaxed prose prose-slate max-w-none">
              {content.split(/\n\n+/).map((para, j) => (
                <p key={j}>{para}</p>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (block.startsWith("### ")) {
      const rest = block.slice(4).trim();
      const [title, ...contentLines] = rest.split("\n");
      const content = contentLines.join("\n").trim();
      return (
        <div key={i}>
          <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">{title}</h3>
          <p className="text-slate-700 leading-relaxed">{content}</p>
        </div>
      );
    }
    return (
      <p key={i} className="text-slate-700 leading-relaxed">
        {block}
      </p>
    );
  });
}

type Props = {
  content: EnHowToContent;
};

export function EnHowToPageTemplate({ content }: Props) {
  const tool = tools.find((t) => t.slug === content.primaryTool);
  const relatedTools = tools
    .filter(
      (t) =>
        t.category === tool?.category ||
        ["Captions", "Hooks", "Titles"].includes(t.category)
    )
    .slice(0, 6);

  const pageUrl = `${BASE_URL}/en/how-to/${content.slug}`;
  const faqItems = parseZhFaqForSchema(content.faq);
  const faqSchema = buildZhFaqSchemaWithDirectAnswer(
    faqItems,
    content.directAnswer,
    content.title
  );
  const articleSchema = buildZhArticleSchema(
    content.title,
    content.description,
    pageUrl
  );

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "How-To Guides", url: "/en/how-to" },
    { name: content.title, url: `/en/how-to/${content.slug}` }
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {Object.keys(faqSchema).length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12 lg:pr-32">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-slate-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/en/how-to" className="hover:text-slate-700">
                How-To Guides
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">{content.title}</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {content.title}
            </h1>

            <DirectAnswerBlock answer={content.directAnswer} lang="en" />

            <div className="mt-6 prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed">
                {content.intro}
              </p>
              <ZhToolEmbeddingSentence
                toolSlug={content.primaryTool}
                keyword={
                  content.primaryTool.includes("caption")
                    ? "viral captions"
                    : content.primaryTool.includes("title")
                      ? "click-worthy titles"
                      : "content"
                }
                useZhPath={false}
                lang="en"
              />
            </div>

            {content.stepByStep && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">
                  Step-by-Step Guide
                </h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.stepByStep)}
                </div>
              </section>
            )}

            {content.faq && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.faq)}
                </div>
              </section>
            )}

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">Tools</h2>
              <p className="mt-2 text-slate-600">
                Generate captions, hooks, and titles in seconds with our free AI
                tools.
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
                Generate Content with AI
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Create captions and hooks in seconds. No sign-up required.
              </p>
              <Link
                href={`/tools/${content.primaryTool}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition duration-150"
              >
                Try {tool?.name ?? "Caption Generator"} →
              </Link>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">
                More Guides
              </h2>
              <ul className="mt-3 space-y-2">
                {(["grow-on-tiktok", "tiktok-monetization", "youtube-title-ideas"] as const)
                  .filter((s) => s !== content.slug)
                  .map((slug) => {
                    const item = getEnHowToContent(slug);
                    return item ? (
                      <li key={slug}>
                        <Link
                          href={`/en/how-to/${slug}`}
                          className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ) : null;
                  })}
                <li>
                  <Link
                    href="/zh/how-to/grow-on-tiktok"
                    className="text-sm text-slate-600 hover:underline"
                  >
                    中文：TikTok 涨粉指南
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
