import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import {
  platforms,
  contentTypes,
  topics,
  PLATFORM_LABELS,
  CONTENT_TYPE_LABELS,
  formatTopicLabel,
  getAllSeoParams,
  TOOL_MAP
} from "@/config/seo/index";
import { getExamples, getSeoFaq } from "@/config/seo/content-templates";
import { tools } from "@/config/tools";
import { Video } from "lucide-react";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { RelatedTopics } from "@/components/seo/RelatedTopics";

const BASE_URL = "https://www.tooleagle.com";

type Props = {
  params: Promise<{ category: string; type: string; topic: string }>;
};

export const revalidate = 86400; // ISR: 24h

export async function generateStaticParams() {
  return getAllSeoParams().map(({ platform, type, topic }) => ({
    category: platform,
    type,
    topic
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, type, topic } = await params;
  if (
    !platforms.includes(category as any) ||
    !contentTypes.includes(type as any) ||
    !topics.includes(topic as any)
  ) {
    return { title: "Not Found" };
  }

  const topicLabel = formatTopicLabel(topic);
  const platformLabel = PLATFORM_LABELS[category as keyof typeof PLATFORM_LABELS];
  const typeLabel = CONTENT_TYPE_LABELS[type as keyof typeof CONTENT_TYPE_LABELS];

  const title = `${topicLabel} ${platformLabel} ${typeLabel} (2026)`;
  const description = `200+ ${topicLabel} ${platformLabel} ${typeLabel.toLowerCase()} for your videos. Copy and use instantly or generate more with AI.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${category}/${type}/${topic}`
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${category}/${type}/${topic}`
    }
  };
}

function getRelatedTypes(currentType: string): string[] {
  return contentTypes.filter((t) => t !== currentType).slice(0, 3);
}

export default async function SeoV2Page({ params }: Props) {
  const { category, type, topic } = await params;

  if (
    !platforms.includes(category as any) ||
    !contentTypes.includes(type as any) ||
    !topics.includes(topic as any)
  ) {
    notFound();
  }

  const topicLabel = formatTopicLabel(topic);
  const platformLabel = PLATFORM_LABELS[category as keyof typeof PLATFORM_LABELS];
  const typeLabel = CONTENT_TYPE_LABELS[type as keyof typeof CONTENT_TYPE_LABELS];
  const examples = getExamples(type, topic);
  const toolSlug = TOOL_MAP[`${category}_${type}`] ?? "tiktok-caption-generator";
  const tool = tools.find((t) => t.slug === toolSlug);
  const ToolIcon = tool?.icon ?? Video;
  const relatedTypes = getRelatedTypes(type);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {topicLabel} {platformLabel} {typeLabel}
            </h1>
            <p className="mt-4 text-xl text-slate-700 leading-relaxed">
              {topicLabel} {platformLabel} {typeLabel.toLowerCase()} that get views and engagement.
              Use our free AI generator to create multiple options in seconds.
            </p>
            <p className="mt-6 text-base text-slate-600 leading-relaxed">
              Great {topicLabel.toLowerCase()} {typeLabel.toLowerCase()} hook viewers, add personality,
              and fit your niche. Generate ideas with our AI tool—then pick the one that fits your
              voice.
            </p>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">
                What are {topicLabel.toLowerCase()} {platformLabel} {typeLabel.toLowerCase()}?
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                {topicLabel} {platformLabel} {typeLabel.toLowerCase()} are {typeLabel.toLowerCase()} that match the {topicLabel.toLowerCase()} vibe—whether that's humor, aesthetics, or a specific niche. They help your content stand out, get more engagement, and connect with your audience. The best {typeLabel.toLowerCase()} feel natural and add value instead of feeling forced.
              </p>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">
                Example {topicLabel} {typeLabel}
              </h2>
              <ul className="mt-3 space-y-2">
                {examples.slice(0, 30).map((ex, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 pl-4 border-l-2 border-slate-200"
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">
                Tips for writing {topicLabel.toLowerCase()} {typeLabel.toLowerCase()}
              </h2>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li className="pl-4 border-l-2 border-slate-200">Keep it short—under 150 characters works best for most platforms.</li>
                <li className="pl-4 border-l-2 border-slate-200">Match the tone of your video. A funny video needs a funny caption.</li>
                <li className="pl-4 border-l-2 border-slate-200">Use emojis sparingly to add personality without cluttering.</li>
                <li className="pl-4 border-l-2 border-slate-200">End with a question or CTA to encourage comments and shares.</li>
                <li className="pl-4 border-l-2 border-slate-200">Test different options. Use our AI generator to create multiple versions and see what performs.</li>
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">
                Common mistakes to avoid
              </h2>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li className="pl-4 border-l-2 border-slate-200">Writing captions that don't match the video—viewers notice the disconnect.</li>
                <li className="pl-4 border-l-2 border-slate-200">Using too many hashtags or irrelevant ones. Focus on 3–5 niche-specific tags.</li>
                <li className="pl-4 border-l-2 border-slate-200">Being too generic. {topicLabel} {typeLabel.toLowerCase()} should feel specific to your content.</li>
                <li className="pl-4 border-l-2 border-slate-200">Ignoring the first line. On many platforms, only the first line shows before "more"—make it count.</li>
              </ul>
            </section>

            <SeoToolCTA
              toolName={tool?.name ?? "TikTok Caption Generator"}
              toolSlug={toolSlug}
              description={`Generate viral ${topicLabel.toLowerCase()} ${typeLabel.toLowerCase()} instantly with AI`}
              icon={<ToolIcon className="h-6 w-6 text-sky-700" />}
            />

            <RelatedTopics
              platform={category}
              type={type}
              currentTopic={topic}
              platformLabel={platformLabel}
              typeLabel={typeLabel}
            />

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">
                More {platformLabel} {typeLabel}
              </h2>
              <ul className="mt-3 space-y-2">
                {relatedTypes.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/${category}/${t}/${topic}`}
                      className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                    >
                      {topicLabel} {platformLabel} {CONTENT_TYPE_LABELS[t as keyof typeof CONTENT_TYPE_LABELS]}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">FAQ</h2>
              <dl className="mt-4 space-y-4">
                {getSeoFaq(platformLabel, typeLabel, topicLabel).map((faq, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                    <dt className="font-medium text-slate-900">{faq.question}</dt>
                    <dd className="mt-2 text-sm text-slate-600 leading-relaxed">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Browse all tools →
              </Link>
              <Link
                href="/creator"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Creator Mode →
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
              >
                Creator Playbook →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: getSeoFaq(platformLabel, typeLabel, topicLabel).map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer
              }
            }))
          })
        }}
      />
      <SiteFooter />
    </main>
  );
}
