import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZhGuidePageTemplate } from "@/components/seo/ZhGuidePageTemplate";
import { ZhHubPageTemplate } from "@/components/seo/ZhHubPageTemplate";
import { parseZhSlug, isBaseTopicValid, ZH_PLATFORMS } from "@/config/traffic-topics";
import { getZhContent, shouldNoindexZhPage } from "@/lib/generate-zh-content";
import { getZhGuideStaticParamsForBuild } from "@/lib/zh-guide-static-params";
import { getZhPageMetadata, getZhGuideKeyword } from "@/lib/zh-metadata";
import { getExamplesForTopic } from "@/lib/guide-data";
import { BASE_URL } from "@/config/site";
type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return getZhGuideStaticParamsForBuild("ai-prompts");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const url = `${BASE_URL}/zh/ai-prompts-for/${topic}`;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    const keyword = getZhGuideKeyword("ai-prompts", topic);
    return getZhPageMetadata(keyword, url);
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("ai-prompts", baseTopic)) return { title: "Not Found" };

  const content = getZhContent("ai-prompts", topic);
  const keyword = getZhGuideKeyword("ai-prompts", topic);
  const noindex = shouldNoindexZhPage(content);
  return getZhPageMetadata(keyword, url, noindex);
}

export default async function ZhAiPromptsForPage({ params }: Props) {
  const { topic } = await params;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    return <ZhHubPageTemplate pageType="ai-prompts" platform={topic as (typeof ZH_PLATFORMS)[number]} />;
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("ai-prompts", baseTopic)) notFound();

  const content = getZhContent("ai-prompts", topic);
  if (!content) notFound();

  const examples = await getExamplesForTopic(baseTopic);

  return (
    <ZhGuidePageTemplate
      pageType="ai-prompts"
      topic={topic}
      content={content}
      examples={examples}
      primaryTool="tiktok-caption-generator"
    />
  );
}
