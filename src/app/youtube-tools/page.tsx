import { Metadata } from "next";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PlatformToolsPage } from "@/components/platform/PlatformToolsPage";
import { getAllPosts } from "@/lib/blog";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "YouTube Tools – Free AI Title, Hook & Description Generators",
  description:
    "Best YouTube tools for creators: title generator, hook generator, description generator. Free AI tools for Shorts and long-form. No sign-up required.",
  alternates: { canonical: `${BASE_URL}/youtube-tools` },
  openGraph: {
    title: "YouTube Tools | ToolEagle",
    description: "Free AI tools for YouTube creators. Titles, hooks, descriptions and more.",
    url: `${BASE_URL}/youtube-tools`
  }
};

export default async function YouTubeToolsLandingPage() {
  const posts = await getAllPosts();
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <PlatformToolsPage
        platform="youtube"
        platformLabel="YouTube"
        platformUrl="https://www.youtube.com/"
        latestPosts={posts}
      />
      <SiteFooter />
    </main>
  );
}
