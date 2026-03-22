import type { Metadata } from "next";
import { BASE_URL } from "@/config/site";
import { zhSeoTitle } from "@/config/zh-brand";
import type { ProgrammaticPageType, PseoLocale, SeoKeywordRow } from "@/lib/programmatic-seo";
import { isKeywordIndexable, DEFAULT_INDEX_THRESHOLDS, pathForProgrammaticPage } from "@/lib/programmatic-seo";

function titleFor(pageType: ProgrammaticPageType, keyword: string, locale: PseoLocale): string {
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

function descriptionFor(pageType: ProgrammaticPageType, keyword: string, locale: PseoLocale): string {
  const k = keyword.trim();
  if (locale === "zh") {
    if (pageType === "ai_generator") {
      return `「${k}」参考型示例与提示词，语气中性、可改写。建议根据平台规则调整；不同账号情况可能不同。`;
    }
    if (pageType === "examples") {
      return `「${k}」示例与模板供改写测试；避免误导表述，遵守社区规范。建议根据平台规则调整。`;
    }
    return `「${k}」分步说明与工具链接；效果因账号与赛道而异。建议根据平台规则调整。`;
  }
  if (pageType === "ai_generator") {
    return `AI ${k} generator with advisory examples and prompts. Neutral, platform-aware guidance — adapt to your niche; not a guarantee of results.`;
  }
  if (pageType === "examples") {
    return `${k} examples and templates — remix for short video and blogs. Avoid misleading claims; follow community guidelines.`;
  }
  return `Learn how to ${k.toLowerCase()} with steps, prompts, and ToolEagle generators. Outcomes vary by account and platform.`;
}

export function buildPseoMetadata(opts: {
  pageType: ProgrammaticPageType;
  keyword: string;
  slug: string;
  locale: PseoLocale;
  keywordRow: SeoKeywordRow | null;
  alternatePathOtherLocale?: string | null;
}): Metadata {
  const { pageType, keyword, slug, locale, keywordRow, alternatePathOtherLocale } = opts;
  const indexable = keywordRow
    ? isKeywordIndexable(keywordRow, DEFAULT_INDEX_THRESHOLDS)
    : true;
  const path = pathForProgrammaticPage(pageType, slug, locale);
  const url = `${BASE_URL}${path}`;
  const t = titleFor(pageType, keyword, locale);
  const d = descriptionFor(pageType, keyword, locale).slice(0, 160);

  const enUrl = `${BASE_URL}${pathForProgrammaticPage(pageType, slug, "en")}`;
  const languages: Record<string, string> | undefined = alternatePathOtherLocale
    ? locale === "en"
      ? { en: url, zh: `${BASE_URL}${alternatePathOtherLocale}`, "x-default": enUrl }
      : { zh: url, en: `${BASE_URL}${alternatePathOtherLocale}`, "x-default": enUrl }
    : undefined;

  return {
    title: locale === "zh" ? { absolute: t } : t,
    description: d,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    alternates: {
      canonical: url,
      languages
    },
    openGraph: {
      title: t,
      description: d,
      url,
      type: "article",
      locale: locale === "zh" ? "zh_CN" : "en_US"
    }
  };
}
