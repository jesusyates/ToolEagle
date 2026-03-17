import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import {
  getKeywordBySlug,
  getRelatedKeywordsFiltered,
  PLATFORM_NAMES,
  type KeywordEntry
} from "@/lib/keyword-patterns";
import { getMatchingAffiliateTools } from "@/config/affiliate-tools";
import { ZhToolRecommendationBlock } from "@/components/zh/ZhToolRecommendationBlock";
import { ZhCtaCaptureBlock } from "@/components/zh/ZhCtaCaptureBlock";
import { ZhStickyCta } from "@/components/zh/ZhStickyCta";
import { ZhFreeVsPaidSection } from "@/components/zh/ZhFreeVsPaidSection";
import { ZhPageViewTracker } from "@/components/zh/ZhPageViewTracker";
import { ZhComparisonTable } from "@/components/zh/ZhComparisonTable";
import { ZhCaseProofBlock } from "@/components/zh/ZhCaseProofBlock";
import { ZhExitIntentPopup } from "@/components/zh/ZhExitIntentPopup";
import { getKeywordContent, type ZhKeywordContent } from "@/lib/zh-keyword-content";
import { ZH_BASE_PATHS } from "@/lib/zh-hub-data";
import { getRecentZhLinks } from "@/lib/zh-sitemap-data";
import { ZhRelatedRecommendations } from "@/components/zh/ZhRelatedRecommendations";
import { parseZhFaqForSchema, buildZhFaqSchema, buildZhArticleSchema } from "@/lib/zh-ctr";
import { buildBreadcrumbSchema } from "@/lib/zh-breadcrumb-schema";
import { getIntroVariant, getCtaVariant } from "@/lib/zh-uniqueness";
import { getExpansionBlock } from "@/lib/zh-content-expansion";
import { getRelatedBlogSlugs } from "@/lib/zh-blog-data";
import { ZhAuthorBlock } from "@/components/zh/ZhAuthorBlock";
import { ZhFreshnessBlock } from "@/components/zh/ZhFreshnessBlock";
import { BASE_URL } from "@/config/site";

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

export function ZhKeywordPageTemplate({ entry, content, existingSlugs }: Props) {
  const slugs = existingSlugs ?? new Set<string>();
  const related = getRelatedKeywordsFiltered(entry, slugs, 12);
  const recentLinks = getRecentZhLinks(6);
  const platformName = PLATFORM_NAMES[entry.platform];
  const headline = content.h1 || content.title || entry.keyword;
  const affiliateTools = getMatchingAffiliateTools(entry.keyword, entry.platform, 3);
  const pageUrl = `${BASE_URL}/zh/search/${entry.slug}`;
  const faqItems = parseZhFaqForSchema(content.faq);
  const faqSchema = buildZhFaqSchema(faqItems, pageUrl);
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
    { href: "/tools", label: "免费 AI 工具" }
  ];

  const relatedBlogs = getRelatedBlogSlugs(entry, slugs, 2);
  const introVariant = getIntroVariant(entry.slug);
  const ctaVariant = getCtaVariant(entry.slug);
  const expansionBlock = getExpansionBlock(entry.slug);

  const breadcrumbItems = [
    { name: "首页", url: "/" },
    { name: "中文指南", url: "/zh/sitemap" },
    { name: platformName, url: `/zh/how-to/${entry.platform}` },
    { name: headline, url: `/zh/search/${entry.slug}` }
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col relative">
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
      <SiteHeader />

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

            {content.resultPreview && content.resultPreview.length > 0 && (
              <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-label="效果预览">
                <h2 className="text-sm font-semibold text-amber-900 mb-3">效果预览示例</h2>
                <ul className="space-y-2">
                  {content.resultPreview.map((ex, i) => (
                    <li key={i} className="flex gap-2 text-slate-700">
                      <span className="text-amber-600 shrink-0">👉</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ZhFreshnessBlock />

            {content.directAnswer && (
              <section className="mt-6 rounded-xl border-2 border-sky-200 bg-sky-50 p-5" aria-label="精选摘要">
                <p className="text-base font-semibold text-slate-900">{content.directAnswer}</p>
              </section>
            )}

            <div className="mt-6 prose prose-slate max-w-none">
              <p className="text-slate-600">{introVariant}</p>
              <p className="text-lg text-slate-700 leading-relaxed mt-4">{content.intro}</p>
            </div>

            <ZhToolRecommendationBlock tools={affiliateTools} keyword={entry.keyword} ctaIndex={0} />

            <ZhComparisonTable tools={affiliateTools} keyword={entry.keyword} />

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

            <ZhToolRecommendationBlock tools={affiliateTools} keyword={entry.keyword} ctaIndex={1} />

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

            <ZhToolRecommendationBlock tools={affiliateTools} keyword={entry.keyword} ctaIndex={2} />

            <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">用 AI 生成爆款内容</h2>
              <p className="mt-2 text-sm text-slate-600">几秒钟生成文案和钩子，无需注册。</p>
              <Link href="/" className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition">
                {ctaVariant}
              </Link>
            </section>

            <ZhAuthorBlock />

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
          </div>
        </article>
      </div>

      <ZhExitIntentPopup keyword={entry.keyword} />
      <SiteFooter />
    </main>
  );
}
