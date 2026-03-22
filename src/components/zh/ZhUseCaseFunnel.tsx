"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { AffiliateTool } from "@/config/affiliate-tools";
import { getToolsForUseCaseFunnel, getGoUrl } from "@/config/affiliate-tools";

const STEP_LABELS = ["用工具A生成内容", "用工具B优化标题", "用工具C分析数据"];

type Props = {
  tools: AffiliateTool[];
  keyword?: string;
  pageSlug?: string;
  hasAffiliate?: boolean;
};

function trackToolView(toolId: string, keyword?: string, pageSlug?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_view",
      event_data: { tool_id: toolId, keyword: keyword || null, page_slug: pageSlug || null, source: "use_case_funnel" }
    })
  }).catch(() => {});
}

function trackToolClick(tool: AffiliateTool, keyword?: string, pageSlug?: string, ctaVariant?: string) {
  fetch("/api/zh/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "tool_click",
      event_data: { tool_id: tool.id, keyword: keyword || null, page_slug: pageSlug || null, source: "use_case_funnel", cta_variant: ctaVariant || null }
    })
  }).catch(() => {});
}

export function ZhUseCaseFunnel({ tools, keyword, pageSlug, hasAffiliate }: Props) {
  const funnelTools = getToolsForUseCaseFunnel(tools);

  useEffect(() => {
    funnelTools.forEach((t) => trackToolView(t.id, keyword, pageSlug));
  }, [funnelTools, keyword, pageSlug]);

  if (!funnelTools.length) return null;

  const steps = funnelTools.map((t, i) => ({
    label: t.useCaseStep ? `用${t.name}${t.useCaseStep}` : STEP_LABELS[i] || `步骤 ${i + 1}`,
    tool: t
  }));

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50/80 p-6"
      aria-label="变现流程"
    >
      <h2 className="text-xl font-semibold text-slate-900">📋 变现三步走</h2>
      <p className="mt-2 text-sm text-slate-600">
        {keyword ? `实现「${keyword}」的完整流程，每一步都有对应工具：` : "按步骤操作，每步都有工具支持"}
      </p>
      <p className="mt-1 text-xs text-sky-700 font-medium">
        Recommended by ToolEagle · Used by creators
      </p>
      <ol className="mt-4 space-y-4">
        {steps.map((s, i) => (
          <li key={s.tool.id} className="flex items-start gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900">{s.label}</p>
              <Link
                href={getGoUrl(s.tool)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackToolClick(s.tool, keyword, pageSlug, "Fastest way")}
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                👉 打开 {s.tool.name}
              </Link>
              <p className="mt-1 text-xs text-slate-500">效率提升 · 省时省力</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
