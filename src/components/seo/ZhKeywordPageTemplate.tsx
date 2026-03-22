import Link from "next/link";
import {
  getKeywordBySlug,
  getRelatedKeywordsFiltered,
  PLATFORM_NAMES,
  type KeywordEntry
} from "@/lib/keyword-patterns";
import { getMatchingAffiliateTools, getAffiliateTools, getToolsForStack } from "@/config/affiliate-tools";
import { getHighIntentCtaVariant, getHighIntentCtaIndexForSlug } from "@/config/zh-cta-variants";
import { getZhToolMetrics } from "@/lib/zh-tool-metrics";
import { sortToolsByRevenueScore, applyLosingToolSuppression } from "@/lib/revenue-optimizer";
import { ZhToolRecommendationBlock } from "@/components/zh/ZhToolRecommendationBlock";
import { ZhMultiToolStack } from "@/components/zh/ZhMultiToolStack";
import { ZhUseCaseFunnel } from "@/components/zh/ZhUseCaseFunnel";
import { ZhValueAnchorPricing } from "@/components/zh/ZhValueAnchorPricing";
import { ZhCtaCaptureBlock } from "@/components/zh/ZhCtaCaptureBlock";
import { ZhStickyCta } from "@/components/zh/ZhStickyCta";
import { ZhFreeVsPaidSection } from "@/components/zh/ZhFreeVsPaidSection";
import { ZhPageViewTracker } from "@/components/zh/ZhPageViewTracker";
import { ZhComparisonTable } from "@/components/zh/ZhComparisonTable";
import { ZhToolComparisonMonetizationBlock } from "@/components/zh/ZhToolComparisonMonetizationBlock";
import { ZhHighIntentCtaButton } from "@/components/zh/ZhHighIntentCtaButton";
import { ZhNextRecommendedPage } from "@/components/zh/ZhNextRecommendedPage";
import { ZhCaseProofBlock } from "@/components/zh/ZhCaseProofBlock";
import { ZhExitIntentPopup } from "@/components/zh/ZhExitIntentPopup";
import { getKeywordContent, type ZhKeywordContent } from "@/lib/zh-keyword-content";
import { ZH_BASE_PATHS } from "@/lib/zh-hub-data";
import { getRecentZhLinks } from "@/lib/zh-sitemap-data";
import { ZhRelatedRecommendations } from "@/components/zh/ZhRelatedRecommendations";
import { parseZhFaqForSchema, buildZhFaqSchemaWithDirectAnswer, buildZhArticleSchema, buildZhHowToSchema } from "@/lib/zh-ctr";
import { buildBreadcrumbSchema } from "@/lib/zh-breadcrumb-schema";
import { getIntroVariant, getCtaVariant } from "@/lib/zh-uniqueness";
import { getExpansionBlock } from "@/lib/zh-content-expansion";
import { getSourceCitation } from "@/lib/source-citations";
import { getRelatedBlogSlugs } from "@/lib/zh-blog-data";
import { ZhAuthorBlock } from "@/components/zh/ZhAuthorBlock";
import { ZhFreshnessBlock } from "@/components/zh/ZhFreshnessBlock";
import { TrustFooterBlock } from "@/components/seo/TrustFooterBlock";
import { ShareStrategyBlockWithLog } from "@/components/seo/ShareStrategyBlockWithLog";
import { CreatorsUsingBlock } from "@/components/seo/CreatorsUsingBlock";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";
import { DirectAnswerBlock } from "@/components/seo/DirectAnswerBlock";
import { DataSignalBlock } from "@/components/seo/DataSignalBlock";
import { ZhToolEmbeddingSentence } from "@/components/seo/ZhToolEmbeddingSentence";
import { RelatedQuestionsBlock } from "@/components/seo/RelatedQuestionsBlock";
import { AnswerIndexBlock } from "@/components/seo/AnswerIndexBlock";
import { getRelatedQuestionLinks, getAnswerIndexLinks } from "@/lib/related-questions-data";
import { getDataSignals, inferDataSignalTopic } from "@/lib/data-signals";
import { BASE_URL } from "@/config/site";
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
              {content.split(/\n\n+/).map((para, j) =>
                /^\d+\.\s/.test(para) ? (
                  <ol key={j} className="ml-4 list-decimal space-y-1">
                    {para.split("\n").map((line, k) => (
                      <li key={k}>{line.replace(/^\d+\.\s/, "")}</li>
                    ))}
                  </ol>
                ) : (
                  <p key={j}>{para}</p>
                )
              )}
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
  entry: KeywordEntry;
  content: ZhKeywordContent;
  existingSlugs?: Set<string>;
};

/** V68/V70/V84: High intent keywords - 赚钱/变现/引流/工具/软件/make money */
function isHighIntentKeyword(keyword: string): boolean {
  return /赚钱|变现|引流|工具|软件|make money/i.test(keyword || "");
}

export async function ZhKeywordPageTemplate({ entry, content, existingSlugs }: Props) {
  const slugs = existingSlugs ?? new Set<string>();
  const related = getRelatedKeywordsFiltered(entry, slugs, 12);
  const recentLinks = getRecentZhLinks(6);
  const platformName = PLATFORM_NAMES[entry.platform];
  const headline = content.h1 || content.title || entry.keyword;
  const rawTools = getMatchingAffiliateTools(entry.keyword, entry.platform, 5);
  const metrics = await getZhToolMetrics();
  const revenueSorted = sortToolsByRevenueScore(rawTools, metrics);
  const suppressed = applyLosingToolSuppression(revenueSorted, metrics, true);
  const affiliateTools = suppressed.slice(0, 3);
  const stackTools = getToolsForStack(suppressed, metrics).slice(0, 3);
  const isHighIntent = isHighIntentKeyword(entry.keyword);
  const hasAffiliate = getAffiliateTools().length > 0;
  const pageUrl = `${BASE_URL}/zh/search/${entry.slug}`;
  const faqItems = parseZhFaqForSchema(content.faq);
  const faqSchema = buildZhFaqSchemaWithDirectAnswer(
    faqItems,
    content.directAnswer || "",
    headline
  );
  const articleSchema = buildZhArticleSchema(
    headline,
    content.description || content.directAnswer || "",
    pageUrl
  );

  const internalLinks: { href: string; label: string }[] = [
    { href: `/zh/how-to/${entry.platform}`, label: `${platformName} 涨粉指南合集` },
    ...related.map((r) => ({ href: `/zh/search/${r.slug}`, label: r.keyword })),
    { href: "/zh/how-to/grow-on-tiktok", label: "TikTok 涨粉指南" },
    { href: "/zh/how-to/get-youtube-subscribers", label: "YouTube 涨粉指南" },
    { href: "/zh/tools/title-generator", label: "免费标题生成器" },
    { href: "/zh/tools/hook-generator", label: "免费钩子生成器" },
    { href: "/zh/tools/idea-generator", label: "免费选题生成器" },
    { href: "/zh/sitemap", label: "中文站点地图" },
    { href: "/tools", label: "免费 AI 工具" }
  ];

  const relatedBlogs = getRelatedBlogSlugs(entry, slugs, 2);
  const introVariant = getIntroVariant(entry.slug);
  const ctaVariant = getCtaVariant(entry.slug);
  const expansionBlock = getExpansionBlock(entry.slug);
  const sourceCitation = getSourceCitation(entry.slug, "zh");

  const breadcrumbItems = [
    { name: "首页", url: "/" },
    { name: "中文指南", url: "/zh/sitemap" },
    { name: platformName, url: `/zh/how-to/${entry.platform}` },
    { name: headline, url: `/zh/search/${entry.slug}` }
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
  const howToSchema = content.stepByStep
    ? buildZhHowToSchema(
        headline,
        content.directAnswer || content.description || "",
        pageUrl,
        content.stepByStep
      )
    : null;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col relative">
      <ZhPageViewTracker keyword={entry.keyword} slug={entry.slug} />
      <ZhStickyCta />
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
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}

      <div className="flex-1">
        <article className="container py-12 lg:pr-32">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 mb-6" aria-label="面包屑">
              <Link href="/" className="hover:text-slate-700">
                首页
              </Link>
              <span className="mx-2">/</span>
              <Link href="/zh/sitemap" className="hover:text-slate-700">
                中文指南
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">{content.h1 || entry.keyword}</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {content.h1 || entry.keyword}
            </h1>

            <DirectAnswerBlock answer={content.directAnswer || ""} lang="zh" />
            <DataSignalBlock
              signals={getDataSignals(inferDataSignalTopic(entry.slug, entry.keyword), "zh", 2, entry.slug)}
              lang="zh"
            />

            <PeopleReadingMoneyBlock excludeSlug={entry.slug} lang="zh" />

            {isHighIntent && affiliateTools.length > 0 && (
              <section className="mt-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 p-6" aria-label="高意向变现 CTA">
                <h2 className="text-lg font-semibold text-amber-900">
                  {getHighIntentCtaVariant(getHighIntentCtaIndexForSlug(entry.slug))}
                </h2>
                <p className="mt-2 text-sm text-slate-700">推荐工具，一键试用，无需注册</p>
                <ZhHighIntentCtaButton tool={affiliateTools[0]} ctaLabel={getHighIntentCtaVariant(getHighIntentCtaIndexForSlug(entry.slug))} />
              </section>
            )}

            {isHighIntent && (
              <>
                <ZhMultiToolStack
                  tools={stackTools}
                  keyword={entry.keyword}
                  pageSlug={entry.slug}
                  ctaIndex={0}
                  hasAffiliate={hasAffiliate}
                />
                <ZhUseCaseFunnel tools={affiliateTools} keyword={entry.keyword} pageSlug={entry.slug} hasAffiliate={hasAffiliate} />
                <ZhToolRecommendationBlock
                  pageSlug={entry.slug}
                  tools={affiliateTools}
                  keyword={entry.keyword}
                  ctaIndex={0}
                  isHighIntent
                  hasAffiliate={hasAffiliate}
                />
                <ZhToolComparisonMonetizationBlock tools={affiliateTools} keyword={entry.keyword} pageSlug={entry.slug} />
              </>
            )}

            {content.resultPreview && content.resultPreview.length > 0 && (
              <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-label="效果预览">
                <h2 className="text-sm font-semibold text-amber-900 mb-3">效果预览示例</h2>
                <ul className="space-y-3">
                  {content.resultPreview.map((ex, i) => (
                    <li key={i} className="flex flex-wrap gap-2 items-start text-slate-700">
                      <span className="text-amber-600 shrink-0">👉</span>
                      <span className="flex-1 min-w-0">{ex}</span>
                      <ZhCopyButton text={ex} label="复制" className="shrink-0" />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ZhFreshnessBlock />

            <div className="mt-6 prose prose-slate max-w-none">
              <p className="text-slate-600">{sourceCitation}{introVariant}</p>
              <p className="text-lg text-slate-700 leading-relaxed mt-4">{content.intro}</p>
              <ZhToolEmbeddingSentence
                toolSlug={entry.platform === "tiktok" ? "tiktok-caption-generator" : entry.platform === "youtube" ? "youtube-title-generator" : "instagram-caption-generator"}
                keyword="爆款文案"
                useZhPath
              />
            </div>

            {!isHighIntent && (
              <ZhToolRecommendationBlock
                pageSlug={entry.slug}
                tools={affiliateTools}
                keyword={entry.keyword}
                ctaIndex={0}
                isHighIntent={false}
                hasAffiliate={hasAffiliate}
              />
            )}

            {!isHighIntent && (
              <ZhMultiToolStack
                tools={stackTools}
                keyword={entry.keyword}
                pageSlug={entry.slug}
                ctaIndex={0}
                hasAffiliate={hasAffiliate}
              />
            )}

            {!isHighIntent && (
              <ZhUseCaseFunnel tools={affiliateTools} keyword={entry.keyword} pageSlug={entry.slug} hasAffiliate={hasAffiliate} />
            )}

            <ZhValueAnchorPricing keyword={entry.keyword} />

            <ZhComparisonTable tools={affiliateTools} keyword={entry.keyword} pageSlug={entry.slug} />
            {!isHighIntent && (
              <ZhToolComparisonMonetizationBlock tools={affiliateTools} keyword={entry.keyword} pageSlug={entry.slug} />
            )}

            {isHighIntent && (
              <ZhToolRecommendationBlock
                pageSlug={entry.slug}
                tools={affiliateTools}
                keyword={entry.keyword}
                ctaIndex={1}
                isHighIntent
                hasAffiliate={hasAffiliate}
              />
            )}

            <ZhCaseProofBlock keyword={entry.keyword} />

            {content.guide && (
              <section className="mt-10 prose prose-slate max-w-none">
                <div className="text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.guide)}
                </div>
              </section>
            )}

            {content.stepByStep && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">分步骤指南</h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.stepByStep)}
                </div>
              </section>
            )}

            <ZhToolRecommendationBlock
              pageSlug={entry.slug}
              tools={affiliateTools}
              keyword={entry.keyword}
              ctaIndex={isHighIntent ? 2 : 1}
              isHighIntent={isHighIntent}
              hasAffiliate={hasAffiliate}
            />

            <ZhCtaCaptureBlock keyword={entry.keyword} />

            <ZhFreeVsPaidSection keyword={entry.keyword} />

            {content.faq && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">常见问题</h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.faq)}
                </div>
              </section>
            )}

            <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-slate-700 leading-relaxed">{expansionBlock}</p>
            </section>

            <RelatedQuestionsBlock
              links={getRelatedQuestionLinks(entry, slugs, 20)}
              lang="zh"
            />

            <ZhRelatedRecommendations
              context={{
                platform: entry.platform,
                goal: entry.goal,
                excludeSlug: entry.slug
              }}
              limit={15}
            />

            {relatedBlogs.length > 0 && (
              <section className="mt-12">
                <h2 className="text-lg font-semibold text-slate-900">相关博客</h2>
                <ul className="mt-3 space-y-2">
                  {relatedBlogs.map((b) => (
                    <li key={b.slug}>
                      <Link
                        href={`/zh/blog/${b.slug}`}
                        className="text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        {b.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ZhToolRecommendationBlock
              pageSlug={entry.slug}
              tools={affiliateTools}
              keyword={entry.keyword}
              ctaIndex={isHighIntent ? 3 : 2}
              isHighIntent={isHighIntent}
              hasAffiliate={hasAffiliate}
            />

            <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">用 AI 生成爆款内容</h2>
              <p className="mt-2 text-sm text-slate-600">几秒钟生成文案和钩子，无需注册。</p>
              <Link href="/" className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition">
                {ctaVariant}
              </Link>
            </section>

            <ZhAuthorBlock />
            <TrustFooterBlock lang="zh" />

            <ShareStrategyBlockWithLog
              title={headline}
              oneLiner={content.directAnswer || content.description || content.intro?.slice(0, 120) || ""}
              pageUrl={pageUrl}
              slug={entry.slug}
              lang="zh"
              keyword={entry.keyword}
            />

            {(isHighIntent || related.length > 0) && (
              <ZhCtaCaptureBlock keyword={entry.keyword} inline />
            )}

            {related.length > 0 && (
              <ZhNextRecommendedPage
                href={`/zh/search/${related[0].slug}`}
                label={related[0].keyword}
                description="推荐继续阅读"
              />
            )}

            <CreatorsUsingBlock slug={entry.slug} pathType="zh-search" lang="zh" />

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">相关指南</h2>
              <ul className="mt-4 space-y-2">
                {internalLinks.slice(0, 12).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sky-700 hover:text-sky-800 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">最新中文指南</h2>
              <ul className="mt-4 space-y-2">
                {recentLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sky-700 hover:text-sky-800 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <AnswerIndexBlock
              topic={entry.keyword}
              links={getAnswerIndexLinks(entry, slugs, 20)}
              lang="zh"
            />

            <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">更多资源</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/zh/tools/title-generator" className="text-sky-700 hover:underline">免费标题生成器</Link>
                </li>
                <li>
                  <Link href="/zh/tools/hook-generator" className="text-sky-700 hover:underline">免费钩子生成器</Link>
                </li>
                <li>
                  <Link href="/zh/sitemap" className="text-sky-700 hover:underline">中文站点地图</Link>
                </li>
                <li>
                  <Link href="/zh/privacy" className="text-slate-600 hover:underline">隐私政策</Link>
                  {" · "}
                  <Link href="/zh/terms" className="text-slate-600 hover:underline">服务条款</Link>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </div>

      <ZhExitIntentPopup keyword={entry.keyword} />
    </main>
  );
}
