import { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePageTemplate } from "@/components/seo/GuidePageTemplate";
import { AI_PROMPT_TOPICS, formatTopicLabel } from "@/config/traffic-topics";
import { getExamplesForTopic } from "@/lib/guide-data";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return AI_PROMPT_TOPICS.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  if (!AI_PROMPT_TOPICS.includes(topic as any)) return { title: "Not Found" };

  const topicLabel = formatTopicLabel(topic);
  const title = `AI Prompts for ${topicLabel} | ChatGPT Prompts for Creators`;
  const description = `50+ AI prompts for ${topicLabel.toLowerCase()} content. Copy and use with ChatGPT or our free AI tools.`;
  const url = `${BASE_URL}/ai-prompts-for/${topic}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url }
  };
}

export default async function AiPromptsForPage({ params }: Props) {
  const { topic } = await params;
  if (!AI_PROMPT_TOPICS.includes(topic as any)) notFound();

  const examples = await getExamplesForTopic(topic);

  return (
    <GuidePageTemplate
      pageType="ai-prompts"
      topic={topic}
      examples={examples}
      primaryTool="tiktok-caption-generator"
    />
  );
}
