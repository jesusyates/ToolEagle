import { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePageTemplate } from "@/components/seo/GuidePageTemplate";
import { CONTENT_STRATEGY_TOPICS, formatTopicLabel } from "@/config/traffic-topics";
import { getExamplesForTopic } from "@/lib/guide-data";
import { BASE_URL } from "@/config/site";
import { limitBuildStaticParams } from "@/lib/build-static-params-limit";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return limitBuildStaticParams(CONTENT_STRATEGY_TOPICS.map((topic) => ({ topic })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  if (!CONTENT_STRATEGY_TOPICS.includes(topic as any)) return { title: "Not Found" };

  const topicLabel = formatTopicLabel(topic);
  const title = `Content Strategy for ${topicLabel} | Creator Guide`;
  const description = `Complete content strategy for ${topicLabel.toLowerCase()}. Posting cadence, content pillars, growth tips and AI tools.`;
  const url = `${BASE_URL}/content-strategy/${topic}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url }
  };
}

export default async function ContentStrategyPage({ params }: Props) {
  const { topic } = await params;
  if (!CONTENT_STRATEGY_TOPICS.includes(topic as any)) notFound();

  const examples = await getExamplesForTopic(topic);

  return (
    <GuidePageTemplate
      pageType="content-strategy"
      topic={topic}
      examples={examples}
      primaryTool="hook-generator"
    />
  );
}
