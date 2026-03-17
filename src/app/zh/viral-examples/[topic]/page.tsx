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
  const childParams = getAllZhGuideParams().filter((p) => p.pageType === "viral-examples");
  const withContent = childParams.filter((p) => getZhContent("viral-examples", p.topic));
  const hubParams = getAllHubParams()
    .filter((h) => h.pageType === "viral-examples")
    .map((h) => ({ topic: h.platform }));
  return [...withContent.map((p) => ({ topic: p.topic })), ...hubParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const url = `${BASE_URL}/zh/viral-examples/${topic}`;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    const keyword = getZhGuideKeyword("viral-examples", topic);
    return getZhPageMetadata(keyword, url);
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("viral-examples", baseTopic)) return { title: "Not Found" };

  const content = getZhContent("viral-examples", topic);
  const keyword = getZhGuideKeyword("viral-examples", topic);
  const noindex = shouldNoindexZhPage(content);
  return getZhPageMetadata(keyword, url, noindex);
}

export default async function ZhViralExamplesPage({ params }: Props) {
  const { topic } = await params;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    return <ZhHubPageTemplate pageType="viral-examples" platform={topic as (typeof ZH_PLATFORMS)[number]} />;
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("viral-examples", baseTopic)) notFound();

  const content = getZhContent("viral-examples", topic);
  if (!content) notFound();

  const examples = await getExamplesForTopic(baseTopic);

  return (
    <ZhGuidePageTemplate
      pageType="viral-examples"
      topic={topic}
      content={content}
      examples={examples}
      primaryTool="tiktok-caption-generator"
    />
  );
}
