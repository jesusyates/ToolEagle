import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZhKeywordPageTemplate } from "@/components/seo/ZhKeywordPageTemplate";
import { getKeywordBySlug } from "@/lib/keyword-patterns";
import {
  getKeywordContent,
  shouldNoindexKeywordPage,
  getAllKeywordSlugsWithContent,
  getZhKeywordSearchStaticParams
} from "@/lib/zh-keyword-content";
import { BASE_URL } from "@/config/site";
import { getZhPageMetadata } from "@/lib/zh-metadata";

type Props = { params: Promise<{ "keyword-slug": string }> };

export async function generateStaticParams() {
  return getZhKeywordSearchStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { "keyword-slug": slug } = await params;
  const entry = getKeywordBySlug(slug);
  const content = getKeywordContent(slug);

  if (!entry || !content) return { title: "Not Found" };

  const url = `${BASE_URL}/zh/search/${slug}`;
  const noindex = shouldNoindexKeywordPage(content);
  const overrides: { title?: string; description?: string; ogImage?: string } =
    content.title && content.description
      ? { title: content.title, description: content.description }
      : {};
  overrides.ogImage = `${BASE_URL}/og/${slug}`;
  return getZhPageMetadata(entry.keyword, url, noindex, overrides);
}

export default async function ZhSearchPage({ params }: Props) {
  const { "keyword-slug": slug } = await params;
  const entry = getKeywordBySlug(slug);
  const content = getKeywordContent(slug);

  if (!entry || !content) notFound();

  const existingSlugs = new Set(getAllKeywordSlugsWithContent());
  return <ZhKeywordPageTemplate entry={entry} content={content} existingSlugs={existingSlugs} />;
}
