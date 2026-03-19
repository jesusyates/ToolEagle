import { Metadata } from "next";
import { ToolSeoLandingTemplate } from "@/components/seo/ToolSeoLandingTemplate";
import { BASE_URL } from "@/config/site";

const config = {
  slug: "hook-generator",
  title: "Hook Generator – Free AI Tool | ToolEagle",
  metaDescription:
    "Free hook generator for TikTok, Reels, Shorts. Input keyword, click generate. Get viral first-line hooks. No login required.",
  h1: "Hook Generator",
  intro:
    "Generate viral hooks for short-form videos in seconds. Enter your topic, get punchy first lines that stop the scroll. No signup required—use instantly.",
  examples: [
    "POV: [outcome] without [pain]",
    "You're doing [topic] wrong, here's why:",
    "Stop scrolling if you [identity]",
    "No one is talking about [secret]",
    "If you [identity], watch this before [action]"
  ],
  usageSteps: [
    "输入视频主题",
    "点击「Generate Hooks」",
    "复制结果，可分享到 Reddit / X",
    "用于脚本开头或文案第一句"
  ],
  toolHref: "/tools/hook-generator",
  toolCta: "免费生成 Hook →"
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

export default function HookGeneratorSeoPage() {
  return <ToolSeoLandingTemplate config={config} />;
}
