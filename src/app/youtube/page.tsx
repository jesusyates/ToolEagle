import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PlatformToolsPage } from "@/components/platform/PlatformToolsPage";

export const metadata = {
  title: "YouTube Tools – Titles, Scripts, Descriptions & More",
  description:
    "Free YouTube tools for creators: title generator, script generator, description generator, thumbnail text and more. No sign-up required."
};

export default function YouTubeToolsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <PlatformToolsPage
        platform="youtube"
        platformLabel="YouTube"
        platformUrl="https://www.youtube.com/"
      />
      <SiteFooter />
    </main>
  );
}
