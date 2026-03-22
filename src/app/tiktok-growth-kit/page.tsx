import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { ValueProofBlock } from "@/components/value/ValueProofBlock";
import { UpgradeLink } from "@/components/monetization/UpgradeLink";
import { BASE_URL } from "@/config/site";

export const metadata = {
  title: "TikTok Growth Kit — Workflow for More Views & Faster Posts | ToolEagle",
  description:
    "Not a tool list — a creator workflow: hooks, captions, and hashtags chained for views, speed, and better packaging. Free tools + Pro post packages.",
  alternates: { canonical: `${BASE_URL}/tiktok-growth-kit` }
};

const workflows = [
  {
    problem: "You need more views — people scroll past in 1 second.",
    steps: ["Start with the Hook Generator — lock a scroll-stopping first line.", "Run the TikTok Caption Generator for a full post package.", "Add discovery tags with the Hashtag Generator when needed."],
    tools: [
      { href: "/tools/hook-generator", label: "Hook Generator" },
      { href: "/tools/tiktok-caption-generator", label: "TikTok Caption Generator" },
      { href: "/tools/hashtag-generator", label: "Hashtag Generator" }
    ]
  },
  {
    problem: "You write too slow — filming day becomes writing day.",
    steps: ["Use AI Caption Generator for cross-platform packages with talking points.", "Copy script beats to your teleprompter or notes.", "Regenerate variants instead of staring at a blank doc."],
    tools: [
      { href: "/ai-caption-generator", label: "AI Caption Generator" },
      { href: "/tools/tiktok-caption-generator", label: "TikTok Caption Generator" }
    ]
  },
  {
    problem: "Captions feel weak — good video, flat text.",
    steps: ["Generate packages that include CTA + why-it-works so you learn patterns.", "Steal structures from the pattern library on each tool page.", "Upgrade to Pro for deeper strategy blocks and more variants."],
    tools: [
      { href: "/tools/tiktok-caption-generator", label: "TikTok Caption Generator" },
      { href: "/pricing", label: "Pricing — Free vs Pro" }
    ]
  },
  {
    problem: "You’re not sure what to post this week.",
    steps: ["Pick one scenario below, open the first linked tool, paste a rough idea.", "Save a local template from results for reuse.", "Iterate one variable (hook only, or CTA only) next time."],
    tools: [
      { href: "/tools/tiktok-idea-generator", label: "TikTok Idea Generator" },
      { href: "/tools/tiktok-caption-generator", label: "TikTok Caption Generator" }
    ]
  }
];

export default function TikTokGrowthKitPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container pt-10 pb-16 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">Workflow · V95</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">TikTok Growth Kit</h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            This page solves a <strong>workflow problem</strong>: most creators don’t fail because they lack tools — they fail because
            hooks, captions, and tags aren’t chained into a repeatable system. Below: real scenarios, recommended order, and links.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <UpgradeLink className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
              Pro — full post packages →
            </UpgradeLink>
            <Link
              href="/tools/tiktok-caption-generator"
              className="inline-flex rounded-xl border-2 border-sky-400 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-900 hover:bg-sky-100"
            >
              Start with captions →
            </Link>
            <Link href="/" className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Back to home
            </Link>
          </div>

          <div className="mt-10">
            <ValueProofBlock variant="growth_kit" />
          </div>

          <section className="mt-12 space-y-10" aria-label="Workflows">
            {workflows.map((w, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <h2 className="text-lg font-bold text-slate-900">Scenario {i + 1}: {w.problem}</h2>
                <ol className="mt-4 space-y-2 list-decimal list-inside text-sm text-slate-700">
                  {w.steps.map((s, j) => (
                    <li key={j} className="pl-1">
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap gap-2">
                  {w.tools.map((t) => (
                    <Link
                      key={t.href}
                      href={t.href}
                      className="inline-flex rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-sm font-medium text-sky-800 hover:border-sky-300"
                    >
                      {t.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50/80 p-6">
            <h2 className="text-lg font-bold text-slate-900">Why Pro is about better results</h2>
            <p className="mt-2 text-sm text-slate-700">
              Free gives you <strong>compact</strong> packages (fewer variants, shorter strategy). Pro gives <strong>full</strong> post packages:
              more variants per run, richer “why it works” and posting tips — so you ship faster <em>and</em> learn faster.
            </p>
            <UpgradeLink className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
              See Pro on pricing →
            </UpgradeLink>
          </section>

          <p className="mt-10 text-sm text-slate-500">
            Internal link tip: link to this page from blogs and tool sidebars as your “start here” growth path — it’s outcome-first, not a
            generic directory.
          </p>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
