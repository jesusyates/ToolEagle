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
  getIndexableSeoStaticParamRoutes,
  TOOL_MAP,
  getIntent
} from "@/config/seo/index";
import { getRealExamples, getSeoFaq } from "@/config/seo/content-templates";
import { tools } from "@/config/tools";
import { Video } from "lucide-react";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";
import { SeoToolLinks } from "@/components/seo/SeoToolLinks";
import { RelatedTopics } from "@/components/seo/RelatedTopics";
import { AnswerLinks } from "@/components/seo/AnswerLinks";
import { SeoClusterLinks } from "@/components/seo/SeoClusterLinks";
import { SeoExampleBlock } from "@/components/seo/SeoExampleBlock";
import { BestGuidesSection } from "@/components/seo/BestGuidesSection";
import { PopularGuidesSection } from "@/components/seo/PopularGuidesSection";
import { HubLinksSection } from "@/components/seo/HubLinksSection";
import { BASE_URL } from "@/config/site";
import { loadContentQualityStatus, shouldNoindexPath } from "@/lib/seo/load-content-quality-status";

type Props = {
  params: Promise<{ category: string; type: string; topic: string }>;
};

export const revalidate = 86400; // ISR: 24h

export async function generateStaticParams() {
  return getIndexableSeoStaticParamRoutes();
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

  const intent = getIntent(topic);
  const intentNoindex =
    intent === "questions" ||
    intent === "templates" ||
    intent === "ideas" ||
    intent === "examples";

  const cq = loadContentQualityStatus();
  const path = `/${category}/${type}/${topic}`;
  const qualityNoindex = shouldNoindexPath(path, cq);

  const ogImageUrl = `${BASE_URL}/og/${category}-${type}-${topic}.png`;

  return {
    title,
    description,
    robots: intentNoindex || qualityNoindex ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: `${BASE_URL}/${category}/${type}/${topic}`
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${category}/${type}/${topic}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl]
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
  const realExamples = getRealExamples(type, topic);
  const toolSlug = TOOL_MAP[`${category}_${type}`] ?? "tiktok-caption-generator";
  const tool = tools.find((t) => t.slug === toolSlug);
  const ToolIcon = tool?.icon ?? Video;
  const relatedTypes = getRelatedTypes(type);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <BestGuidesSection platform={category} />
            <SeoClusterLinks
              platform={category}
              type={type}
              currentTopic={topic}
              platformLabel={platformLabel}
              typeLabel={typeLabel}
            />
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {topicLabel} {platformLabel} {typeLabel}
            </h1>
            <p className="mt-4 text-xl text-slate-700 leading-relaxed">
              {topicLabel} {platformLabel} {typeLabel.toLowerCase()} that get views and engagement.
              Use our free AI generator to create multiple options in seconds.
            </p>
            <p className="mt-6 text-base text-slate-600 leading-relaxed">
              Great {topicLabel.toLowerCase()} {platformLabel} {typeLabel.toLowerCase()} hook viewers, add personality,
              and fit your niche. Whether you&apos;re creating for TikTok, Reels, or Shorts, the right {typeLabel.toLowerCase()} can boost engagement and make your content more discoverable. Generate ideas
              with our free AI tool—then pick the one that fits your voice.
            </p>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              The best {topicLabel.toLowerCase()} {typeLabel.toLowerCase()} feel authentic and match your content vibe.
              They invite comments, encourage saves, and help your videos reach new audiences. Use the
              examples below as inspiration, or create your own in seconds with our AI generator.
            </p>

            <SeoExampleBlock
              examples={realExamples}
              topicLabel={topicLabel}
              platformLabel={platformLabel}
              typeLabel={typeLabel}
              toolSlug={toolSlug}
            />

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">
                What are {topicLabel.toLowerCase()} {platformLabel} {typeLabel.toLowerCase()}?
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                {topicLabel} {platformLabel} {typeLabel.toLowerCase()} are {typeLabel.toLowerCase()} that match the {topicLabel.toLowerCase()} vibe—whether that&apos;s humor, aesthetics, or a specific niche. They help your content stand out, get more engagement, and connect with your audience. The best {typeLabel.toLowerCase()} feel natural and add value instead of feeling forced.
              </p>
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
                <li className="pl-4 border-l-2 border-slate-200">Writing captions that don&apos;t match the video—viewers notice the disconnect.</li>
                <li className="pl-4 border-l-2 border-slate-200">Using too many hashtags or irrelevant ones. Focus on 3–5 niche-specific tags.</li>
                <li className="pl-4 border-l-2 border-slate-200">Being too generic. {topicLabel} {typeLabel.toLowerCase()} should feel specific to your content.</li>
                <li className="pl-4 border-l-2 border-slate-200">Ignoring the first line. On many platforms, only the first line shows before &quot;more&quot;—make it count.</li>
              </ul>
            </section>

            <SeoToolCTA
              toolName={tool?.name ?? "TikTok Caption Generator"}
              toolSlug={toolSlug}
              description={`Generate viral ${topicLabel.toLowerCase()} ${typeLabel.toLowerCase()} instantly with AI`}
              icon={<ToolIcon className="h-6 w-6 text-sky-700" />}
            />

            <SeoToolLinks />

            <RelatedTopics
              platform={category}
              type={type}
              currentTopic={topic}
              platformLabel={platformLabel}
              typeLabel={typeLabel}
              count={8}
            />

            <HubLinksSection platform={category} />

            <AnswerLinks
              platform={category}
              type={type}
              platformLabel={platformLabel}
              typeLabel={typeLabel}
              limit={5}
            />

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">More resources</h2>
              <div className="mt-3 flex flex-wrap gap-4">
                <Link href={`/tools/${toolSlug}`} className="text-sm font-medium text-sky-600 hover:underline">
                  {tool?.name ?? "AI Generator"} →
                </Link>
                <Link href="/how-to/write-viral-captions" className="text-sm font-medium text-sky-600 hover:underline">
                  How to Write Viral Captions →
                </Link>
                <Link href="/how-to/create-viral-hooks" className="text-sm font-medium text-sky-600 hover:underline">
                  How to Create Viral Hooks →
                </Link>
                <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
                  Creator Examples →
                </Link>
                <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
                  Trending content →
                </Link>
                <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
                  Creator Answers →
                </Link>
                <Link href="/content-strategy/content-creator" className="text-sm font-medium text-sky-600 hover:underline">
                  Content Creator Strategy →
                </Link>
              </div>
            </section>

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

            <PopularGuidesSection />

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
                href="/examples"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Creator Examples →
              </Link>
              <Link
                href="/trending"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Trending content →
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
