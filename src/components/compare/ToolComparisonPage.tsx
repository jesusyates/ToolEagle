/**
 * v51 - Tool Comparison Page
 * 800-1200 words, full SEO structure
 */

import Link from "next/link";
import { Check, X, Sparkles } from "lucide-react";
import type { AIToolEntry } from "@/config/ai-tools-database";
import { getAIToolCategory } from "@/config/ai-tool-categories";
import { getToolAlternatives } from "@/lib/ai-tool-seo-content";
import { getRelatedComparisons } from "@/lib/generate-comparisons";
import { getAIToolFromDatabase } from "@/config/ai-tools-database";
import { HOW_TO_TOPICS, AI_PROMPT_TOPICS } from "@/config/traffic-topics";

type Props = {
  toolA: AIToolEntry;
  toolB: AIToolEntry;
  slug: string;
};

function formatCategory(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toolHref(t: AIToolEntry): string {
  if (t.isTooleagle && t.toolSlug) return `/tools/${t.toolSlug}`;
  return `/ai-tools/${t.slug}`;
}

export function ToolComparisonPage({ toolA, toolB, slug }: Props) {
  const cat = getAIToolCategory(toolA.category);
  const alternativesA = getToolAlternatives(toolA).filter((t) => t.slug !== toolB.slug).slice(0, 4);
  const alternativesB = getToolAlternatives(toolB).filter((t) => t.slug !== toolA.slug).slice(0, 4);
  const alternatives = [...alternativesA, ...alternativesB]
    .filter((t, i, arr) => arr.findIndex((x) => x.slug === t.slug) === i)
    .slice(0, 6);
  const relatedComparisons = getRelatedComparisons(toolA.slug, toolB.slug, 6);

  const allFeatures = [...new Set([...(toolA.features || []), ...(toolB.features || [])])];

  const intro = `${toolA.name} and ${toolB.name} are both popular AI tools in the ${cat?.name ?? formatCategory(toolA.category)} space. Choosing between them depends on your workflow, budget, and priorities. This comparison covers features, pricing, use cases, and when each tool shines.`;

  const overviewText = `${toolA.name} ${toolA.description} ${toolB.name} ${toolB.description} Both tools serve creators and marketers in similar ways but differ in features, pricing, and ease of use.`;

  return (
    <article className="container max-w-3xl py-12">
      <Link href="/compare" className="text-sm font-medium text-sky-600 hover:underline">
        ← Compare AI Tools
      </Link>

      <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
        {toolA.name} vs {toolB.name}
      </h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 sr-only">Intro</h2>
        <p className="text-slate-600 leading-relaxed">{intro}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Overview Comparison</h2>
        <p className="mt-3 text-slate-600 leading-relaxed">{overviewText}</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href={toolHref(toolA)} className="text-sm font-medium text-sky-600 hover:underline">
            {toolA.name} details →
          </Link>
          <Link href={toolHref(toolB)} className="text-sm font-medium text-sky-600 hover:underline">
            {toolB.name} details →
          </Link>
          <Link href={`/ai-tools/category/${toolA.category}`} className="text-sm font-medium text-sky-600 hover:underline">
            More {formatCategory(toolA.category)} tools
          </Link>
        </div>
      </section>

      {allFeatures.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Feature Comparison</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-900">Feature</th>
                  <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-900">{toolA.name}</th>
                  <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-900">{toolB.name}</th>
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((f, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="border border-slate-200 px-4 py-3 text-slate-700">{f}</td>
                    <td className="border border-slate-200 px-4 py-3">
                      {(toolA.features || []).includes(f) ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300" />
                      )}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      {(toolB.features || []).includes(f) ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300" />
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-slate-200">
                  <td className="border border-slate-200 px-4 py-3 text-slate-700">Pricing</td>
                  <td className="border border-slate-200 px-4 py-3 text-slate-600 capitalize">{toolA.pricing}</td>
                  <td className="border border-slate-200 px-4 py-3 text-slate-600 capitalize">{toolB.pricing}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {((toolA.useCases?.length ?? 0) > 0 || (toolB.useCases?.length ?? 0) > 0) && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Use Cases</h2>
          <p className="mt-2 text-slate-600">
            Both tools support similar workflows. {toolA.name} is commonly used for {(toolA.useCases || []).slice(0, 2).join(" and ")}. {toolB.name} excels at {(toolB.useCases || []).slice(0, 2).join(" and ")}.
          </p>
          <ul className="mt-4 space-y-2">
            {[...new Set([...(toolA.useCases || []), ...(toolB.useCases || [])])].slice(0, 6).map((uc, i) => (
              <li key={i} className="flex gap-2 text-slate-600">
                <span className="text-sky-500">•</span>
                {uc}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Pricing Comparison</h2>
        <p className="mt-2 text-slate-600">
          {toolA.name} is {toolA.pricing === "free" ? "free" : toolA.pricing === "freemium" ? "freemium (free tier + paid)" : "paid"}. {toolB.name} is {toolB.pricing === "free" ? "free" : toolB.pricing === "freemium" ? "freemium" : "paid"}. {toolA.pricing === "free" && toolB.pricing !== "free" ? `${toolA.name} is a strong choice if budget is a concern.` : toolB.pricing === "free" && toolA.pricing !== "free" ? `${toolB.name} offers a free option.` : "Compare plans on their websites to find the best fit."}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Pros & Cons</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">{toolA.name}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Pros</p>
                <ul className="mt-2 space-y-1">
                  {(toolA.pros || []).slice(0, 4).map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Cons</p>
                <ul className="mt-2 space-y-1">
                  {(toolA.cons || []).slice(0, 3).map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <X className="h-4 w-4 shrink-0 text-amber-500" />
                      {c}
                    </li>
                  ))}
                  {(toolA.cons?.length ?? 0) === 0 && (
                    <li className="text-sm text-slate-500">No major cons noted</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">{toolB.name}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Pros</p>
                <ul className="mt-2 space-y-1">
                  {(toolB.pros || []).slice(0, 4).map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Cons</p>
                <ul className="mt-2 space-y-1">
                  {(toolB.cons || []).slice(0, 3).map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <X className="h-4 w-4 shrink-0 text-amber-500" />
                      {c}
                    </li>
                  ))}
                  {(toolB.cons?.length ?? 0) === 0 && (
                    <li className="text-sm text-slate-500">No major cons noted</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">When to Choose Each</h2>
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-6">
            <h3 className="font-semibold text-slate-900">When to choose {toolA.name}</h3>
            <p className="mt-2 text-slate-600">
              Choose {toolA.name} if you need {(toolA.pros || toolA.features || [])[0]?.toLowerCase() ?? "its core features"}, prefer {toolA.pricing === "free" ? "a free tool" : toolA.pricing === "freemium" ? "a free tier to start" : "premium features"}, and value {(toolA.pros || [])[1] ?? "its strengths"}. It suits creators who {((toolA.useCases || [])[0] ?? "work in this space").toLowerCase()}.
            </p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-6">
            <h3 className="font-semibold text-slate-900">When to choose {toolB.name}</h3>
            <p className="mt-2 text-slate-600">
              Choose {toolB.name} if you need {(toolB.pros || toolB.features || [])[0]?.toLowerCase() ?? "its core features"}, prefer {toolB.pricing === "free" ? "a free tool" : toolB.pricing === "freemium" ? "a free tier" : "paid plans"}, and value {(toolB.pros || [])[1] ?? "its strengths"}. It suits creators who {((toolB.useCases || [])[0] ?? "work in this space").toLowerCase()}.
            </p>
          </div>
        </div>
      </section>

      {alternatives.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Alternatives</h2>
          <p className="mt-2 text-slate-600">
            Other tools in {formatCategory(toolA.category)} to consider.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {alternatives.map((t) => (
              <li key={t.slug}>
                <Link
                  href={toolHref(t)}
                  className="block rounded-lg border border-slate-200 p-3 hover:border-sky-300 transition"
                >
                  <span className="font-medium text-slate-900">{t.name}</span>
                  <p className="mt-1 text-sm text-slate-500">{t.description.slice(0, 80)}…</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedComparisons.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Related Comparisons</h2>
          <ul className="mt-4 space-y-2">
            {relatedComparisons.map((p) => {
              const a = getAIToolFromDatabase(p.toolA);
              const b = getAIToolFromDatabase(p.toolB);
              const label = a && b ? `${a.name} vs ${b.name}` : `${p.toolA} vs ${p.toolB}`;
              return (
                <li key={p.slug}>
                  <Link href={`/compare/${p.slug}`} className="text-sm text-sky-600 hover:underline">
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Related Guides</h2>
        <p className="mt-2 text-sm text-slate-600">How-to guides and AI prompts for creators.</p>
        <ul className="mt-4 space-y-2">
          {HOW_TO_TOPICS.slice(0, 4).map((topic) => (
            <li key={topic}>
              <Link href={`/how-to/${topic}`} className="text-sm text-sky-600 hover:underline">
                How to {formatCategory(topic)}
              </Link>
            </li>
          ))}
          {AI_PROMPT_TOPICS.slice(0, 4).map((topic) => (
            <li key={topic}>
              <Link href={`/ai-prompts-for/${topic}`} className="text-sm text-sky-600 hover:underline">
                AI Prompts for {formatCategory(topic)}
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/ai-tools/category/${toolA.category}`} className="text-sm text-sky-600 hover:underline">
              More {formatCategory(toolA.category)} tools
            </Link>
          </li>
        </ul>
      </section>

      {(toolA.isTooleagle || toolB.isTooleagle) && (
        <section className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-600" /> Try ToolEagle for free
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Generate captions, hooks, hashtags and more. No sign-up required.
          </p>
          <Link
            href="/tools/tiktok-caption-generator"
            className="mt-4 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Try Caption Generator →
          </Link>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/compare" className="text-sm font-medium text-sky-600 hover:underline">
          All comparisons
        </Link>
        <Link href={toolHref(toolA)} className="text-sm font-medium text-sky-600 hover:underline">
          {toolA.name}
        </Link>
        <Link href={toolHref(toolB)} className="text-sm font-medium text-sky-600 hover:underline">
          {toolB.name}
        </Link>
        <Link href={`/ai-tools/category/${toolA.category}`} className="text-sm font-medium text-sky-600 hover:underline">
          {formatCategory(toolA.category)} tools
        </Link>
      </div>
    </article>
  );
}
