import Link from "next/link";
import { ToolCard } from "@/components/tools/ToolCard";
import { tools } from "@/config/tools";
import { getMatchingAffiliateTools, getAffiliateTools, type AffiliateTool } from "@/config/affiliate-tools";
import { formatTopicLabel, parseZhSlug, extractPlatformFromTopic, ZH_PLATFORMS } from "@/config/traffic-topics";
import { ZhToolRecommendationBlock } from "@/components/zh/ZhToolRecommendationBlock";
import { ZhCtaCaptureBlock } from "@/components/zh/ZhCtaCaptureBlock";
import { ZhStickyCta } from "@/components/zh/ZhStickyCta";
import { ZhFreeVsPaidSection } from "@/components/zh/ZhFreeVsPaidSection";
import { ZhPageViewTracker } from "@/components/zh/ZhPageViewTracker";
import { ZhComparisonTable } from "@/components/zh/ZhComparisonTable";
import { ZhCaseProofBlock } from "@/components/zh/ZhCaseProofBlock";
import { ZhExitIntentPopup } from "@/components/zh/ZhExitIntentPopup";
import { ZhAuthorBlock } from "@/components/zh/ZhAuthorBlock";
import { ZhFreshnessBlock } from "@/components/zh/ZhFreshnessBlock";
import { TrustFooterBlock } from "@/components/seo/TrustFooterBlock";
import { getExpansionBlock } from "@/lib/zh-content-expansion";
import { getSourceCitation } from "@/lib/source-citations";
import { getGuidePrompts } from "@/config/guide-content";
import type { GuidePageType } from "@/config/traffic-topics";
import type { ZhPageContent } from "@/lib/generate-zh-content";
import { getZhInternalLinks } from "@/lib/generate-zh-content";
import { ZH_BASE_PATHS, PLATFORM_NAMES } from "@/lib/zh-hub-data";
import { getRecentZhLinks } from "@/lib/zh-sitemap-data";
import {
  getZhCtrTitle,
  getZhFeaturedQuestion,
  parseZhFaqForSchema,
  buildZhFaqSchemaWithDirectAnswer,
  buildZhArticleSchema,
  getZhCuriosityLinks
} from "@/lib/zh-ctr";
import { DirectAnswerBlock } from "@/components/seo/DirectAnswerBlock";
import { DataSignalBlock } from "@/components/seo/DataSignalBlock";
import { ZhToolEmbeddingSentence } from "@/components/seo/ZhToolEmbeddingSentence";
import { getDataSignals, inferDataSignalTopic } from "@/lib/data-signals";
import { buildBreadcrumbSchema } from "@/lib/zh-breadcrumb-schema";
import { BASE_URL } from "@/config/site";

type ExampleRow = {
  slug: string;
  tool_name: string;
  result: string;
  creator_username?: string;
};

const HUB_SECTION_LABELS: Record<GuidePageType, string> = {
  "how-to": "涨粉指南合集",
  "ai-prompts": "AI 提示词合集",
  "content-strategy": "内容策略合集",
  "viral-examples": "爆款案例合集"
};

function getZhPageLabel(pageType: GuidePageType, topicLabel: string): string {
  switch (pageType) {
    case "how-to":
      return `如何${topicLabel}`;
    case "ai-prompts":
      return `${topicLabel} AI 提示词`;
    case "content-strategy":
      return `${topicLabel} 内容策略`;
    case "viral-examples":
      return `${topicLabel} 爆款案例`;
    default:
      return topicLabel;
  }
}

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
  pageType: GuidePageType;
  topic: string;
  content: ZhPageContent;
  examples: ExampleRow[];
  primaryTool?: string;
  affiliateTools?: AffiliateTool[];
};

export function ZhGuidePageTemplate({
  pageType,
  topic,
  content,
  examples,
  primaryTool = "tiktok-caption-generator",
  affiliateTools
}: Props) {
  const { baseTopic } = parseZhSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic);
  const prompts = getGuidePrompts(pageType, baseTopic);
  const tool = tools.find((t) => t.slug === primaryTool);
  const relatedTools = tools
    .filter((t) => t.category === tool?.category || ["Captions", "Hooks", "Titles"].includes(t.category))
    .slice(0, 6);

  const internalLinks = getZhInternalLinks(pageType, topic);
  const recentLinks = getRecentZhLinks(8);
  const curiosityLinks = getZhCuriosityLinks(pageType, topic, 6);
  const platform = extractPlatformFromTopic(topic);
  const hubLabel = HUB_SECTION_LABELS[pageType];
  const faqItems = parseZhFaqForSchema(content.faq);
  const pageUrl = `${BASE_URL}${ZH_BASE_PATHS[pageType]}/${topic}`;
  const featuredQuestion = getZhFeaturedQuestion(pageType, topic);
  const faqSchema = buildZhFaqSchemaWithDirectAnswer(
    faqItems,
    content.directAnswer || "",
    featuredQuestion
  );
  const ctrTitle = getZhCtrTitle(content, pageType, topic);
  const toolsForPage = affiliateTools ?? getMatchingAffiliateTools(ctrTitle, platform, 3);
  const hasAffiliate = getAffiliateTools().length > 0;
  const articleSchema = buildZhArticleSchema(
    ctrTitle,
    content.description || content.directAnswer || "",
    pageUrl
  );

  const breadcrumbItems: { name: string; url: string }[] = [
    { name: "首页", url: "/zh" },
    { name: "中文指南", url: "/zh/sitemap" },
    ...(platform !== "general" && ZH_PLATFORMS.includes(platform)
      ? [{ name: PLATFORM_NAMES[platform], url: `${ZH_BASE_PATHS[pageType]}/${platform}` }]
      : []),
    { name: ctrTitle, url: `${ZH_BASE_PATHS[pageType]}/${topic}` }
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
  const sourceCitation = getSourceCitation(topic, "zh");

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col relative">
      <ZhPageViewTracker keyword={ctrTitle} slug={topic} />
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

      <div className="flex-1">
        <article className="container py-12 lg:pr-32">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 mb-6" aria-label="面包屑">
              <Link href="/zh" className="hover:text-slate-700">
                首页
              </Link>
              <span className="mx-2">/</span>
              {platform !== "general" && ZH_PLATFORMS.includes(platform) ? (
                <>
                  <Link
                    href={`${ZH_BASE_PATHS[pageType]}/${platform}`}
                    className="hover:text-slate-700"
                  >
                    {PLATFORM_NAMES[platform]}
                  </Link>
                  <span className="mx-2">/</span>
                </>
              ) : null}
              <span className="text-slate-900">{hubLabel.replace("合集", "")}</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {ctrTitle}
            </h1>

            <ZhFreshnessBlock />

            <DirectAnswerBlock answer={content.directAnswer || ""} lang="zh" />
            <DataSignalBlock
              signals={getDataSignals(inferDataSignalTopic(topic), "zh", 2, topic)}
              lang="zh"
            />

            <div className="mt-6 prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed">{sourceCitation}{content.intro}</p>
              <ZhToolEmbeddingSentence
                toolSlug={primaryTool}
                keyword={primaryTool.includes("caption") ? "爆款文案" : primaryTool.includes("hook") ? "钩子" : primaryTool.includes("title") ? "标题" : "内容"}
                useZhPath
              />
            </div>

            <ZhToolRecommendationBlock tools={toolsForPage} keyword={ctrTitle} pageSlug={`${pageType}-${topic}`} hasAffiliate={hasAffiliate} />

            <ZhCaseProofBlock keyword={ctrTitle} />

            {content.guide && (
              <section className="mt-10 prose prose-slate max-w-none">
                <div className="text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.guide)}
                </div>
              </section>
            )}

            {examples.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">案例</h2>
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
              <h2 className="text-xl font-semibold text-slate-900">AI 提示词</h2>
              <p className="mt-2 text-slate-600">
                复制以下提示词到 ChatGPT 或我们的 AI 工具中生成爆款内容。
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {prompts.slice(0, 20).map((p, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                  >
                    <p className="text-slate-700 whitespace-pre-wrap">{p.prompt}</p>
                  </div>
                ))}
              </div>
            </section>

            {content.stepByStep && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">分步骤指南</h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.stepByStep)}
                </div>
              </section>
            )}

            <ZhToolRecommendationBlock tools={toolsForPage} keyword={ctrTitle} pageSlug={`${pageType}-${topic}`} ctaIndex={1} hasAffiliate={hasAffiliate} />

            <ZhCtaCaptureBlock keyword={ctrTitle} />

            <ZhFreeVsPaidSection keyword={ctrTitle} />

            {content.faq && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">常见问题</h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.faq)}
                </div>
              </section>
            )}

            {content.strategy && (
              <section className="mt-12">
                <div className="text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.strategy)}
                </div>
              </section>
            )}

            {content.tips && (
              <section className="mt-12">
                <div className="text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(content.tips)}
                </div>
              </section>
            )}

            <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-slate-700 leading-relaxed">{getExpansionBlock(topic)}</p>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">工具</h2>
              <p className="mt-2 text-slate-600">
                使用我们的免费 AI 工具，几秒钟生成文案、钩子和标题。
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {relatedTools.map((t) => (
                  <ToolCard
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    icon={t.icon}
                    name={t.name}
                    nameZh={t.nameZh}
                    description={t.description}
                    descriptionZh={t.descriptionZh}
                    category={t.category}
                    badge={t.isPopular ? "Popular" : undefined}
                    locale="zh"
                  />
                ))}
              </div>
            </section>

            <ZhToolRecommendationBlock tools={toolsForPage} keyword={ctrTitle} pageSlug={`${pageType}-${topic}`} ctaIndex={2} hasAffiliate={hasAffiliate} />

            <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">用 AI 生成爆款内容</h2>
              <p className="mt-2 text-sm text-slate-600">
                几秒钟生成 {topicLabel.toLowerCase()} 文案和钩子，无需注册。
              </p>
              <Link
                href={`/tools/${primaryTool}`}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition duration-150"
              >
                试试 {tool?.name ?? "文案生成器"} →
              </Link>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">最新发布</h2>
              <p className="mt-2 text-sm text-slate-600">最近更新的创作者指南</p>
              <ul className="mt-3 space-y-2">
                {recentLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">相关合集</h2>
              <p className="mt-2 text-sm text-slate-600">更多平台指南与资源</p>
              <ul className="mt-3 space-y-2">
                {ZH_PLATFORMS.map((p) => (
                  <li key={p}>
                    <Link
                      href={`${ZH_BASE_PATHS[pageType]}/${p}`}
                      className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                    >
                      {PLATFORM_NAMES[p]} {hubLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">你可能还想看</h2>
              <p className="mt-2 text-sm text-slate-600">更多创作者必读指南</p>
              <ul className="mt-3 space-y-2">
                {curiosityLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-sm text-sky-700 hover:text-sky-800 hover:underline font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {internalLinks.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">相关指南与资源</h2>
                <p className="mt-2 text-sm text-slate-600">更多中文创作者指南和工具</p>
                <ul className="mt-3 space-y-2">
                  {internalLinks.map((link, i) => (
                    <li key={i}>
                      <Link
                        href={link.href}
                        className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ZhAuthorBlock />
            <TrustFooterBlock lang="zh" />

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                浏览全部工具 →
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
              >
                创作者指南 →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <ZhExitIntentPopup keyword={ctrTitle} />
    </main>
  );
}
