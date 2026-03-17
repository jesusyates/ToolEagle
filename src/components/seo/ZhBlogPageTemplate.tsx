import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import {
  getMatchingAffiliateTools,
  type AffiliateTool
} from "@/config/affiliate-tools";
import { PLATFORM_NAMES } from "@/lib/keyword-patterns";
import { ZhToolRecommendationBlock } from "@/components/zh/ZhToolRecommendationBlock";
import { ZhCtaCaptureBlock } from "@/components/zh/ZhCtaCaptureBlock";
import { ZhAuthorBlock } from "@/components/zh/ZhAuthorBlock";
import { ZhFreshnessBlock } from "@/components/zh/ZhFreshnessBlock";
import { getIntroVariant, getCtaVariant } from "@/lib/zh-uniqueness";
import { getExpansionBlock } from "@/lib/zh-content-expansion";
import { buildBreadcrumbSchema } from "@/lib/zh-breadcrumb-schema";
import { buildZhArticleSchema } from "@/lib/zh-ctr";
import { BASE_URL } from "@/config/site";
import type { KeywordEntry } from "@/lib/keyword-patterns";
import type { ZhKeywordContent } from "@/lib/zh-keyword-content";

function renderMarkdownBlock(text: string) {
  if (!text) return null;
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
  relatedBlogs: { slug: string; label: string }[];
};

export function ZhBlogPageTemplate({ entry, content, relatedBlogs }: Props) {
  const headline = content.h1 || content.title || entry.keyword;
  const platformName = PLATFORM_NAMES[entry.platform];
  const affiliateTools = getMatchingAffiliateTools(entry.keyword, entry.platform, 3);
  const introVariant = getIntroVariant(entry.slug);
  const ctaVariant = getCtaVariant(entry.slug);
  const expansionBlock = getExpansionBlock(entry.slug);

  const pageUrl = `${BASE_URL}/zh/blog/${entry.slug}`;
  const articleSchema = buildZhArticleSchema(
    headline,
    content.description || content.directAnswer || "",
    pageUrl
  );

  const breadcrumbItems = [
    { name: "首页", url: "/" },
    { name: "中文博客", url: "/zh/blog" },
    { name: platformName, url: `/zh/how-to/${entry.platform}` },
    { name: headline, url: `/zh/blog/${entry.slug}` }
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 mb-6" aria-label="面包屑">
              <Link href="/" className="hover:text-slate-700">首页</Link>
              <span className="mx-2">/</span>
              <Link href="/zh/sitemap" className="hover:text-slate-700">中文指南</Link>
              <span className="mx-2">/</span>
              <Link href={`/zh/search/${entry.slug}`} className="hover:text-slate-700">详细指南</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">博客</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {headline}
            </h1>

            <ZhFreshnessBlock />

            <div className="mt-6 prose prose-slate max-w-none">
              <p className="text-slate-600">{introVariant}</p>
              <p className="text-lg text-slate-700 leading-relaxed mt-4">{content.intro}</p>
            </div>

            {content.directAnswer && (
              <section className="mt-8 rounded-xl border-2 border-sky-200 bg-sky-50 p-5">
                <p className="text-base font-semibold text-slate-900">{content.directAnswer}</p>
              </section>
            )}

            {content.stepByStep && (
              <section className="mt-10">
                <h2 className="text-xl font-semibold text-slate-900">方法步骤</h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.stepByStep)}
                </div>
              </section>
            )}

            {content.guide && (
              <section className="mt-10 prose prose-slate max-w-none">
                <div className="text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.guide)}
                </div>
              </section>
            )}

            {content.resultPreview && content.resultPreview.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xl font-semibold text-slate-900">示例</h2>
                <ul className="mt-4 space-y-2">
                  {content.resultPreview.map((ex, i) => (
                    <li key={i} className="flex gap-2 text-slate-700 pl-4 border-l-2 border-slate-200">
                      <span className="text-amber-600 shrink-0">→</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-slate-700 leading-relaxed">{expansionBlock}</p>
            </section>

            {content.faq && (
              <section className="mt-10">
                <h2 className="text-xl font-semibold text-slate-900">常见问题</h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.faq)}
                </div>
              </section>
            )}

            <ZhToolRecommendationBlock tools={affiliateTools} keyword={entry.keyword} ctaIndex={0} />

            <section className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">用 AI 生成爆款内容</h2>
              <p className="mt-2 text-sm text-slate-600">几秒钟生成文案和钩子，无需注册。</p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                {ctaVariant}
              </Link>
            </section>

            <ZhCtaCaptureBlock keyword={entry.keyword} />

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">详细指南</h2>
              <p className="mt-2 text-sm text-slate-600">查看完整工具和步骤</p>
              <Link
                href={`/zh/search/${entry.slug}`}
                className="mt-3 inline-block text-sky-700 hover:text-sky-800 hover:underline font-medium"
              >
                {entry.keyword} 完整指南 →
              </Link>
            </section>

            {relatedBlogs.length > 0 && (
              <section className="mt-10">
                <h2 className="text-lg font-semibold text-slate-900">相关文章</h2>
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

            <ZhAuthorBlock />
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
