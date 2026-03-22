"use client";

/**
 * V84: Tool Comparison Monetization Block
 * V85: Display priority top/best free/best monetization + one-line benefit + stronger labels
 */

import { useEffect } from "react";
import Link from "next/link";
import type { AffiliateTool } from "@/config/affiliate-tools";
import { getGoUrl } from "@/config/affiliate-tools";

type Props = {
  tools: AffiliateTool[];
  keyword?: string;
  pageSlug?: string;
};

const SLOTS: { key: string; label: string; ctaLabel: string; benefit: string; pickTool: (tools: AffiliateTool[]) => AffiliateTool }[] = [
  { key: "top", label: "Most creators choose this", ctaLabel: "Start free", benefit: "免费试用 · 无需注册", pickTool: (t) => t[0] },
  { key: "free", label: "Best free tool", ctaLabel: "Best for beginners", benefit: "新手友好 · 上手即用", pickTool: (t) => t.find((x) => x.isFree !== false) ?? t[0] },
  { key: "monetization", label: "Best for monetization", ctaLabel: "Fastest way", benefit: "效率提升 · 省时省力", pickTool: (t) => t.find((x) => x.intents?.includes("变现") || x.priceTier === "high-ticket") ?? t[0] }
];

function trackToolView(toolId: string, keyword?: string, pageSlug?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_view",
      event_data: { tool_id: toolId, keyword: keyword || null, page_slug: pageSlug || null, source: "comparison_block" }
    })
  }).catch(() => {});
}

function trackToolClick(tool: AffiliateTool, keyword?: string, pageSlug?: string, ctaVariant?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_click",
      event_data: { tool_id: tool.id, keyword: keyword || null, page_slug: pageSlug || null, source: "comparison_block", cta_variant: ctaVariant || null }
    })
  }).catch(() => {});
}

export function ZhToolComparisonMonetizationBlock({ tools, keyword, pageSlug }: Props) {
  const assigned = SLOTS.map((slot) => ({ ...slot, tool: slot.pickTool(tools) }));

  useEffect(() => {
    assigned.forEach(({ tool }) => trackToolView(tool.id, keyword, pageSlug));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- assigned derived from tools
  }, [keyword, pageSlug, tools?.map((t) => t.id).join(",")]);

  if (!tools || tools.length === 0) return null;

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6"
      aria-label="工具对比推荐"
    >
      <h2 className="text-xl font-semibold text-slate-900">选择适合你的工具</h2>
      <p className="mt-2 text-sm text-slate-600">
        {keyword ? `实现「${keyword}」推荐以下工具` : "根据需求选择，一键试用"}
      </p>
      <p className="mt-1 text-xs text-sky-700 font-medium">
        Recommended by ToolEagle · Popular for TikTok growth
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {assigned.map(({ key, label, tool, ctaLabel, benefit }) => (
          <div
            key={key}
            className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
              {label}
            </span>
            <h3 className="mt-2 font-semibold text-slate-900">{tool.name}</h3>
            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{tool.description}</p>
            <Link
              href={getGoUrl(tool)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackToolClick(tool, keyword, pageSlug, ctaLabel)}
              className="mt-3 block w-full rounded-lg bg-sky-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-sky-700 transition"
            >
              {ctaLabel}
            </Link>
            <p className="mt-1.5 text-xs text-slate-500 text-center">{benefit}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
