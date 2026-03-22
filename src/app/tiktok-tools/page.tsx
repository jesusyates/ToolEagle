import { Metadata } from "next";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PlatformToolsPage } from "@/components/platform/PlatformToolsPage";
import { getAllPosts } from "@/lib/blog";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "TikTok Tools – Free AI Caption, Hook & Hashtag Generators",
  description:
    "Best TikTok tools for creators: caption generator, hook generator, hashtag generator, title generator. Free AI tools. No sign-up required.",
  alternates: { canonical: `${BASE_URL}/tiktok-tools` },
  openGraph: {
    title: "TikTok Tools | ToolEagle",
    description: "Free AI tools for TikTok creators. Captions, hooks, hashtags and more.",
    url: `${BASE_URL}/tiktok-tools`
  }
};

export default async function TikTokToolsLandingPage() {
  const posts = await getAllPosts();
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <PlatformToolsPage
        platform="tiktok"
        platformLabel="TikTok"
        platformUrl="https://www.tiktok.com/"
        latestPosts={posts}
      />
      <SiteFooter />
    </main>
  );
}
