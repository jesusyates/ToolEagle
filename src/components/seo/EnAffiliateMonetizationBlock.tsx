"use client";

/**
 * V88: EN affiliate monetization block for how-to pages.
 * Uses getAffiliateToolsForCountry for country-based tool priority.
 */

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getAffiliateTools,
  getMatchingAffiliateTools,
  getAffiliateToolsForCountry,
  getGoUrl,
  type AffiliateTool
} from "@/config/affiliate-tools";
import { useCountry } from "@/hooks/useCountry";

const EN_CTA_LABELS = ["Start with ToolEagle", "Try ToolEagle", "Generate with ToolEagle"] as const;
const EN_CTA_BENEFITS: Record<number, string> = {
  0: "Free trial · No signup required",
  1: "Beginner friendly · Start in minutes",
  2: "Boost efficiency · Save time"
};

function inferPlatformFromSlug(slug: string): string {
  if (/tiktok/.test(slug)) return "tiktok";
  if (/youtube|shorts/.test(slug)) return "youtube";
  if (/instagram|reel/.test(slug)) return "instagram";
  return "";
}

function trackToolView(toolId: string, keyword?: string, pageSlug?: string, country?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_view",
      event_data: { tool_id: toolId, keyword: keyword || null, page_slug: pageSlug || null, country: country || null, page_type: "en-how-to" }
    })
  }).catch(() => {});
}

function trackToolClick(tool: AffiliateTool, ctaLabel: string, keyword?: string, pageSlug?: string, country?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_click",
      event_data: { tool_id: tool.id, keyword: keyword || null, page_slug: pageSlug || null, cta_variant: ctaLabel, country: country || null, page_type: "en-how-to" }
    })
  }).catch(() => {});
}

type Props = {
  slug: string;
  keyword?: string;
};

export function EnAffiliateMonetizationBlock({ slug, keyword }: Props) {
  const country = useCountry();
  const hasAffiliate = getAffiliateTools().length > 0;

  const displayTools = useMemo(() => {
    const platform = inferPlatformFromSlug(slug);
    const matched = getMatchingAffiliateTools(slug + " " + (keyword ?? ""), platform, 5);
    return getAffiliateToolsForCountry(matched, country).slice(0, 3);
  }, [slug, keyword, country]);

  useEffect(() => {
    displayTools.forEach((t) => trackToolView(t.id, keyword ?? slug, slug, country));
  }, [displayTools, keyword, slug, country]);

  if (!displayTools.length || !hasAffiliate) return null;

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-6"
      aria-label="Recommended tools"
    >
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        🔥 Recommended Tools for Creators
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {keyword ? `To achieve "${keyword}" faster, try ToolEagle&apos;s free AI tools:` : "Boost your content creation with ToolEagle&apos;s free AI tools:"}
      </p>
      <p className="mt-1 text-xs text-amber-700 font-medium">
        Free AI tool by ToolEagle · Used by creators · Popular for TikTok & YouTube growth
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayTools.map((tool, i) => {
          const ctaLabel = EN_CTA_LABELS[i % EN_CTA_LABELS.length];
          const benefit = EN_CTA_BENEFITS[i] ?? "Free to start";
          const isBest = i === 0;

          return (
            <div
              key={tool.id}
              className={`rounded-xl border-2 bg-white p-4 shadow-sm hover:shadow-md transition ${
                isBest ? "border-amber-400 ring-2 ring-amber-200" : "border-amber-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{tool.name}</h3>
                {isBest && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white shrink-0">
                    Start with ToolEagle
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                {tool.rating != null && <span>⭐ {tool.rating}/5</span>}
                {tool.usersCount && <span>👥 {tool.usersCount} users</span>}
              </div>
              <p className="mt-2 text-sm text-slate-600">{tool.description}</p>
              <Link
                href={getGoUrl(tool)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackToolClick(tool, ctaLabel, keyword ?? slug, slug, country)}
                className="mt-3 block w-full rounded-lg bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-amber-600 transition"
              >
                👉 {ctaLabel}
              </Link>
              <p className="mt-1.5 text-xs text-slate-500 text-center">{benefit}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
