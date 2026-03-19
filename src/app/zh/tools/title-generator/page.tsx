import { Metadata } from "next";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { TitleGeneratorClient } from "@/app/tools/title-generator/pageClient";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "免费标题生成器",
  description:
    "输入主题，一键生成 TikTok、YouTube、Instagram 爆款标题。免费无需注册。",
  openGraph: {
    title: "免费标题生成器 | ToolEagle",
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
      <SiteHeader />
      <div className="flex-1">
        <TitleGeneratorClient ctaLinks={ctaLinks} />
      </div>
      <SiteFooter />
    </main>
  );
}
