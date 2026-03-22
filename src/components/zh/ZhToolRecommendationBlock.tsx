"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { AffiliateTool } from "@/config/affiliate-tools";
import { useCountry } from "@/hooks/useCountry";
import { getToolCtaLabel, getCtaBenefit } from "@/config/zh-cta-variants";
import { getGoUrl } from "@/config/affiliate-tools";

type Props = {
  tools: AffiliateTool[];
  keyword?: string;
  /** V70: Page slug for revenue attribution */
  pageSlug?: string;
  /** V65: CTA variant index for rotation */
  ctaIndex?: number;
  /** V68: High intent page - stronger styling */
  isHighIntent?: boolean;
  /** V68: Whether affiliate env is configured */
  hasAffiliate?: boolean;
};

function trackToolView(toolId: string, keyword?: string, pageSlug?: string, country?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_view",
      event_data: { tool_id: toolId, keyword: keyword || null, page_slug: pageSlug || null, country: country || null }
    })
  }).catch(() => {});
}

export function ZhToolRecommendationBlock({ tools, keyword, pageSlug, ctaIndex = 0, isHighIntent, hasAffiliate }: Props) {
  const country = useCountry();
  useEffect(() => {
    tools?.forEach((t) => trackToolView(t.id, keyword, pageSlug, country));
  }, [tools, keyword, pageSlug, country]);

  if (!tools || tools.length === 0) return null;

  const handleClick = (tool: AffiliateTool, ctaLabel: string) => {
    fetch("/api/zh/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "tool_click",
        event_data: { tool_id: tool.id, keyword: keyword || null, page_slug: pageSlug || null, cta_variant: ctaLabel, country: country || null }
      })
    }).catch(() => {});
  };

  const displayTools = tools.slice(0, 3);

  return (
    <section
      className={`mt-10 rounded-2xl border-2 p-6 ${
        isHighIntent ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200" : "border-amber-200 bg-amber-50/80"
      }`}
      aria-label="推荐工具"
    >
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        🔥 推荐工具（提高效率）
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {keyword ? `实现「${keyword}」更高效，试试这些工具：` : "以下工具可大幅提升创作效率："}
      </p>
      <p className="mt-1 text-xs text-amber-700 font-medium">
        Recommended by ToolEagle · Used by creators · Popular for TikTok growth
        {displayTools[0] && (displayTools[0].isBestChoice || displayTools[0].stackRole === "primary") && " · Most creators use this tool"}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayTools.map((tool, i) => {
          const ctaLabel = getToolCtaLabel(ctaIndex + i);
          const benefit = getCtaBenefit(i);
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
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  {isBest && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                      🔥 官方推荐
                    </span>
                  )}
                  {tool.tag && !isBest && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                      {tool.tag}
                    </span>
                  )}
                </div>
              </div>
              {isBest && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-amber-700 font-medium">
                  <span>推荐指数最高</span>
                  <span>·</span>
                  <span>最多人使用</span>
                  <span>·</span>
                  <span>最适合新手</span>
                </div>
              )}
              <div className={`flex items-center gap-3 text-xs text-slate-600 ${isBest ? "mt-1" : "mt-2"}`}>
                {tool.rating != null && (
                  <span>⭐ {tool.rating}/5</span>
                )}
                {tool.usersCount && (
                  <span>👥 {tool.usersCount} 用户</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{tool.description}</p>
              <Link
                href={getGoUrl(tool)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick(tool, ctaLabel)}
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
