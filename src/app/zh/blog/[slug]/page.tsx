import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZhBlogPageTemplate } from "@/components/seo/ZhBlogPageTemplate";
import {
  getBlogBySlug,
  getAllBlogSlugs,
  getRelatedBlogSlugs
} from "@/lib/zh-blog-data";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = getBlogBySlug(slug);

  if (!data) return { title: "Not Found" };

  const { entry, content } = data;
  const title = content.title || `${entry.keyword} | 创作者博客`;
  const description = content.description || content.directAnswer || `${entry.keyword}的实战经验与方法分享`;
  const url = `${BASE_URL}/zh/blog/${slug}`;

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      images: [{ url: `${BASE_URL}/og/${slug}`, width: 1200, height: 630, alt: title }],
      type: "article"
    },
    alternates: { canonical: url }
  };
}

export default async function ZhBlogPage({ params }: Props) {
  const { slug } = await params;
  const data = getBlogBySlug(slug);

  if (!data) notFound();

  const { entry, content } = data;
  const existingSlugs = new Set(getAllBlogSlugs());
  const relatedBlogs = getRelatedBlogSlugs(entry, existingSlugs, 2);

  return (
    <ZhBlogPageTemplate
      entry={entry}
      content={content}
      relatedBlogs={relatedBlogs}
    />
  );
}
