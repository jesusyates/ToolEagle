import { Metadata } from "next";
import { ZhIdeaGeneratorClient } from "./ZhIdeaGeneratorClient";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "免费选题生成器",
  description:
    "输入领域，一键生成 TikTok、YouTube 爆款视频选题。免费无需注册。",
  openGraph: {
    title: "免费选题生成器 | ToolEagle",
    description: "输入领域，一键生成爆款视频选题。免费无需注册。",
    url: `${BASE_URL}/zh/tools/idea-generator`
  }
};

export default async function ZhIdeaGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({
    href: `/zh/search/${k.slug}`,
    label: k.keyword
  }));

  return <ZhIdeaGeneratorClient ctaLinks={ctaLinks} />;
}
