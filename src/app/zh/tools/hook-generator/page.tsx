import { Metadata } from "next";
import { ZhHookGeneratorClient } from "./ZhHookGeneratorClient";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "免费钩子生成器",
  description:
    "输入主题，一键生成 TikTok、YouTube、Shorts 爆款开场钩子。免费无需注册。",
  openGraph: {
    title: "免费钩子生成器 | ToolEagle",
    description: "输入主题，一键生成爆款开场钩子。免费无需注册。",
    url: `${BASE_URL}/zh/tools/hook-generator`
  }
};

export default async function ZhHookGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({
    href: `/zh/search/${k.slug}`,
    label: k.keyword
  }));

  return <ZhHookGeneratorClient ctaLinks={ctaLinks} />;
}
