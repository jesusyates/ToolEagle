import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { HookGeneratorClient } from "./pageClient";

export const metadata = {
  title: "Hook Generator",
  description: "Generate viral hooks for short-form content."
};

export default function HookGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <HookGeneratorClient />
      </div>
      <SiteFooter />
    </main>
  );
}

