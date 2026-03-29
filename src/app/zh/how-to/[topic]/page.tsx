import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZhGuidePageTemplate } from "@/components/seo/ZhGuidePageTemplate";
import { ZhHubPageTemplate } from "@/components/seo/ZhHubPageTemplate";
import { parseZhSlug, isBaseTopicValid, ZH_PLATFORMS } from "@/config/traffic-topics";
import { getZhContent, shouldNoindexZhPage } from "@/lib/generate-zh-content";
import { getZhGuideStaticParamsForBuild } from "@/lib/zh-guide-static-params";
import { getExamplesForTopic } from "@/lib/guide-data";
import { BASE_URL } from "@/config/site";
import { getZhPageMetadata, getZhGuideKeyword } from "@/lib/zh-metadata";
type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return getZhGuideStaticParamsForBuild("how-to");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const url = `${BASE_URL}/zh/how-to/${topic}`;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    const keyword = getZhGuideKeyword("how-to", topic);
    return getZhPageMetadata(keyword, url);
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("how-to", baseTopic)) return { title: "Not Found" };

  const content = getZhContent("how-to", topic);
  const keyword = getZhGuideKeyword("how-to", topic);
  const noindex = shouldNoindexZhPage(content);
  return getZhPageMetadata(keyword, url, noindex);
}

export default async function ZhHowToPage({ params }: Props) {
  const { topic } = await params;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    return <ZhHubPageTemplate pageType="how-to" platform={topic as (typeof ZH_PLATFORMS)[number]} />;
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("how-to", baseTopic)) notFound();

  const content = getZhContent("how-to", topic);
  if (!content) notFound();

  const examples = await getExamplesForTopic(baseTopic);

  return (
    <ZhGuidePageTemplate
      pageType="how-to"
      topic={topic}
      content={content}
      examples={examples}
      primaryTool="tiktok-caption-generator"
    />
  );
}
