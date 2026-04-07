import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import { getAllZhGuides, getZhGuideBySlug, getZhGuideSlugs } from "@/lib/zh-guides-reader";
import { getRelatedZhGuideLinks } from "@/lib/zh-guide-related";
import {
  getZhPublishedGuideAnswer,
  getZhPublishedGuideFaqs,
  sanitizeZhDisplayForJsonLd
} from "@/lib/seo-zh/zh-guide-display";
import { SITE_URL } from "@/config/site";

type Params = Promise<{ slug: string }>;

/** SSG: params from `content/zh-guides` (see getZhGuideSlugs). */
export const dynamic = "force-static";

export async function generateStaticParams() {
  const slugs = await getZhGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getZhGuideBySlug(slug);
  if (!post) return { title: "未找到" };
  const title = post.title?.trim() || slug;
  const answerText = getZhPublishedGuideAnswer(post);
  const description = sanitizeZhDisplayForJsonLd(
    (post.description?.trim() || answerText.slice(0, 320)).slice(0, 320)
  );
  const canonical = `/zh/guides/${slug}`;
  return {
    title: { absolute: `${title} | 中文指南` },
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | 中文指南`,
      description,
      url: canonical,
      type: "article",
      siteName: "ToolEagle"
    }
  };
}

export default async function ZhGuideDetailPage({ params }: { params: Params }) {
  const corpus = await getAllZhGuides();
  const { slug } = await params;
  console.log(`[content-source] zh-guides-page posts=${corpus.length} slug=${slug}`);
  const post = corpus.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = await getRelatedZhGuideLinks(slug, 5);
  const paragraphs = post.body.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const title = post.title || post.slug;
  const answerText = getZhPublishedGuideAnswer(post);
  const faqs = getZhPublishedGuideFaqs(post);
  const base = SITE_URL.replace(/\/$/, "");
  const pageUrl = `${base}/zh/guides/${slug}`;
  const desc = sanitizeZhDisplayForJsonLd(post.description?.trim() || answerText.slice(0, 320));
  const jsonLdTitle = sanitizeZhDisplayForJsonLd(title);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: jsonLdTitle,
        description: sanitizeZhDisplayForJsonLd(desc.slice(0, 320)),
        mainEntityOfPage: pageUrl,
    author: {
          "@type": "Organization",
          name: "ToolEagle"
        },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: sanitizeZhDisplayForJsonLd(f.question),
          acceptedAnswer: { "@type": "Answer", text: sanitizeZhDisplayForJsonLd(f.answer) }
        }))
      }
    ]
  };

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col" data-zh-guides-corpus={corpus.length}>
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
            <Link href="/zh/guides" className="text-sky-700 hover:underline">
              中文指南
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          <section className="ai-answer mt-4" itemProp="abstract">
            <strong>一句话总结：</strong> <span>{answerText}</span>
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
          <section className="faq mt-10">
            <h2 className="text-xl font-semibold text-slate-900">常见问题</h2>
            <ul className="mt-4 list-none space-y-6 pl-0">
              {faqs.map((f, i) => (
                <li key={i}>
                  <strong>问：</strong> {f.question}
                  <br />
                  <strong>答：</strong> {f.answer}
                </li>
              ))}
            </ul>
          </section>
          {related.length > 0 ? (
            <section className="related-guides mt-10">
              <h2 className="text-xl font-semibold text-slate-900">相关指南</h2>
              <ul className="mt-4 list-none space-y-3 pl-0">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/zh/guides/${r.slug}`} className="text-sky-700 hover:underline">
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
