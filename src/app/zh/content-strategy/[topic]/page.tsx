import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZhGuidePageTemplate } from "@/components/seo/ZhGuidePageTemplate";
import { ZhHubPageTemplate } from "@/components/seo/ZhHubPageTemplate";
import { parseZhSlug, isBaseTopicValid, ZH_PLATFORMS } from "@/config/traffic-topics";
import { getZhContent, getAllZhGuideParams, shouldNoindexZhPage } from "@/lib/generate-zh-content";
import { getZhCtrTitle, getZhCtrDescription } from "@/lib/zh-ctr";
import { getAllHubParams } from "@/lib/zh-hub-data";
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
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    const platform = topic as (typeof ZH_PLATFORMS)[number];
    const names: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
    const pName = names[platform] ?? platform;
    const title = `${pName}内容策略的5个方法（2026最新完整指南）`;
    const description = `想做好 ${pName} 内容策略？本文整理了5个最有效的方法，适合新手和进阶创作者，附带实操技巧。`;
    const url = `${BASE_URL}/zh/content-strategy/${topic}`;
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("content-strategy", baseTopic)) return { title: "Not Found" };

  const content = getZhContent("content-strategy", topic);
  const title = getZhCtrTitle(content ?? null, "content-strategy", topic);
  const description = getZhCtrDescription(content ?? null, "content-strategy", topic);
  const url = `${BASE_URL}/zh/content-strategy/${topic}`;
  const noindex = shouldNoindexZhPage(content);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    ...(noindex && { robots: { index: false, follow: true } })
  };
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
