/**
 * V77: EN how-to page template for AI citation.
 * Same structure as zh: Direct Answer, steps, examples, FAQ, tool recommendation.
 */

import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ToolCard } from "@/components/tools/ToolCard";
import { tools } from "@/config/tools";
import { parseZhFaqForSchema, buildZhFaqSchemaWithDirectAnswer, buildZhArticleSchema } from "@/lib/zh-ctr";
import { buildBreadcrumbSchema } from "@/lib/zh-breadcrumb-schema";
import { BASE_URL } from "@/config/site";
import { type EnHowToContent } from "@/lib/en-how-to-content";
import { ZhPageViewTracker } from "@/components/zh/ZhPageViewTracker";
import { resolveEnHowToRecommendedToolSlug } from "@/config/en-how-to-tool-routing";

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

function stripPricingMentions(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const l = line.trim();
      if (!l) return true;
      // Remove any line that contains explicit price/amount wording.
      if (/\$|¥|€|£/.test(l)) return false;
      if (/\bper\s*(month|mo)\b/i.test(l)) return false;
      if (/\b\/\s*(month|mo)\b/i.test(l)) return false;
      if (/\b(price|pricing|payout|rates?)\b/i.test(l) && /\d/.test(l)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Props = {
  content: EnHowToContent;
  /** V88: Locale for multi-language routes. Default "en". */
  locale?: "en" | "es" | "pt" | "id";
};

export async function EnHowToPageTemplate({ content, locale = "en" }: Props) {
  const recommendedToolSlug = resolveEnHowToRecommendedToolSlug(content);
  const tool = tools.find((t) => t.slug === recommendedToolSlug) ?? tools.find((t) => t.slug === content.primaryTool);
  const safeDescription = stripPricingMentions(content.description)
    .replace(/\s+/g, " ")
    .trim();
  const safeStepByStep = stripPricingMentions(content.stepByStep);
  const safeFaq = stripPricingMentions(content.faq);

  const basePath = locale === "en" ? "/en" : `/${locale}`;
  const pageUrl = `${BASE_URL}${basePath}/how-to/${content.slug}`;
  const faqItems = parseZhFaqForSchema(safeFaq);
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
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {content.title}
            </h1>
            {safeDescription ? (
              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-relaxed text-slate-700">
                {safeDescription}
              </p>
            ) : null}

            {safeStepByStep && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">
                  Step-by-Step Guide
                </h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(safeStepByStep)}
                </div>
              </section>
            )}

            {safeFaq && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
                <div className="mt-4 text-slate-700 leading-relaxed space-y-6">
                  {renderMarkdownBlock(safeFaq)}
                </div>
              </section>
            )}

            {tool ? (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">Recommended tool</h2>
                <p className="mt-2 text-slate-600">
                  This guide pairs with one best-fit tool. Start with it directly.
                </p>
                <div className="mt-4 max-w-xl">
                  <ToolCard
                    href={`/tools/${tool.slug}`}
                    icon={tool.icon}
                    name={tool.name}
                    description={tool.description}
                    category={tool.category}
                    slug={tool.slug}
                    badge={tool.isPopular ? "Popular" : undefined}
                  />
                </div>
              </section>
            ) : null}

            <div className="mt-12">
              <Link href={`${basePath}/how-to`} className="text-sm font-medium text-sky-700 hover:underline">
                ← Back to guides
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
