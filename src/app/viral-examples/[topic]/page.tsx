import { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePageTemplate } from "@/components/seo/GuidePageTemplate";
import { VIRAL_EXAMPLE_TOPICS, formatTopicLabel } from "@/config/traffic-topics";
import { getExamplesForTopic } from "@/lib/guide-data";
import { BASE_URL } from "@/config/site";
import { limitBuildStaticParams } from "@/lib/build-static-params-limit";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return limitBuildStaticParams(VIRAL_EXAMPLE_TOPICS.map((topic) => ({ topic })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  if (!VIRAL_EXAMPLE_TOPICS.includes(topic as any)) return { title: "Not Found" };

  const topicLabel = formatTopicLabel(topic);
  const title = `Viral ${topicLabel} Examples | Top Captions & Hooks`;
  const description = `Top viral ${topicLabel.toLowerCase()} examples. Copy, get inspired, or generate your own with our free AI tools.`;
  const url = `${BASE_URL}/viral-examples/${topic}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url }
  };
}

export default async function ViralExamplesPage({ params }: Props) {
  const { topic } = await params;
  if (!VIRAL_EXAMPLE_TOPICS.includes(topic as any)) notFound();

  const examples = await getExamplesForTopic(topic);

  return (
    <GuidePageTemplate
      pageType="viral-examples"
      topic={topic}
      examples={examples}
      primaryTool="tiktok-caption-generator"
    />
  );
}
