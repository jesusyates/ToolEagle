import { Metadata } from "next";
import { TitleGeneratorClient } from "@/app/tools/title-generator/pageClient";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";
import { zhSeoTitle } from "@/config/zh-brand";

const pageTitle = zhSeoTitle("免费标题生成器");

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description:
    "输入主题，一键生成 TikTok、YouTube、Instagram 爆款标题。免费无需注册。",
  openGraph: {
    title: pageTitle,
    description: "输入主题，一键生成爆款标题。免费无需注册。",
    url: `${BASE_URL}/zh/tools/title-generator`
  }
};

export default async function ZhTitleGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({
    href: `/zh/search/${k.slug}`,
    label: k.keyword
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <div className="flex-1">
        <TitleGeneratorClient ctaLinks={ctaLinks} showZhInlineLead />
      </div>
    </main>
  );
}
