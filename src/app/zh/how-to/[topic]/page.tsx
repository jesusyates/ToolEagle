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
  const childParams = getAllZhGuideParams().filter((p) => p.pageType === "how-to");
  const withContent = childParams.filter((p) => getZhContent("how-to", p.topic));
  const hubParams = getAllHubParams()
    .filter((h) => h.pageType === "how-to")
    .map((h) => ({ topic: h.platform }));
  return [...withContent.map((p) => ({ topic: p.topic })), ...hubParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    const platform = topic as (typeof ZH_PLATFORMS)[number];
    const pNames: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
    const pName = pNames[platform] ?? platform;
    const title = `${pName}涨粉的7个方法（2026最新完整指南合集）`;
    const description = `想在 ${pName} 快速涨粉？本文整理了7个最有效的方法，适合新手和进阶创作者，附带实操技巧。`;
    const url = `${BASE_URL}/zh/how-to/${topic}`;
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("how-to", baseTopic)) return { title: "Not Found" };

  const content = getZhContent("how-to", topic);
  const title = getZhCtrTitle(content ?? null, "how-to", topic);
  const description = getZhCtrDescription(content ?? null, "how-to", topic);
  const url = `${BASE_URL}/zh/how-to/${topic}`;
  const noindex = shouldNoindexZhPage(content);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    ...(noindex && { robots: { index: false, follow: true } })
  };
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
