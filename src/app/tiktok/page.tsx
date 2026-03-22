import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PlatformToolsPage } from "@/components/platform/PlatformToolsPage";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "TikTok Tools – Captions, Hooks, Hashtags & More",
  description:
    "Free TikTok tools for creators: caption generator, hook generator, hashtag generator, script generator and more. No sign-up required."
};

export default async function TikTokToolsPage() {
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
