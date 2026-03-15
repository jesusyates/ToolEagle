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
import { getExamples } from "@/config/seo/content-templates";
import { tools } from "@/config/tools";
import { SeoToolCTA } from "@/components/seo/SeoToolCTA";

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

function getRelatedTopics(currentTopic: string, count: number): string[] {
  const idx = topics.indexOf(currentTopic as any);
  if (idx < 0) return topics.slice(0, count);
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    const j = (idx + i) % topics.length;
    if (!result.includes(topics[j])) result.push(topics[j]);
  }
  return result.slice(0, count);
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
  const relatedTopics = getRelatedTopics(topic, 5);
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

            <SeoToolCTA
              toolSlug={toolSlug}
              title={tool?.name}
              description={`Generate ${topicLabel.toLowerCase()} ${typeLabel.toLowerCase()} instantly. No sign-up required.`}
              buttonLabel="Generate with AI"
            />

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">
                Related Topics
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Explore more {platformLabel} {typeLabel.toLowerCase()} by topic.
              </p>
              <ul className="mt-3 space-y-2">
                {relatedTopics.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/${category}/${type}/${t}`}
                      className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                    >
                      {formatTopicLabel(t)} {typeLabel.toLowerCase()}
                    </Link>
                  </li>
                ))}
              </ul>
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

      <SiteFooter />
    </main>
  );
}
