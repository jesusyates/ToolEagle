import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAllPostsFromMdx, getPostBySlug } from "@/lib/blog";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx";
import { TryToolCard } from "@/components/blog/TryToolCard";
import { TryToolsCard } from "@/components/blog/TryToolsCard";
import { BlogToolCTA } from "@/components/blog/BlogToolCTA";
import { BlogAnswerLinks } from "@/components/blog/BlogAnswerLinks";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ProgrammaticBlogPost } from "@/components/blog/ProgrammaticBlogPost";
import {
  getAllProgrammaticBlogParams,
  getProgrammaticBlogSlug,
  parseProgrammaticBlogSlug,
  formatTopicForBlog,
  PLATFORM_LABELS,
  TYPE_LABELS
} from "@/config/programmatic-blog";
import { SITE_URL } from "@/config/site";
type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const mdxPosts = getAllPostsFromMdx();
  const programmaticParams = getAllProgrammaticBlogParams().map(({ topic, platform, type }) => ({
    slug: getProgrammaticBlogSlug(topic, platform, type)
  }));
  return [...mdxPosts.map((post) => ({ slug: post.frontmatter.slug })), ...programmaticParams];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;

  const programmatic = parseProgrammaticBlogSlug(slug);
  if (programmatic) {
    const { topic, platform, type } = programmatic;
    const topicLabel = formatTopicForBlog(topic);
    const platformLabel = PLATFORM_LABELS[platform] ?? platform;
    const typeLabel = TYPE_LABELS[type] ?? type;
    const title = `Best ${topicLabel} ${platformLabel} ${typeLabel} (2026)`;
    const description = `200+ best ${topicLabel.toLowerCase()} ${platformLabel} ${typeLabel.toLowerCase()}. Copy and use or generate more with our free AI tool.`;
    const url = `${SITE_URL}/blog/${slug}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "article", siteName: "ToolEagle" },
      twitter: { card: "summary_large_image", title, description }
    };
  }

  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found" };

  const { title, description, slug: postSlug } = post.frontmatter;
  const url = `https://www.tooleagle.com/blog/${postSlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: "ToolEagle" },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;

  const programmatic = parseProgrammaticBlogSlug(slug);
  if (programmatic) {
    return (
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1">
          <ProgrammaticBlogPost slug={slug} />
        </div>
        <SiteFooter />
      </main>
    );
  }

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { frontmatter, content } = post;

  const blogUrl = `${SITE_URL}/blog/${frontmatter.slug}`;

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    url: blogUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": blogUrl
    }
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: frontmatter.title, item: blogUrl }
    ]
  };

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl pt-10 pb-16 prose prose-slate">
          <p className="text-xs text-sky-700 font-semibold uppercase tracking-[0.2em]">
            Resources
          </p>
          <h1>{frontmatter.title}</h1>
          <p className="text-sm text-slate-500">
            {new Date(frontmatter.date).toLocaleDateString()}
            {frontmatter.author_name && (
              <>
                {" · "}
                {frontmatter.author_username ? (
                  <Link href={`/creators/${frontmatter.author_username}`} className="text-sky-600 hover:underline">
                    {frontmatter.author_name}
                  </Link>
                ) : (
                  frontmatter.author_name
                )}
              </>
            )}
            {frontmatter.tags?.length ? ` · ${frontmatter.tags.join(", ")}` : ""}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {frontmatter.description}
          </p>

          <hr className="my-4 border-slate-200" />

          {frontmatter.toc && frontmatter.toc.length > 0 && (
            <TableOfContents items={frontmatter.toc} />
          )}

          <MDXRemote source={content} components={mdxComponents} />

          <hr className="my-6 border-slate-200" />

          <BlogToolCTA frontmatter={frontmatter} />

          <hr className="my-6 border-slate-200" />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-900">Try our tools</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/creator"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Creator Mode →
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                AI Tools →
              </Link>
              <Link
                href="/trending"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Trending content →
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Creator Examples →
              </Link>
            </div>
          </div>

          <div className="mt-6">
            {frontmatter.recommendedTools?.length ? (
              <TryToolsCard toolSlugs={frontmatter.recommendedTools} />
            ) : (
              <TryToolCard tags={frontmatter.tags} />
            )}
          </div>

          <hr className="my-8 border-slate-200" />
          <BlogAnswerLinks />
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      </div>

      <SiteFooter />
    </main>
  );
}

