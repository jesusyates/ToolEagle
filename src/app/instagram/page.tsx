import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PlatformToolsPage } from "@/components/platform/PlatformToolsPage";

export const metadata = {
  title: "Instagram Tools – Captions, Reels, Bio & More",
  description:
    "Free Instagram tools for creators: caption generator, Reels caption generator, bio generator, hashtag generator and more. No sign-up required."
};

export default function InstagramToolsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <PlatformToolsPage
        platform="instagram"
        platformLabel="Instagram"
        platformUrl="https://www.instagram.com/"
      />
      <SiteFooter />
    </main>
  );
}
