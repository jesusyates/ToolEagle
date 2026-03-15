import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { Check } from "lucide-react";

export const metadata = {
  title: "Pricing",
  description: "ToolEagle pricing plans. Free and Pro plans for creators."
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Pricing
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
              Simple plans for creators
            </h1>
            <p className="text-slate-600 mt-3">
              Start free. Upgrade when you need more.
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
                  All tools included
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

            {/* Pro plan */}
            <div className="rounded-2xl border-2 border-slate-900 bg-slate-50/30 p-6 shadow-sm relative">
              <span className="absolute -top-3 left-4 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                Coming soon
              </span>
              <h2 className="text-lg font-semibold text-slate-900">Pro</h2>
              <p className="mt-1 text-3xl font-bold text-slate-900">TBD</p>
              <p className="text-sm text-slate-600 mt-1">Placeholder</p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  Unlimited generations
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  Priority AI generation
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  Future advanced tools
                </li>
              </ul>
              <button
                type="button"
                disabled
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed"
              >
                Upgrade to Pro (coming soon)
              </button>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
