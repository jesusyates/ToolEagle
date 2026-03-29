import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getLearnAiArticle, getAllLearnAiSlugs } from "@/config/learn-ai";
import { LearnAiContent } from "./LearnAiContent";
import { BASE_URL } from "@/config/site";
import { limitBuildStaticParams } from "@/lib/build-static-params-limit";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return limitBuildStaticParams(getAllLearnAiSlugs().map((slug) => ({ slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearnAiArticle(slug);
  if (!article) return { title: "Not Found" };

  return {
    title: `${article.title} | Learn AI`,
    description: article.description,
    alternates: { canonical: `${BASE_URL}/learn-ai/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `${BASE_URL}/learn-ai/${slug}`
    }
  };
}

export default async function LearnAiArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getLearnAiArticle(slug);
  if (!article) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    }))
  };

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container max-w-3xl py-12 prose prose-slate">
          <Link href="/learn-ai" className="text-sm font-medium text-sky-600 hover:underline">
            ← Learn AI
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {article.title}
          </h1>
          <p className="mt-2 text-slate-600">{article.description}</p>

          <hr className="my-6 border-slate-200" />

          <LearnAiContent slug={slug} />

          <hr className="my-8 border-slate-200" />

          <section>
            <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
            <dl className="mt-4 space-y-4">
              {article.faq.map((item, i) => (
                <div key={i}>
                  <dt className="font-medium text-slate-900">{item.question}</dt>
                  <dd className="mt-1 text-slate-600">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <hr className="my-8 border-slate-200" />

          <div className="flex flex-wrap gap-4">
            <Link href="/ai-prompt-improver" className="text-sm font-medium text-sky-600 hover:underline">
              Improve your prompts →
            </Link>
            <Link href="/ai-prompts" className="text-sm font-medium text-sky-600 hover:underline">
              Prompt Library →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              Use ToolEagle tools →
            </Link>
          </div>
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
