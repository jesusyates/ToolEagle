import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAllAutoPosts, getAutoPostBySlug } from "@/lib/auto-posts-reader";
import type { AutoPostRecord } from "@/lib/auto-posts-reader";
import { getRelatedGuideLinks } from "@/lib/guide-related";
import { getPublishedGuideAnswer, getPublishedGuideFaqs } from "@/lib/seo/rebuild-article";
import { SITE_URL } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

const siteBase = SITE_URL.replace(/\/$/, "");

function excerptFromContent(content: string, max = 160): string {
  const t = content.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max);
}

/** Meta description: explicit SEO text, or first 160 chars of body (whitespace-normalized). */
function buildMetaDescription(explicit: string | null | undefined, content: string): string {
  const e = explicit?.trim();
  if (e) return e.slice(0, 320);
  return excerptFromContent(content, 160);
}

/** Split body into paragraphs; break oversized blocks on single newlines to avoid giant DOM nodes. */
function paragraphsFromGuideBody(body: string): string[] {
  const chunks = body.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
  const out: string[] = [];
  for (const block of chunks) {
    if (block.length <= 1200) {
      out.push(block);
      continue;
    }
    const lines = block.split(/\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length > 1) out.push(...lines);
    else out.push(block);
  }
  return out.length > 0 ? out : [body.trim()];
}

type SeoArticleRow = {
  title: string;
  content: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

async function getPublishedSeoArticle(slug: string): Promise<SeoArticleRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("seo_articles")
      .select("title, content, description, created_at, updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("deleted", false)
      .maybeSingle();
    if (error || !data?.title || data.content == null) return null;
    return {
      title: String(data.title),
      content: String(data.content),
      description: data.description != null ? String(data.description) : null,
      created_at: data.created_at != null ? String(data.created_at) : undefined,
      updated_at: data.updated_at != null ? String(data.updated_at) : undefined
    };
  } catch {
    return null;
  }
}

function articleJsonLd(opts: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: {
      "@type": "Organization",
      name: "ToolEagle",
      url: siteBase
    },
    publisher: {
      "@type": "Organization",
      name: "ToolEagle",
      url: siteBase
    }
  };
}

function buildMetadataPayload(opts: {
  slug: string;
  titleFull: string;
  description: string;
}): Metadata {
  const canonicalUrl = `${siteBase}/guides/${opts.slug}`;
  return {
    title: { absolute: opts.titleFull },
    description: opts.description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      title: opts.titleFull,
      description: opts.description,
      url: canonicalUrl,
      type: "article",
      siteName: "ToolEagle",
      locale: "en_US"
    },
    twitter: {
      card: "summary_large_image",
      title: opts.titleFull,
      description: opts.description
    }
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const fromDb = await getPublishedSeoArticle(slug);
  if (fromDb) {
    const titleFull = `${fromDb.title.trim()} | Creator Guides`;
    const description = buildMetaDescription(fromDb.description, fromDb.content);
    return buildMetadataPayload({ slug, titleFull, description });
  }
  const post = await getAutoPostBySlug(slug);
  if (!post) {
    return {
      title: "Not found",
      robots: { index: false, follow: false }
    };
  }
  const title = post.title?.trim() || slug;
  const titleFull = `${title} | Creator Guides`;
  const answer = getPublishedGuideAnswer(post);
  const description = buildMetaDescription(post.description ?? null, `${post.body}\n\n${answer}`);
  return buildMetadataPayload({ slug, titleFull, description });
}

function fileGuideJsonLd(post: AutoPostRecord, pageUrl: string, description: string): Record<string, unknown> {
  const article = articleJsonLd({
    headline: post.title || post.slug,
    description,
    url: pageUrl,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt
  });
  const faqs = getPublishedGuideFaqs(post);
  return {
    "@context": "https://schema.org",
    "@graph": [
      article,
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer }
        }))
      }
    ]
  };
}

export default async function GuideDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const pageUrl = `${siteBase}/guides/${slug}`;

  const fromDb = await getPublishedSeoArticle(slug);
  if (fromDb) {
    const title = fromDb.title.trim();
    const paragraphs = paragraphsFromGuideBody(fromDb.content);
    const description = buildMetaDescription(fromDb.description, fromDb.content);
    const published = fromDb.created_at ?? new Date().toISOString();
    const modified = fromDb.updated_at ?? published;
    const jsonLd = articleJsonLd({
      headline: title,
      description,
      url: pageUrl,
      datePublished: published,
      dateModified: modified
    });

    return (
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
          }}
        />
        <SiteHeader />
        <article className="flex-1">
          <div className="container pt-10 pb-16 max-w-3xl">
            <p className="text-xs text-slate-500">
              <Link href="/guides" className="text-sky-700 hover:underline">
                Guides
              </Link>
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
            {fromDb.description?.trim() ? (
              <p className="mt-4 text-slate-600 leading-relaxed">{fromDb.description.trim()}</p>
            ) : null}
            <div className="mt-8 space-y-4 text-slate-800 leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-wrap break-words">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </article>
        <SiteFooter />
      </main>
    );
  }

  const corpus = await getAllAutoPosts();
  console.log(`[content-source] guides-page posts=${corpus.length} slug=${slug}`);
  const post = corpus.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = await getRelatedGuideLinks(slug, 5);
  const paragraphs = paragraphsFromGuideBody(post.body);
  const title = post.title || post.slug;
  const answerText = getPublishedGuideAnswer(post);
  const faqs = getPublishedGuideFaqs(post);
  const descriptionForSchema = buildMetaDescription(post.description ?? null, `${post.body}\n\n${answerText}`);

  const jsonLd = fileGuideJsonLd(post, pageUrl, descriptionForSchema);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col" data-guides-corpus={corpus.length}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
        }}
      />
      <SiteHeader />
      <article className="flex-1">
        <div className="container pt-10 pb-16 max-w-3xl">
          <p className="text-xs text-slate-500">
            <Link href="/guides" className="text-sky-700 hover:underline">
              Guides
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          <section className="ai-answer">
            <strong>Answer:</strong>{" "}
            <span>{answerText}</span>
          </section>
          <p className="mt-2 text-sm text-slate-500">{post.publishedAt}</p>
          {post.description ? <p className="mt-4 text-slate-600">{post.description}</p> : null}
          {post.hashtags.length > 0 ? (
            <p className="mt-4 text-sm text-slate-500">{post.hashtags.join(" ")}</p>
          ) : null}
          <div className="mt-8 space-y-4 text-slate-800 leading-relaxed">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap break-words">
                {p}
              </p>
            ))}
          </div>
          <section className="faq">
            <h2 className="text-xl font-semibold text-slate-900">FAQs</h2>
            <ul className="mt-4 list-none space-y-6 pl-0">
              {faqs.map((f, i) => (
                <li key={i}>
                  <strong>Q:</strong> {f.question}
                  <br />
                  <strong>A:</strong> {f.answer}
                </li>
              ))}
            </ul>
          </section>
          {related.length > 0 ? (
            <section className="related-guides">
              <h2 className="text-xl font-semibold text-slate-900">Related Guides</h2>
              <ul className="mt-4 list-none space-y-3 pl-0">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/guides/${r.slug}`} className="text-sky-700 hover:underline">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
