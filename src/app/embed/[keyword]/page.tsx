import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmbedWidgetClient } from "./EmbedWidgetClient";
import { getKeywordBySlug } from "@/lib/keyword-patterns";
import { getKeywordContent, getZhKeywordEmbedStaticParams } from "@/lib/zh-keyword-content";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ keyword: string }> };

export async function generateStaticParams() {
  return getZhKeywordEmbedStaticParams();
}

export const metadata: Metadata = {
  robots: "noindex, nofollow"
};

export default async function EmbedPage({ params }: Props) {
  const { keyword: slug } = await params;
  const entry = getKeywordBySlug(slug);
  const content = getKeywordContent(slug);

  if (!entry || !content) notFound();

  const pageUrl = `${BASE_URL}/zh/search/${slug}`;
  const title = content.h1 || content.title || entry.keyword;
  const sample =
    content.resultPreview?.[0] ||
    content.directAnswer?.slice(0, 80) ||
    `${entry.keyword} 实战技巧`;

  return (
    <EmbedWidgetClient
      slug={slug}
      title={title}
      sample={sample}
      pageUrl={pageUrl}
      keyword={entry.keyword}
    />
  );
}
