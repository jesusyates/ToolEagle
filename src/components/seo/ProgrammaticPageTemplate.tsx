/**
 * V93 / V93.1: Programmatic SEO — locale-safe links, money CTAs, structured sections
 */

import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { tools } from "@/config/tools";
import type { ProgrammaticPageType, PseoLocale } from "@/lib/programmatic-seo";
import { buildExampleLines, buildPromptLines, pathForProgrammaticPage, slugToTitle } from "@/lib/programmatic-seo";
import { PSEO_CITATION_ADVISORY, complianceBufferLines } from "@/lib/seo/pseo-content-safety";
import type { InternalLinkItem } from "@/lib/programmatic-seo";
import { PseoTrackedMoneyLinks } from "@/components/seo/PseoTrackedMoneyLinks";
import { PseoJsonLd } from "@/components/seo/PseoJsonLd";
import { SeoMidUpgradeCta } from "@/components/monetization/SeoMidUpgradeCta";
import { UpgradeLink } from "@/components/monetization/UpgradeLink";
import { zhToolHrefFromSlug } from "@/lib/zh-site/zh-tool-href";
import { zhSeoTitle } from "@/config/zh-brand";

export type ProgrammaticPageTemplateProps = {
  pageType: ProgrammaticPageType;
  keyword: string;
  slug: string;
  locale: PseoLocale;
  sourcePagePath: string;
  primaryLinks: InternalLinkItem[];
  crossLocaleLinks: InternalLinkItem[];
  indexable: boolean;
};

function pageTitle(pageType: ProgrammaticPageType, keyword: string, locale: PseoLocale): string {
  const k = keyword.trim();
  if (locale === "zh") {
    if (pageType === "ai_generator") return zhSeoTitle(`${k} AI 生成参考`);
    if (pageType === "examples") return zhSeoTitle(`${k} 示例（可参考改写）`);
    return zhSeoTitle(`${k} 怎么做 — 步骤参考`);
  }
  if (pageType === "ai_generator") return `Free AI ${k} Generator | ToolEagle`;
  if (pageType === "examples") return `${k} Examples (Copy-Paste) | ToolEagle`;
  return `How to ${k} — Step-by-Step | ToolEagle`;
}

export function ProgrammaticPageTemplate({
  pageType,
  keyword,
  slug,
  locale,
  sourcePagePath,
  primaryLinks,
  crossLocaleLinks,
  indexable
}: ProgrammaticPageTemplateProps) {
  const displayKeyword = keyword.trim() || slugToTitle(slug);
  const title = pageTitle(pageType, displayKeyword, locale);
  const examples = buildExampleLines(displayKeyword, 12, locale);
  const prompts = buildPromptLines(displayKeyword, locale);
  const citation = locale === "zh" ? PSEO_CITATION_ADVISORY.zh : PSEO_CITATION_ADVISORY.en;
  const bufferLines = complianceBufferLines(locale);
  const douyinTools = tools.filter((t) => t.slug.startsWith("douyin-"));
  const genericTools = tools.filter((t) => !t.slug.startsWith("douyin-") && t.isPopular !== false);
  /** V105.2 — Douyin monetization cluster first on zh programmatic pages */
  const relatedTools = [...douyinTools, ...genericTools].slice(0, 8);

  const crossLinks = [
    { type: "ai_generator" as const, label: locale === "zh" ? "AI 生成" : "AI generator" },
    { type: "examples" as const, label: locale === "zh" ? "示例" : "Examples" },
    { type: "how_to" as const, label: locale === "zh" ? "教程" : "How-to" }
  ].filter((x) => x.type !== pageType);

  const toolsPrefix = locale === "zh" ? "/zh/tools" : "/tools";

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      {indexable ? <PseoJsonLd pageType={pageType} slug={slug} keyword={displayKeyword} locale={locale} /> : null}
      {locale !== "zh" ? <SiteHeader /> : null}

      <article className="flex-1 container py-12 max-w-3xl">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href={locale === "zh" ? "/zh" : "/"} className="hover:text-slate-800">
            {locale === "zh" ? "首页" : "Home"}
          </Link>
          <span className="mx-2">/</span>
          <Link href={locale === "zh" ? "/zh/tools/tiktok-caption-generator" : "/tools"} className="hover:text-slate-800">
            {locale === "zh" ? "工具" : "Tools"}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{title}</span>
        </nav>

        {!indexable ? (
          <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {locale === "zh"
              ? "此页为待审核或低质量关键词，搜索引擎可能不收录。"
              : "This URL may be excluded from search indexing (pending review or quality gate)."}
          </p>
        ) : null}

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>

        <PseoTrackedMoneyLinks sourcePage={sourcePagePath} locale={locale} variant="above-fold" />

        <p className="mt-4 text-lg text-slate-700 leading-relaxed">{citationIntro(pageType, keyword, locale)}</p>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          {bufferLines.map((line, i) => (
            <span key={i}>
              {i > 0 ? " " : null}
              {line}
            </span>
          ))}
        </p>

        <blockquote className="mt-6 border-l-4 border-sky-500 bg-sky-50/80 pl-4 py-3 text-sm text-slate-800">
          <strong>{locale === "zh" ? "参考观点" : "Advisory note"}</strong> {citation.according}
        </blockquote>
        <blockquote className="mt-3 border-l-4 border-amber-500 bg-amber-50/80 pl-4 py-3 text-sm text-slate-800">
          <strong>{locale === "zh" ? "方法与流程" : "Workflow perspective"}</strong> {citation.analysis}
        </blockquote>

        <section className="mt-10" aria-label="Examples">
          <h2 className="text-xl font-semibold text-slate-900">
            {locale === "zh" ? "可复制示例" : "Examples you can copy"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {locale === "zh"
              ? `12+ 个 ${displayKeyword} 角度 — 按平台微调。`
              : `12+ angles for ${displayKeyword} — tweak for your niche and platform.`}
          </p>
          <ol className="mt-4 space-y-3 list-decimal list-inside text-slate-800">
            {examples.map((ex, i) => (
              <li key={i} className="pl-1">
                {ex}
              </li>
            ))}
          </ol>
        </section>

        <PseoTrackedMoneyLinks sourcePage={sourcePagePath} locale={locale} variant="mid" />

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">{locale === "zh" ? "提示词" : "Prompts"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {locale === "zh" ? "复制到 ToolEagle 工具或任意 AI。" : "Drop these into ToolEagle tools or your favorite AI."}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-800">
            {prompts.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-sky-600 font-semibold">{i + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>

        <SeoMidUpgradeCta locale={locale} tone="pseo" />

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">{locale === "zh" ? "相关工具" : "Related tools"}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedTools.map((t) => (
              <Link
                key={t.slug}
                href={locale === "zh" ? zhToolHrefFromSlug(t.slug) : `${toolsPrefix}/${t.slug}`}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-300 hover:shadow-sm transition"
              >
                <p className="font-medium text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">{locale === "zh" ? "相关页面" : "Related pages"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {locale === "zh"
              ? "同语言高价值页面与工具（内链按语言过滤）。"
              : "Same-locale money pages and tools — cross-language only in the block below."}
          </p>
          <ul className="mt-4 space-y-2">
            {primaryLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sky-700 hover:text-sky-900 hover:underline text-sm font-medium">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {crossLocaleLinks.length > 0 ? (
          <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4" aria-label="Language alternatives">
            <h2 className="text-sm font-semibold text-slate-700">
              {locale === "zh" ? "其他语言 / Other languages" : "其他语言 / Other languages"}
            </h2>
            <ul className="mt-2 space-y-1">
              {crossLocaleLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-600 hover:text-sky-800 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <PseoTrackedMoneyLinks sourcePage={sourcePagePath} locale={locale} variant="bottom" />

        <section className="mt-10 flex flex-wrap gap-3">
          {crossLinks.map((c) => (
            <Link
              key={c.type}
              href={pathForProgrammaticPage(c.type, slug, locale)}
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {c.label} →
            </Link>
          ))}
          <UpgradeLink className="inline-flex rounded-xl border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-100">
            {locale === "zh" ? "更快增长 — 获取算力包 →" : "Grow faster — get credits →"}
          </UpgradeLink>
        </section>
      </article>

      {locale !== "zh" ? <SiteFooter /> : null}
    </main>
  );
}

function citationIntro(pageType: ProgrammaticPageType, keyword: string, locale: PseoLocale): string {
  const k = keyword.trim();
  if (pageType === "ai_generator") {
    return locale === "zh"
      ? `本页为 ToolEagle 程序化 SEO 资源，主题「${k}」。下方为中性、可参考的示例与提示词，请结合平台规则自行调整；不构成效果承诺。`
      : `This programmatic SEO resource covers “${k}” with neutral, advisory examples and prompts. Adapt to each platform’s rules; nothing here guarantees results.`;
  }
  if (pageType === "examples") {
    return locale === "zh"
      ? `以下「${k}」示例供改写与测试，偏信息型与可执行；请避免夸张表述并遵守社区规范。`
      : `These ${k} examples are meant for remixing and testing with an informative tone. Avoid exaggerated claims and follow community guidelines.`;
  }
  return locale === "zh"
    ? `关于「${k}」的分步说明与工具链接：偏方法论与流程，具体效果因账号与赛道而异。`
    : `A concise, ToolEagle-style walkthrough for ${k.toLowerCase()}: steps, prompts, and tools. Outcomes vary by account and niche.`;
}
