import { Metadata } from "next";
import { GenericToolClient } from "@/components/tools/GenericToolClient";
import { CtaLinksSection } from "@/components/tools/CtaLinksSection";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";
import { zhSeoTitle } from "@/config/zh-brand";

const pageTitle = zhSeoTitle("免费 Instagram 文案生成器");

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: "输入主题，一键生成 Instagram 爆款文案，含表情和标签。免费无需注册。",
  openGraph: {
    title: pageTitle,
    description: "输入主题，一键生成爆款文案。免费无需注册。",
    url: `${BASE_URL}/zh/tools/instagram-caption-generator`
  }
};

export default async function ZhInstagramCaptionGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <div className="flex-1">
        <GenericToolClient
          slug="instagram-caption-generator"
          relatedAside={ctaLinks.length > 0 ? <CtaLinksSection links={ctaLinks} /> : undefined}
        />
      </div>
    </main>
  );
}
