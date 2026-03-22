import { Metadata } from "next";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PlatformToolsPage } from "@/components/platform/PlatformToolsPage";
import { getAllPosts } from "@/lib/blog";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Instagram Tools – Free AI Caption, Hook & Hashtag Generators",
  description:
    "Best Instagram tools for creators: caption generator, hook generator, hashtag generator for Reels and posts. Free AI tools. No sign-up required.",
  alternates: { canonical: `${BASE_URL}/instagram-tools` },
  openGraph: {
    title: "Instagram Tools | ToolEagle",
    description: "Free AI tools for Instagram creators. Captions, hooks, hashtags and more.",
    url: `${BASE_URL}/instagram-tools`
  }
};

export default async function InstagramToolsLandingPage() {
  const posts = await getAllPosts();
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <PlatformToolsPage
        platform="instagram"
        platformLabel="Instagram"
        platformUrl="https://www.instagram.com/"
        latestPosts={posts}
      />
      <SiteFooter />
    </main>
  );
}
