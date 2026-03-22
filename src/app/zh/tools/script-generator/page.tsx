import { Metadata } from "next";
import { GenericToolClient } from "@/components/tools/GenericToolClient";
import { CtaLinksSection } from "@/components/tools/CtaLinksSection";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";
import { zhSeoTitle } from "@/config/zh-brand";

const pageTitle = zhSeoTitle("免费脚本生成器");

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: "输入主题，一键生成短视频脚本（钩子、节奏、CTA）。免费无需注册。",
  openGraph: {
    title: pageTitle,
    description: "输入主题，一键生成短视频脚本。免费无需注册。",
    url: `${BASE_URL}/zh/tools/script-generator`
  }
};

export default async function ZhScriptGeneratorPage() {
  const keywords = getLatestKeywordPages(6);
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <div className="flex-1">
        <GenericToolClient
          slug="short-form-script-generator"
          relatedAside={ctaLinks.length > 0 ? <CtaLinksSection links={ctaLinks} /> : undefined}
        />
      </div>
    </main>
  );
}
