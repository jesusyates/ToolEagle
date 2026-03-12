import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { HashtagGeneratorClient } from "./pageClient";

export const metadata = {
  title: "Hashtag Generator",
  description: "Generate niche-friendly hashtags for TikTok, Reels and Shorts."
};

export default function HashtagGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <HashtagGeneratorClient />
      </div>
      <SiteFooter />
    </main>
  );
}

