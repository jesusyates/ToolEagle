import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZhGuidePageTemplate } from "@/components/seo/ZhGuidePageTemplate";
import { ZhHubPageTemplate } from "@/components/seo/ZhHubPageTemplate";
import { parseZhSlug, isBaseTopicValid, ZH_PLATFORMS } from "@/config/traffic-topics";
import { getZhContent, getAllZhGuideParams, shouldNoindexZhPage } from "@/lib/generate-zh-content";
import { getAllHubParams } from "@/lib/zh-hub-data";
import { getZhPageMetadata, getZhGuideKeyword } from "@/lib/zh-metadata";
import { getExamplesForTopic } from "@/lib/guide-data";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  const childParams = getAllZhGuideParams().filter((p) => p.pageType === "content-strategy");
  const withContent = childParams.filter((p) => getZhContent("content-strategy", p.topic));
  const hubParams = getAllHubParams()
    .filter((h) => h.pageType === "content-strategy")
    .map((h) => ({ topic: h.platform }));
  return [...withContent.map((p) => ({ topic: p.topic })), ...hubParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const url = `${BASE_URL}/zh/content-strategy/${topic}`;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    const keyword = getZhGuideKeyword("content-strategy", topic);
    return getZhPageMetadata(keyword, url);
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("content-strategy", baseTopic)) return { title: "Not Found" };

  const content = getZhContent("content-strategy", topic);
  const keyword = getZhGuideKeyword("content-strategy", topic);
  const noindex = shouldNoindexZhPage(content);
  return getZhPageMetadata(keyword, url, noindex);
}

export default async function ZhContentStrategyPage({ params }: Props) {
  const { topic } = await params;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    return <ZhHubPageTemplate pageType="content-strategy" platform={topic as (typeof ZH_PLATFORMS)[number]} />;
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("content-strategy", baseTopic)) notFound();

  const content = getZhContent("content-strategy", topic);
  if (!content) notFound();

  const examples = await getExamplesForTopic(baseTopic);

  return (
    <ZhGuidePageTemplate
      pageType="content-strategy"
      topic={topic}
      content={content}
      examples={examples}
      primaryTool="hook-generator"
    />
  );
}
