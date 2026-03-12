import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { TitleGeneratorClient } from "./pageClient";

export const metadata = {
  title: "Title Generator",
  description: "Generate titles for YouTube, TikTok, Reels and Shorts."
};

export default function TitleGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <TitleGeneratorClient />
      </div>
      <SiteFooter />
    </main>
  );
}

