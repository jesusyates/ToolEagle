import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAutoPostBySlug, getAutoPostSlugs } from "@/lib/auto-posts-reader";
import { getRelatedGuideLinks } from "@/lib/guide-related";
import { getPublishedGuideAnswer, getPublishedGuideFaqs } from "@/lib/seo/rebuild-article";
import { SITE_URL } from "@/config/site";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getAutoPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getAutoPostBySlug(slug);
  if (!post) return { title: "Not found" };
  const title = post.title?.trim() || slug;
  const titleFull = `${title} | Creator Guides`;
  const answer = getPublishedGuideAnswer(post);
  const description = (post.description?.trim() || answer.slice(0, 320)).slice(0, 320);
  const canonical = `/guides/${slug}`;

  return {
    title: { absolute: titleFull },
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: titleFull,
      description,
      url: canonical,
      type: "article",
      siteName: "ToolEagle"
    },
    twitter: {
      card: "summary_large_image",
      title: titleFull,
      description
    }
  };
}

export default async function GuideDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getAutoPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedGuideLinks(slug, 5);
  const paragraphs = post.body.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const title = post.title || post.slug;
  const answerText = getPublishedGuideAnswer(post);
  const faqs = getPublishedGuideFaqs(post);
  const base = SITE_URL.replace(/\/$/, "");
  const pageUrl = `${base}/guides/${slug}`;
  const desc =
    post.description?.trim() || answerText.slice(0, 320);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description: desc,
        mainEntityOfPage: pageUrl,
        author: {
          "@type": "Organization",
          name: "ToolEagle"
        },
        datePublished: post.publishedAt,
        dateModified: post.publishedAt
      },
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
              <p key={i} className="whitespace-pre-wrap">
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
