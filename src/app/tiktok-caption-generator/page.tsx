import { Metadata } from "next";
import { ToolSeoLandingTemplate } from "@/components/seo/ToolSeoLandingTemplate";
import { BASE_URL } from "@/config/site";

const config = {
  slug: "tiktok-caption-generator",
  title: "TikTok Caption Generator – Free AI Tool | ToolEagle",
  metaDescription:
    "Free TikTok caption generator. Input keyword, click generate. Get scroll-stopping captions with hooks, emojis and hashtags. No login required.",
  h1: "TikTok Caption Generator",
  intro:
    "Generate viral TikTok captions in seconds. Enter your video idea, get multiple caption options with hooks, emojis and hashtags. No signup required—use instantly.",
  examples: [
    "You need to see this 👇",
    "Nobody is talking about this…",
    "POV: your algorithm finally gets you",
    "Save this for later 📌",
    "Stop scrolling for a sec 👇"
  ],
  usageSteps: [
    "输入关键词或视频创意",
    "点击「Generate TikTok Captions」",
    "复制结果，可分享到 Reddit / X",
    "粘贴到 TikTok 发布"
  ],
  toolHref: "/tools/tiktok-caption-generator",
  toolCta: "免费生成 TikTok 文案 →"
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

export default function TikTokCaptionGeneratorSeoPage() {
  return <ToolSeoLandingTemplate config={config} />;
}
