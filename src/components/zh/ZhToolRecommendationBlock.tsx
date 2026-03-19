"use client";

import { useEffect } from "react";
import type { AffiliateTool } from "@/config/affiliate-tools";
import { getCtaVariant } from "@/config/zh-cta-variants";

type Props = {
  tools: AffiliateTool[];
  keyword?: string;
  /** V70: Page slug for revenue attribution */
  pageSlug?: string;
  /** V65: CTA variant index for rotation */
  ctaIndex?: number;
  /** V68: High intent page - stronger styling */
  isHighIntent?: boolean;
  /** V68: Whether affiliate tools are configured (for debug warning) */
  hasAffiliate?: boolean;
};

function trackToolView(toolId: string, keyword?: string, pageSlug?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_view",
      event_data: { tool_id: toolId, keyword: keyword || null, page_slug: pageSlug || null }
    })
  }).catch(() => {});
}

export function ZhToolRecommendationBlock({ tools, keyword, pageSlug, ctaIndex = 0, isHighIntent, hasAffiliate }: Props) {
  useEffect(() => {
    tools?.forEach((t) => trackToolView(t.id, keyword, pageSlug));
  }, [tools, keyword, pageSlug]);

  if (!tools || tools.length === 0) {
    if (hasAffiliate) return null;
    return (
      <section className="mt-10 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-6" aria-label="联盟工具">
        <p className="text-amber-800 font-medium">⚠️ 未配置联盟链接，当前无法产生收入</p>
        <p className="mt-1 text-sm text-slate-600">请在 Vercel 环境变量中配置 AFFILIATE_TOOL_1～5</p>
      </section>
    );
  }

  const handleClick = (tool: AffiliateTool) => {
    fetch("/api/zh/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "tool_click",
        event_data: { tool_id: tool.id, keyword: keyword || null, page_slug: pageSlug || null }
      })
    }).catch(() => {});
    if (tool.url) window.open(tool.url, "_blank", "noopener,noreferrer");
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
      <p className="mt-1 text-xs text-amber-700 font-medium">限时免费 · 正在被 10,000+ 创作者使用</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayTools.map((tool, i) => {
          const ctaText = getCtaVariant(ctaIndex + i);
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
              <button
                type="button"
                onClick={() => handleClick(tool)}
                className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition"
              >
                👉 {ctaText}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
