import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAllPostsFromMdx, getAllPosts, getPostBySlug } from "@/lib/blog";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx";
import { TryToolCard } from "@/components/blog/TryToolCard";
import { TryToolsCard } from "@/components/blog/TryToolsCard";
import { BlogToolCTA } from "@/components/blog/BlogToolCTA";
import { TableOfContents } from "@/components/blog/TableOfContents";

type Params = {
  slug: string;
};

export async function generateStaticParams() {
  const mdxPosts = getAllPostsFromMdx();
  return mdxPosts.map((post) => ({
    slug: post.frontmatter.slug
  }));
}

export async function generateMetadata({
  params
}: {
  params: Params;
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Article not found"
    };
  }

  const { title, description, slug } = post.frontmatter;
  const url = `https://www.tooleagle.com/blog/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "ToolEagle"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const { frontmatter, content } = post;

  const blogUrl = `https://www.tooleagle.com/blog/${frontmatter.slug}`;

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
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.tooleagle.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.tooleagle.com/blog" },
      { "@type": "ListItem", position: 3, name: frontmatter.title, item: blogUrl }
    ]
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl pt-10 pb-16 prose prose-slate">
          <p className="text-xs text-sky-700 font-semibold uppercase tracking-[0.2em]">
            Resources
          </p>
          <h1>{frontmatter.title}</h1>
          <p className="text-sm text-slate-500">
            {new Date(frontmatter.date).toLocaleDateString()}
            {frontmatter.author_name && ` · ${frontmatter.author_name}`}
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
            </div>
          </div>

          <div className="mt-6">
            {frontmatter.recommendedTools?.length ? (
              <TryToolsCard toolSlugs={frontmatter.recommendedTools} />
            ) : (
              <TryToolCard tags={frontmatter.tags} />
            )}
          </div>
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

