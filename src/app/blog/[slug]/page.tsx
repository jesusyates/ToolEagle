import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx";
import { TryToolCard } from "@/components/blog/TryToolCard";
import { TryToolsCard } from "@/components/blog/TryToolsCard";
import { TableOfContents } from "@/components/blog/TableOfContents";

type Params = {
  slug: string;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.frontmatter.slug
  }));
}

export async function generateMetadata({
  params
}: {
  params: Params;
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);

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

export default function BlogPostPage({ params }: { params: Params }) {
  const post = getPostBySlug(params.slug);

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
            {new Date(frontmatter.date).toLocaleDateString()} ·{" "}
            {frontmatter.tags?.join(", ")}
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
          {frontmatter.recommendedTools?.length ? (
            <TryToolsCard toolSlugs={frontmatter.recommendedTools} />
          ) : (
            <TryToolCard tags={frontmatter.tags} />
          )}
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

