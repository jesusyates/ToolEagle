/**
 * v50 - AI Tool Page Template
 * 800-1500 words, full SEO structure
 */

import Link from "next/link";
import type { AIToolEntry } from "@/config/ai-tools-database";
import { getAIToolCategory } from "@/config/ai-tool-categories";
import { getToolOverview, getToolAlternatives, getToolRelatedTools } from "@/lib/ai-tool-seo-content";
import { ExternalLink, Check, X, Sparkles } from "lucide-react";

type Props = { tool: AIToolEntry };

function formatCategory(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AIToolPage({ tool }: Props) {
  const href = tool.isTooleagle && tool.toolSlug ? `/tools/${tool.toolSlug}` : tool.website && tool.website !== "#" ? tool.website : "#";
  const overview = getToolOverview(tool);
  const alternatives = getToolAlternatives(tool);
  const relatedTools = getToolRelatedTools(tool);
  const cat = getAIToolCategory(tool.category);

  const guideTopics = ["grow-on-tiktok", "get-youtube-subscribers", "create-viral-hooks"];
  const strategyTopics = ["startup", "fitness", "creator"];

  return (
    <article className="container max-w-3xl py-12">
      <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
        ← AI Tools Directory
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          {tool.name}
        </h1>
        {tool.isTooleagle && (
          <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
            ToolEagle
          </span>
        )}
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 sr-only">Intro</h2>
        <p className="text-slate-600 leading-relaxed">{overview}</p>
      </section>

      {(tool.pricing || href !== "#") && (
        <div className="mt-6 flex flex-wrap gap-4">
          {tool.pricing && (
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              {tool.pricing === "free" && "Free"}
              {tool.pricing === "freemium" && "Free + Paid"}
              {tool.pricing === "paid" && "Paid"}
            </span>
          )}
          {href.startsWith("http") && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline"
            >
              Visit website <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {tool.isTooleagle && tool.toolSlug && (
            <Link
              href={`/tools/${tool.toolSlug}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Sparkles className="h-4 w-4" /> Try free
            </Link>
          )}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
        <p className="mt-3 text-slate-600 leading-relaxed">{tool.description}</p>
      </section>

      {tool.features && tool.features.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Features</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {tool.features.map((f, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
              >
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tool.useCases && tool.useCases.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Use Cases</h2>
          <ul className="mt-3 space-y-2">
            {tool.useCases.map((uc, i) => (
              <li key={i} className="text-slate-600 flex items-start gap-2">
                <span className="text-sky-500 mt-0.5">•</span>
                {uc}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Pricing</h2>
        <p className="mt-2 text-slate-600">
          {tool.pricing === "free" && `${tool.name} is free to use. No credit card or sign-up required for basic features.`}
          {tool.pricing === "freemium" && `${tool.name} offers a free tier with limited features. Paid plans unlock advanced capabilities and higher usage limits.`}
          {tool.pricing === "paid" && `${tool.name} is available through a paid subscription. Visit the website for current pricing and plans.`}
        </p>
      </section>

      {(tool.pros?.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" /> Pros
          </h2>
          <ul className="mt-2 space-y-1">
            {tool.pros!.map((p, i) => (
              <li key={i} className="text-slate-600">{p}</li>
            ))}
          </ul>
        </section>
      )}

      {(tool.cons?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <X className="h-5 w-5 text-amber-600" /> Cons
          </h2>
          <ul className="mt-2 space-y-1">
            {tool.cons!.map((c, i) => (
              <li key={i} className="text-slate-600">{c}</li>
            ))}
          </ul>
        </section>
      )}

      {alternatives.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Alternatives</h2>
          <p className="mt-2 text-slate-600">
            Similar tools to consider in the {formatCategory(tool.category)} category.
          </p>
          <ul className="mt-4 space-y-2">
            {alternatives.map((t) => (
              <li key={t.slug}>
                <Link
                  href={t.isTooleagle && t.toolSlug ? `/tools/${t.toolSlug}` : `/ai-tools/${t.slug}`}
                  className="block rounded-lg border border-slate-200 p-3 hover:border-sky-300 transition"
                >
                  <span className="font-medium text-slate-900">{t.name}</span>
                  <p className="mt-1 text-sm text-slate-500">{t.description.slice(0, 100)}…</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedTools.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Related Tools</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedTools.slice(0, 6).map((t) => (
              <li key={t.slug}>
                <Link
                  href={t.isTooleagle && t.toolSlug ? `/tools/${t.toolSlug}` : `/ai-tools/${t.slug}`}
                  className="block rounded-lg border border-slate-200 p-3 hover:border-sky-300 transition"
                >
                  <span className="font-medium text-slate-900">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Try ToolEagle for free</h2>
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Related Pages</h2>
        <p className="mt-2 text-sm text-slate-600">Guides and strategies for creators.</p>
        <ul className="mt-4 space-y-2">
          {guideTopics.map((topic) => (
            <li key={topic}>
              <Link href={`/how-to/${topic}`} className="text-sm text-sky-600 hover:underline">
                How to {formatCategory(topic)}
              </Link>
            </li>
          ))}
          {strategyTopics.map((topic) => (
            <li key={topic}>
              <Link href={`/ai-prompts-for/${topic}`} className="text-sm text-sky-600 hover:underline">
                AI Prompts for {formatCategory(topic)}
              </Link>
            </li>
          ))}
          {strategyTopics.slice(0, 2).map((topic) => (
            <li key={`cs-${topic}`}>
              <Link href={`/content-strategy/${topic}`} className="text-sm text-sky-600 hover:underline">
                Content Strategy for {formatCategory(topic)}
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/ai-tools/category/${tool.category}`} className="text-sm text-sky-600 hover:underline">
              More {cat?.name ?? formatCategory(tool.category)} tools
            </Link>
          </li>
          <li>
            <Link href="/compare" className="text-sm text-sky-600 hover:underline">
              Compare AI tools
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
          All AI tools
        </Link>
        <Link href={`/ai-tools/category/${tool.category}`} className="text-sm font-medium text-sky-600 hover:underline">
          More {formatCategory(tool.category)} tools
        </Link>
        <Link href="/compare" className="text-sm font-medium text-sky-600 hover:underline">
          Compare tools
        </Link>
      </div>
    </article>
  );
}
