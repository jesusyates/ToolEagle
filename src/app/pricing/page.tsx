import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { Check } from "lucide-react";
import { UpgradeLink } from "@/components/monetization/UpgradeLink";
import { hasPaymentLink } from "@/config/payment";
import { PricingConversionTracker } from "@/components/pricing/PricingConversionTracker";
import { BASE_URL } from "@/config/site";

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
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <PricingConversionTracker />
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Pricing
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
              Simple plans for creators
            </h1>
            <p className="text-slate-600 mt-3 max-w-xl mx-auto">
              Pay for <strong>better outputs</strong>, not just “more clicks”: full post packages, every variant, and
              strategy blocks you can learn from — built for creators who publish daily.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Free plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Free</h2>
              <p className="mt-1 text-3xl font-bold text-slate-900">$0</p>
              <p className="text-sm text-slate-600 mt-1">Forever free</p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  {FREE_DAILY_LIMIT} AI generations per day
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Compact post packages</strong> — fewer variants, shorter “why it works” / tips
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  Core tools + pattern library on-tool
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  Favorites and history
                </li>
              </ul>
              <Link
                href="/tools"
                className="mt-6 inline-flex w-full justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Get started
              </Link>
            </div>

            {/* Pro plan — ToolEagle Pro via Lemon Squeezy (NEXT_PUBLIC_PAYMENT_LINK) */}
            <div className="rounded-2xl border-2 border-slate-900 bg-slate-50/30 p-6 shadow-sm relative">
              <span className="absolute -top-3 left-4 rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-medium text-white">
                Popular
              </span>
              <h2 className="text-lg font-semibold text-slate-900">ToolEagle Pro</h2>
              <p className="mt-1 text-3xl font-bold text-slate-900">$9</p>
              <p className="text-sm text-slate-600 mt-1">per month · cancel anytime</p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  Unlimited AI generations
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Full post packages</strong> — more variants per run, deeper strategy & posting tips
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  Richer “why it works” + best-scenario blocks (caption / hook tools)
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  Grow faster — Pro-first tools as we ship them
                </li>
              </ul>
              <UpgradeLink className="mt-6 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                Grow faster — ToolEagle Pro ($9/mo) →
              </UpgradeLink>
              {!hasPaymentLink() ? (
                <p className="mt-2 text-xs text-amber-800">
                  Add your Lemon Squeezy product URL to <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_PAYMENT_LINK</code> in production.
                </p>
              ) : null}
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-12 space-y-10 pb-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
              <h2 className="text-lg font-bold text-slate-900">Use cases</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside">
                <li>
                  <strong>Batch filming day</strong> — generate 5 hook+caption variants, pick two, shoot both.
                </li>
                <li>
                  <strong>Growth experiments</strong> — keep the same topic, rotate hooks and CTAs with full “why it
                  works” notes.
                </li>
                <li>
                  <strong>Small team / VA</strong> — paste packages straight into a doc; everyone works off the same
                  structure.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">What you actually get (example)</h2>
              <p className="mt-2 text-sm text-slate-600">
                Each <strong>Pro</strong> run can include: Hook · talking points · caption · CTA line · hashtags · why
                it works · posting tips · best scenario — for <strong>five</strong> distinct variants.{" "}
                <strong>Free</strong> shows three variants with shorter bodies and blurred extra variants until you
                upgrade.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                See it live:{" "}
                <Link href="/tools/tiktok-caption-generator" className="text-sky-700 font-medium hover:underline">
                  TikTok Caption Generator
                </Link>{" "}
                ·{" "}
                <Link href="/ai-caption-generator" className="text-sky-700 font-medium hover:underline">
                  AI Caption Generator
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
