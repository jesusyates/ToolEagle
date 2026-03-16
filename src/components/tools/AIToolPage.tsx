import Link from "next/link";
import type { AIToolEntry } from "@/config/ai-tools-marketplace";
import { ExternalLink, Check, X, Sparkles } from "lucide-react";

type Props = {
  tool: AIToolEntry;
};

export function AIToolPage({ tool }: Props) {
  const href = tool.isTooleagle && tool.toolSlug ? `/tools/${tool.toolSlug}` : tool.website ?? "#";

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

      <p className="mt-4 text-slate-600 leading-relaxed">{tool.description}</p>

      {(tool.pricing || tool.website) && (
        <div className="mt-6 flex flex-wrap gap-4">
          {tool.pricing && (
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              {tool.pricing === "free" && "Free"}
              {tool.pricing === "freemium" && "Free + Paid"}
              {tool.pricing === "paid" && "Paid"}
              {tool.pricing === "enterprise" && "Enterprise"}
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

      {tool.features && tool.features.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Features</h2>
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

      {(tool.pros?.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" /> Pros
          </h2>
          <ul className="mt-2 space-y-1">
            {tool.pros!.map((p, i) => (
              <li key={i} className="text-slate-600">
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(tool.cons?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <X className="h-5 w-5 text-amber-600" /> Cons
          </h2>
          <ul className="mt-2 space-y-1">
            {tool.cons!.map((c, i) => (
              <li key={i} className="text-slate-600">
                {c}
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

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
          All AI tools
        </Link>
        <Link href={`/ai-tools/category/${tool.category}`} className="text-sm font-medium text-sky-600 hover:underline">
          More {tool.category} tools
        </Link>
        <Link href="/compare" className="text-sm font-medium text-sky-600 hover:underline">
          Compare tools
        </Link>
      </div>
    </article>
  );
}
