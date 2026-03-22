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
import { DataSignalBlock } from "@/components/seo/DataSignalBlock";
import { ZhToolEmbeddingSentence } from "@/components/seo/ZhToolEmbeddingSentence";
import { RelatedQuestionsBlock } from "@/components/seo/RelatedQuestionsBlock";
import { AnswerIndexBlock } from "@/components/seo/AnswerIndexBlock";
import { AIAnswerBlock } from "@/components/seo/AIAnswerBlock";
import { MultiQuestionBlock } from "@/components/seo/MultiQuestionBlock";
import { ComparisonAnswerBlock } from "@/components/seo/ComparisonAnswerBlock";
import { ZhFreshnessBlock } from "@/components/zh/ZhFreshnessBlock";
import { EnAuthorBlock } from "@/components/seo/EnAuthorBlock";
import { TrustFooterBlock } from "@/components/seo/TrustFooterBlock";
import { ShareStrategyBlockWithLog } from "@/components/seo/ShareStrategyBlockWithLog";
import { CreatorsUsingBlock } from "@/components/seo/CreatorsUsingBlock";
import { EnAffiliateMonetizationBlock } from "@/components/seo/EnAffiliateMonetizationBlock";
import { getEnExpansionBlock } from "@/lib/en-content-expansion";
import { getSourceCitation } from "@/lib/source-citations";
import { getEnRelatedLinks } from "@/lib/related-questions-data";
import {
  getShortAnswersForEnPage,
  getRelatedQuestionsWithLinks,
  getComparisonData
} from "@/lib/ai-citation-data";
import { getDataSignals, inferDataSignalTopic } from "@/lib/data-signals";
import { parseZhFaqForSchema, buildZhFaqSchemaWithDirectAnswer, buildZhArticleSchema } from "@/lib/zh-ctr";
import { buildBreadcrumbSchema } from "@/lib/zh-breadcrumb-schema";
import { BASE_URL } from "@/config/site";
import { getEnHowToContent, getAllEnHowToSlugs, type EnHowToContent } from "@/lib/en-how-to-content";
import { ZhPageViewTracker } from "@/components/zh/ZhPageViewTracker";
import { BRAND_CTA } from "@/lib/branding";
import { PeopleReadingMoneyBlock } from "@/components/traffic/PeopleReadingMoneyBlock";

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
  /** V88: Locale for multi-language routes. Default "en". */
  locale?: "en" | "es" | "pt" | "id";
};

export async function EnHowToPageTemplate({ content, locale = "en" }: Props) {
  const tool = tools.find((t) => t.slug === content.primaryTool);
  const relatedTools = tools
    .filter(
      (t) =>
        t.category === tool?.category ||
        ["Captions", "Hooks", "Titles"].includes(t.category)
    )
    .slice(0, 6);

  const basePath = locale === "en" ? "/en" : `/${locale}`;
  const pageUrl = `${BASE_URL}${basePath}/how-to/${content.slug}`;
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
    { name: "How-To Guides", url: `${basePath}/how-to` },
    { name: content.title, url: `${basePath}/how-to/${content.slug}` }
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
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
      <ZhPageViewTracker slug={content.slug} keyword={content.title} pageType="en-how-to" />

      <div className="flex-1">
        <article className="container py-12 lg:pr-32">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-slate-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href={`${basePath}/how-to`} className="hover:text-slate-700">
                How-To Guides
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">{content.title}</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {content.title}
            </h1>

            <ZhFreshnessBlock lang="en" />

            <DirectAnswerBlock answer={content.directAnswer} lang="en" />
            <DataSignalBlock
              signals={getDataSignals(inferDataSignalTopic(content.slug), "en", 2, content.slug)}
              lang="en"
            />

            {/* V89: 3-5 short answer blocks - what, how, how long, worth it, best tool */}
            <section className="mt-8" aria-label="Quick answers">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Answers</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {getShortAnswersForEnPage(
                  content.slug,
                  content.title,
                  content.directAnswer,
                  content.primaryTool
                ).map((a, i) => (
                  <AIAnswerBlock
                    key={i}
                    question={a.question}
                    answer={a.answer}
                    href={a.href}
                    linkLabel={a.linkLabel}
                    authority={a.authority}
                    lang="en"
                  />
                ))}
              </div>
            </section>

            <div className="mt-6 prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed">
                {getSourceCitation(content.slug, "en")}{content.intro}
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

            <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-slate-700 leading-relaxed">{getEnExpansionBlock(content.slug)}</p>
            </section>

            <EnAffiliateMonetizationBlock slug={content.slug} keyword={content.title} />

            {/* V89: Comparison Answer Block for comparison pages */}
            {(() => {
              const comp = getComparisonData(content.slug);
              return comp ? (
                <ComparisonAnswerBlock
                  title={comp.title}
                  items={comp.items}
                  winner={comp.winner}
                  recommendation={comp.recommendation}
                  href={comp.href}
                  linkLabel={comp.linkLabel}
                  lang="en"
                />
              ) : null;
            })()}

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
                Generate captions, hooks, and titles in seconds with ToolEagle&apos;s free AI tools.
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
                Generate Content with ToolEagle
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Create captions and hooks in seconds with ToolEagle. No sign-up required.
              </p>
              <Link
                href={`/tools/${content.primaryTool}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition duration-150"
              >
                {BRAND_CTA.generate} →
              </Link>
            </section>

            {/* V89: Multi-question expansion - 5-10 related questions with links */}
            <MultiQuestionBlock
              questions={getRelatedQuestionsWithLinks(
                content.slug,
                "en",
                getAllEnHowToSlugs(),
                (s) => `${basePath}/how-to/${s}`,
                (s) => {
                  const c = getEnHowToContent(s);
                  return c?.title ?? s;
                },
                10
              )}
              lang="en"
            />

            <RelatedQuestionsBlock
              links={getEnRelatedLinks(content.slug, content.title, 20)}
              lang="en"
            />

            <AnswerIndexBlock
              topic={content.title}
              links={getEnRelatedLinks(content.slug, content.title, 20)}
              lang="en"
            />

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">
                More Guides
              </h2>
              <ul className="mt-3 space-y-2">
                {getAllEnHowToSlugs()
                  .filter((s) => s !== content.slug)
                  .slice(0, 8)
                  .map((slug) => {
                    const item = getEnHowToContent(slug);
                    return item ? (
                      <li key={slug}>
                        <Link
                          href={`${basePath}/how-to/${slug}`}
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

            <ShareStrategyBlockWithLog
              title={content.title}
              oneLiner={content.directAnswer?.slice(0, 150) || content.description?.slice(0, 150) || content.intro?.slice(0, 150) || ""}
              pageUrl={pageUrl}
              slug={content.slug}
              keyword={content.title}
              lang={locale === "es" ? "es" : locale === "pt" ? "pt" : "en"}
            />

            <PeopleReadingMoneyBlock excludeSlug={content.slug} lang="en" />

            <CreatorsUsingBlock slug={content.slug} pathType="en-how-to" lang="en" />

            <EnAuthorBlock />
            <TrustFooterBlock lang="en" />
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
