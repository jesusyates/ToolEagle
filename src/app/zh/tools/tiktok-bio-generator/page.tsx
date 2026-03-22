import { Metadata } from "next";
import { GenericToolClient } from "@/components/tools/GenericToolClient";
import { CtaLinksSection } from "@/components/tools/CtaLinksSection";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";
import { zhSeoTitle } from "@/config/zh-brand";

const pageTitle = zhSeoTitle("免费 TikTok 简介生成器");

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: "输入领域，一键生成 TikTok 吸粉简介。免费无需注册。",
  openGraph: {
    title: pageTitle,
    description: "输入领域，一键生成吸粉简介。免费无需注册。",
    url: `${BASE_URL}/zh/tools/tiktok-bio-generator`
  }
};

export default async function ZhTikTokBioGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <div className="flex-1">
        <GenericToolClient
          slug="tiktok-bio-generator"
          relatedAside={ctaLinks.length > 0 ? <CtaLinksSection links={ctaLinks} /> : undefined}
        />
      </div>
    </main>
  );
}
