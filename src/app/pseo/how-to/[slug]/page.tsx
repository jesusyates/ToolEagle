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
  const data = await loadProgrammaticPage("how_to", slug, "en");
  if (!data) return { title: "Not found" };
  return buildPseoMetadata({
    pageType: "how_to",
    keyword: data.keyword,
    slug,
    locale: "en",
    keywordRow: data.keywordRow,
    alternatePathOtherLocale: data.alternatePathOtherLocale
  });
}

export default async function ProgrammaticHowToPage({ params }: Props) {
  const { slug } = await params;
  const data = await loadProgrammaticPage("how_to", slug, "en");
  if (!data) notFound();

  const indexable = data.keywordRow
    ? isKeywordIndexable(data.keywordRow, DEFAULT_INDEX_THRESHOLDS)
    : true;

  return (
    <ProgrammaticPageTemplate
      pageType="how_to"
      keyword={data.keyword}
      slug={data.slug}
      locale="en"
      sourcePagePath={pathForProgrammaticPage("how_to", slug, "en")}
      primaryLinks={data.primaryLinks}
      crossLocaleLinks={data.crossLocaleLinks}
      indexable={indexable}
    />
  );
}
