import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgrammaticPageTemplate } from "@/components/seo/ProgrammaticPageTemplate";
import { loadProgrammaticPage } from "@/app/pseo/load-programmatic";
import { buildPseoMetadata } from "@/lib/pseo-metadata";
import {
  DEFAULT_INDEX_THRESHOLDS,
  isKeywordIndexable,
  pathForProgrammaticPage
} from "@/lib/programmatic-seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadProgrammaticPage("ai_generator", slug, "zh");
  if (!data) return { title: "Not found" };
  return buildPseoMetadata({
    pageType: "ai_generator",
    keyword: data.keyword,
    slug,
    locale: "zh",
    keywordRow: data.keywordRow,
    alternatePathOtherLocale: data.alternatePathOtherLocale
  });
}

export default async function ZhProgrammaticAiGeneratorPage({ params }: Props) {
  const { slug } = await params;
  const data = await loadProgrammaticPage("ai_generator", slug, "zh");
  if (!data) notFound();

  const indexable = data.keywordRow
    ? isKeywordIndexable(data.keywordRow, DEFAULT_INDEX_THRESHOLDS)
    : true;

  return (
    <ProgrammaticPageTemplate
      pageType="ai_generator"
      keyword={data.keyword}
      slug={data.slug}
      locale="zh"
      sourcePagePath={pathForProgrammaticPage("ai_generator", slug, "zh")}
      primaryLinks={data.primaryLinks}
      crossLocaleLinks={data.crossLocaleLinks}
      indexable={indexable}
    />
  );
}
