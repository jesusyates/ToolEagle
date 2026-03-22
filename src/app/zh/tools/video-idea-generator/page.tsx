import { Metadata } from "next";
import { GenericToolClient } from "@/components/tools/GenericToolClient";
import { CtaLinksSection } from "@/components/tools/CtaLinksSection";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";
import { zhSeoTitle } from "@/config/zh-brand";

const pageTitle = zhSeoTitle("免费视频选题生成器");

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: "输入领域，一键生成 TikTok、YouTube 爆款视频选题。免费无需注册。",
  openGraph: {
    title: pageTitle,
    description: "输入领域，一键生成爆款视频选题。免费无需注册。",
    url: `${BASE_URL}/zh/tools/video-idea-generator`
  }
};

export default async function ZhVideoIdeaGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <div className="flex-1">
        <GenericToolClient
          slug="youtube-video-idea-generator"
          relatedAside={ctaLinks.length > 0 ? <CtaLinksSection links={ctaLinks} /> : undefined}
        />
      </div>
    </main>
  );
}
