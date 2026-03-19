"use client";

import { useEffect } from "react";
import type { AffiliateTool } from "@/config/affiliate-tools";
import { getCtaVariant } from "@/config/zh-cta-variants";

const STACK_LABELS: Record<string, string> = {
  primary: "主推荐（高CTR）",
  alternative: "替代方案",
  "high-ticket": "高价工具（高佣金）"
};

const PRICE_LABELS: Record<string, string> = {
  free: "免费",
  premium: "进阶版",
  "high-ticket": "$20–100/月"
};

type Props = {
  tools: AffiliateTool[];
  keyword?: string;
  pageSlug?: string;
  ctaIndex?: number;
  hasAffiliate?: boolean;
};

function trackToolView(toolId: string, keyword?: string, pageSlug?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_view",
      event_data: { tool_id: toolId, keyword: keyword || null, page_slug: pageSlug || null, source: "multi_tool_stack" }
    })
  }).catch(() => {});
}

function trackToolClick(tool: AffiliateTool, keyword?: string, pageSlug?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_click",
      event_data: { tool_id: tool.id, keyword: keyword || null, page_slug: pageSlug || null, source: "multi_tool_stack" }
    })
  }).catch(() => {});
}

export function ZhMultiToolStack({ tools, keyword, pageSlug, ctaIndex = 0, hasAffiliate }: Props) {
  useEffect(() => {
    tools?.forEach((t) => trackToolView(t.id, keyword, pageSlug));
  }, [tools, keyword, pageSlug]);

  if (!tools || tools.length === 0) {
    if (hasAffiliate) return null;
    return (
      <section className="mt-10 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-6" aria-label="工具组合">
        <p className="text-amber-800 font-medium">⚠️ 未配置联盟链接</p>
      </section>
    );
  }

  const displayTools = tools.slice(0, 3);
  const handleClick = (tool: AffiliateTool) => {
    trackToolClick(tool, keyword, pageSlug);
    if (tool.url) window.open(tool.url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-6 ring-2 ring-amber-200"
      aria-label="完整工具组合"
    >
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        🔥 完整工具组合（从免费到高级）
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {keyword ? `实现「${keyword}」的完整工作流：` : "从免费到高级，一站式提升效率"}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {displayTools.map((tool, i) => {
          const role = tool.stackRole || (i === 0 ? "primary" : i === 1 ? "alternative" : "high-ticket");
          const roleLabel = STACK_LABELS[role] || "推荐工具";
          const priceLabel = PRICE_LABELS[tool.priceTier || "free"] || "免费";
          const ctaText = getCtaVariant(ctaIndex + i);

          return (
            <div
              key={tool.id}
              className={`rounded-xl border-2 bg-white p-4 shadow-sm hover:shadow-md transition ${
                role === "high-ticket" ? "border-amber-500 ring-2 ring-amber-200" : "border-amber-200"
              }`}
            >
              <span className="inline-block rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                {roleLabel}
              </span>
              <span className="ml-2 text-xs text-slate-500">{priceLabel}</span>
              <h3 className="mt-2 font-semibold text-slate-900">{tool.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{tool.description}</p>
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
