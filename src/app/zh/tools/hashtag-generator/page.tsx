import { Metadata } from "next";
import { HashtagGeneratorClient } from "@/app/tools/hashtag-generator/pageClient";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { CtaLinksSection } from "@/components/tools/CtaLinksSection";
import { BASE_URL } from "@/config/site";
import { zhSeoTitle } from "@/config/zh-brand";

const pageTitle = zhSeoTitle("免费标签生成器");

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: "输入主题，一键生成 TikTok、Reels、Shorts 爆款标签。免费无需注册。",
  openGraph: {
    title: pageTitle,
    description: "输入主题，一键生成爆款标签。免费无需注册。",
    url: `${BASE_URL}/zh/tools/hashtag-generator`
  }
};

export default async function ZhHashtagGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <div className="flex-1">
        <HashtagGeneratorClient
          relatedAside={ctaLinks.length > 0 ? <CtaLinksSection links={ctaLinks} /> : undefined}
        />
      </div>
    </main>
  );
}
