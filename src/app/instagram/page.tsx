import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PlatformToolsPage } from "@/components/platform/PlatformToolsPage";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Instagram Tools – Captions, Reels, Bio & More",
  description:
    "Free Instagram tools for creators: caption generator, Reels caption generator, bio generator, hashtag generator and more. No sign-up required."
};

export default async function InstagramToolsPage() {
  const posts = await getAllPosts();
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
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
