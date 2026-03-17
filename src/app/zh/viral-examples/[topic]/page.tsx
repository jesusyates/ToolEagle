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
  const childParams = getAllZhGuideParams().filter((p) => p.pageType === "viral-examples");
  const withContent = childParams.filter((p) => getZhContent("viral-examples", p.topic));
  const hubParams = getAllHubParams()
    .filter((h) => h.pageType === "viral-examples")
    .map((h) => ({ topic: h.platform }));
  return [...withContent.map((p) => ({ topic: p.topic })), ...hubParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  if (ZH_PLATFORMS.includes(topic as (typeof ZH_PLATFORMS)[number])) {
    const platform = topic as (typeof ZH_PLATFORMS)[number];
    const names: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
    const pName = names[platform] ?? platform;
    const title = `${pName}爆款案例10个（2026最新完整指南）`;
    const description = `想学 ${pName} 爆款案例？本文整理了10个最有效的方法，适合新手和进阶创作者，附带实操技巧。`;
    const url = `${BASE_URL}/zh/viral-examples/${topic}`;
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
  }
  const { baseTopic } = parseZhSlug(topic);
  if (!isBaseTopicValid("viral-examples", baseTopic)) return { title: "Not Found" };

  const content = getZhContent("viral-examples", topic);
  const title = getZhCtrTitle(content ?? null, "viral-examples", topic);
  const description = getZhCtrDescription(content ?? null, "viral-examples", topic);
  const url = `${BASE_URL}/zh/viral-examples/${topic}`;
  const noindex = shouldNoindexZhPage(content);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    ...(noindex && { robots: { index: false, follow: true } })
  };
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
