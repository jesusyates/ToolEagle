import { Metadata } from "next";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { HashtagGeneratorClient } from "@/app/tools/hashtag-generator/pageClient";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { CtaLinksSection } from "@/components/tools/CtaLinksSection";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "免费标签生成器",
  description: "输入主题，一键生成 TikTok、Reels、Shorts 爆款标签。免费无需注册。",
  openGraph: {
    title: "免费标签生成器 | ToolEagle",
    description: "输入主题，一键生成爆款标签。免费无需注册。",
    url: `${BASE_URL}/zh/tools/hashtag-generator`
  }
};

export default async function ZhHashtagGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <HashtagGeneratorClient
          relatedAside={ctaLinks.length > 0 ? <CtaLinksSection links={ctaLinks} /> : undefined}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
