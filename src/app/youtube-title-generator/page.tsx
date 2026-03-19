import { Metadata } from "next";
import { ToolSeoLandingTemplate } from "@/components/seo/ToolSeoLandingTemplate";
import { BASE_URL } from "@/config/site";

const config = {
  slug: "youtube-title-generator",
  title: "YouTube Title Generator – Free AI Tool | ToolEagle",
  metaDescription:
    "Free YouTube title generator. Input keyword, click generate. Get click-worthy video titles. No login required.",
  h1: "YouTube Title Generator",
  intro:
    "Generate click-worthy YouTube titles in seconds. Enter your video topic, get multiple title options optimized for CTR. No signup required—use instantly.",
  examples: [
    "I Tried [X] So You Don't Have To",
    "The Truth About [Topic] Nobody Talks About",
    "7 Mistakes Killing Your [Niche]",
    "[Topic] in 10 Minutes: Full Guide",
    "Stop Doing [Wrong] (Do This Instead)"
  ],
  usageSteps: [
    "输入视频主题或关键词",
    "点击「Generate Titles」",
    "复制结果，可分享到 Reddit / X",
    "粘贴到 YouTube 上传页面"
  ],
  toolHref: "/tools/youtube-title-generator",
  toolCta: "免费生成 YouTube 标题 →"
};

export const metadata: Metadata = {
  title: config.title,
  description: config.metaDescription,
  alternates: { canonical: `${BASE_URL}/${config.slug}` },
  openGraph: {
    title: config.title,
    description: config.metaDescription,
    url: `${BASE_URL}/${config.slug}`,
    type: "website",
    siteName: "ToolEagle"
  },
  twitter: {
    card: "summary_large_image",
    title: config.title,
    description: config.metaDescription
  }
};

export default function YouTubeTitleGeneratorSeoPage() {
  return <ToolSeoLandingTemplate config={config} />;
}
