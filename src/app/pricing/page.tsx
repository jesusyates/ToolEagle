import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { Check } from "lucide-react";
import { PricingConversionTracker } from "@/components/pricing/PricingConversionTracker";
import { BASE_URL } from "@/config/site";
import { GlobalCreditsPaymentPanel } from "@/components/monetization/GlobalCreditsPaymentPanel";
import { listCreditPackages } from "@/lib/billing/package-config";

export const metadata = {
  title: "Pricing",
  description: "ToolEagle pricing plans. Free and Pro plans for creators.",
  alternates: {
    canonical: `${BASE_URL}/pricing`,
    languages: {
      en: `${BASE_URL}/pricing`,
      "zh-CN": `${BASE_URL}/zh/pricing`
    }
  }
};

export default function PricingPage() {
  const globalPacks = listCreditPackages("global");
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <PricingConversionTracker />
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-12">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Pricing
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
              Buy Credits
            </h1>
            <p className="text-slate-600 mt-3 max-w-xl mx-auto">
              Generate complete content in seconds. Pay only for what you use.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[0.95fr_1.35fr] items-stretch">
            <div className="space-y-6 flex flex-col h-full">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Why creators choose credits</h2>
                <ul className="mt-5 space-y-3">
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    Unlock full content generation without subscription lock-in
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    Generate complete content packs ready to publish
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    Scale output consistently with transparent usage tracking
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm mt-auto flex flex-col">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Free plan (compare first)</h3>
                <p className="mt-2 text-sm text-slate-600">Keep using free mode with {FREE_DAILY_LIMIT} generations/day.</p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    Compact output and limited daily volume
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    Upgrade only when you need higher throughput
                  </li>
                </ul>
                <Link
                  href="/tools"
                  className="mt-auto inline-flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Continue with free tools
                </Link>
              </div>
            </div>

            <div className="h-full">
              <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm h-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Credits checkout</p>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">Choose your credits pack</h3>
                <p className="mt-2 text-sm text-slate-600">Pick a pack, complete payment, and your balance updates automatically.</p>
                <div className="mt-5">
                  <GlobalCreditsPaymentPanel initialPacks={globalPacks} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
