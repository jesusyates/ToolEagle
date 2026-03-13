import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    url: `https://www.tooleagle.com/blog/${frontmatter.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.tooleagle.com/blog/${frontmatter.slug}`
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.tooleagle.com/"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: "https://www.tooleagle.com/blog"
        },
        {
          "@type": "ListItem",
          position: 3,
          name: frontmatter.title,
          item: `https://www.tooleagle.com/blog/${frontmatter.slug}`
        }
      ]
    }
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

          <MDXRemote source={content} components={mdxComponents} />

          <hr className="my-6 border-slate-200" />
          <p className="text-xs text-slate-500">
            Looking for tools to apply these ideas? Try{" "}
            <Link href="/tools/tiktok-caption-generator" className="text-sky-700 underline">
              TikTok Caption Generator
            </Link>{" "}
            or{" "}
            <Link href="/tools/title-generator" className="text-sky-700 underline">
              Title Generator
            </Link>
            .
          </p>
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>

      <SiteFooter />
    </main>
  );
}

