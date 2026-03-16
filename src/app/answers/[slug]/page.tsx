import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAnswerPage, getAllAnswerSlugs } from "@/config/answers";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { RelatedLinks } from "@/components/seo/RelatedLinks";
import { PageShareButtons } from "@/components/share/PageShareButtons";
import { AnswerSaveButton } from "@/components/save/AnswerSaveButton";
import { Video } from "lucide-react";
import { BASE_URL } from "@/config/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllAnswerSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getAnswerPage(slug);
  if (!page) return { title: "Not Found" };

  return {
    title: `${page.question} | ToolEagle`,
    description: page.shortAnswer.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/answers/${slug}` },
    openGraph: {
      title: page.question,
      description: page.shortAnswer.slice(0, 160),
      url: `${BASE_URL}/answers/${slug}`
    }
  };
}

export default async function AnswerPage({ params }: Props) {
  const { slug } = await params;
  const page = getAnswerPage(slug);
  if (!page) notFound();

  const tool = tools.find((t) => t.slug === page.toolSlug);
  const ToolIcon = tool?.icon ?? Video;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    }))
  };

  const qaSchema = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: page.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: page.shortAnswer
      }
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
            ← Creator Answers
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {page.question}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AnswerSaveButton answerSlug={slug} content={page.shortAnswer} variant="button" />
            <PageShareButtons
              pageUrl={`${BASE_URL}/answers/${slug}`}
              redditTitle={`${page.question} | ToolEagle Creator Answers`}
            />
          </div>

          {/* TLDR */}
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-sm font-semibold text-amber-800">TL;DR</h2>
            <p className="mt-1 text-sm text-amber-900">{page.tldr}</p>
          </div>

          {/* Short Answer */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Short Answer</h2>
            <p className="mt-2 text-slate-700 leading-relaxed">{page.shortAnswer}</p>
          </section>

          {/* Examples */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Examples</h2>
            <ul className="mt-3 space-y-3">
              {page.examples.map((ex, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
                >
                  &ldquo;{ex}&rdquo;
                </li>
              ))}
            </ul>
          </section>

          {/* Tips */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Tips</h2>
            <ol className="mt-3 space-y-2">
              {page.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="shrink-0 font-medium text-sky-600">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Quick Tips */}
          {page.quickTips?.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">Quick Tips</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {page.quickTips.map((qt, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-800"
                  >
                    {qt}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Common Mistakes */}
          {page.commonMistakes?.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">Common Mistakes</h2>
              <ul className="mt-3 space-y-2">
                {page.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-slate-700">
                    <span className="shrink-0 text-red-500">✗</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Generate CTA */}
          <SeoToolCTA
            toolName={page.toolName}
            toolSlug={page.toolSlug}
            description={`Generate ${page.toolName.toLowerCase().replace(" generator", "")}s instantly with AI. No sign-up required.`}
            icon={<ToolIcon className="h-6 w-6 text-sky-700" />}
            buttonLabel={`Generate with ${page.toolName}`}
          />

          {/* Internal links to related tools */}
          {page.relatedTools && page.relatedTools.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-slate-700">Related tools</h2>
              <div className="mt-2 flex flex-wrap gap-3">
                {page.relatedTools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    className="text-sm font-medium text-sky-600 hover:underline"
                  >
                    {t.name} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          <hr className="my-10 border-slate-200" />

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <dl className="mt-4 space-y-4">
              {page.faq.map((item, i) => (
                <div key={i}>
                  <dt className="font-medium text-slate-900">{item.question}</dt>
                  <dd className="mt-1 text-slate-600">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <hr className="my-10 border-slate-200" />

          <RelatedLinks answers={false} />

          <div className="mt-4 flex flex-wrap gap-4">
            <Link href={`/tools/${page.toolSlug}`} className="text-sm font-medium text-sky-600 hover:underline">
              {page.toolName} →
            </Link>
            <Link href="/questions" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Questions →
            </Link>
          </div>
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
