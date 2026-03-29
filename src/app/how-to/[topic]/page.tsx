import { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePageTemplate } from "@/components/seo/GuidePageTemplate";
import { HOW_TO_TOPICS, formatTopicLabel } from "@/config/traffic-topics";
import { getExamplesForTopic } from "@/lib/guide-data";
import { BASE_URL } from "@/config/site";
import { limitBuildStaticParams } from "@/lib/build-static-params-limit";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return limitBuildStaticParams(HOW_TO_TOPICS.map((topic) => ({ topic })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  if (!HOW_TO_TOPICS.includes(topic as any)) return { title: "Not Found" };

  const topicLabel = formatTopicLabel(topic);
  const title = `How to ${topicLabel} (2026 Guide)`;
  const description = `Learn how to ${topicLabel.toLowerCase()} with proven strategies, viral examples, AI prompts and free tools.`;
  const url = `${BASE_URL}/how-to/${topic}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url }
  };
}

export default async function HowToPage({ params }: Props) {
  const { topic } = await params;
  if (!HOW_TO_TOPICS.includes(topic as any)) notFound();

  const examples = await getExamplesForTopic(topic);

  return (
    <GuidePageTemplate
      pageType="how-to"
      topic={topic}
      examples={examples}
      primaryTool="tiktok-caption-generator"
    />
  );
}
