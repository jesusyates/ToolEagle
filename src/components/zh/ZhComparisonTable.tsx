"use client";

import type { AffiliateTool } from "@/config/affiliate-tools";

type Props = {
  tools: AffiliateTool[];
  keyword?: string;
  onToolClick?: (tool: AffiliateTool) => void;
};

export function ZhComparisonTable({ tools, keyword, onToolClick }: Props) {
  if (!tools || tools.length === 0) return null;

  const handleClick = (tool: AffiliateTool) => {
    onToolClick?.(tool);
    fetch("/api/zh/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "tool_click",
        event_data: { tool_id: tool.id, source: "comparison_table", keyword: keyword || null }
      })
    }).catch(() => {});
    if (tool.url) window.open(tool.url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm"
      aria-label="工具对比"
    >
      <h2 className="text-xl font-semibold text-slate-900">工具对比表</h2>
      <p className="mt-2 text-sm text-slate-600">
        {keyword ? `实现「${keyword}」选对工具事半功倍` : "选择适合你的工具，快速提升创作效率"}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 text-left font-semibold text-slate-900">工具</th>
              <th className="py-3 px-4 text-left font-semibold text-slate-900">是否免费</th>
              <th className="py-3 px-4 text-left font-semibold text-slate-900">适合人群</th>
              <th className="py-3 px-4 text-left font-semibold text-slate-900">推荐指数</th>
              <th className="py-3 px-4 text-left font-semibold text-slate-900">操作</th>
            </tr>
          </thead>
          <tbody>
            {tools.slice(0, 3).map((tool) => (
              <tr
                key={tool.id}
                className={`border-b border-slate-100 ${
                  tool.isBestChoice ? "bg-amber-50" : ""
                }`}
              >
                <td className="py-3 px-4">
                  <span className="font-medium text-slate-900">{tool.name}</span>
                  {tool.isBestChoice && (
                    <span className="ml-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                      最佳选择
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {tool.isFree !== false ? "✓ 免费" : "付费"}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {tool.suitableFor || "创作者"}
                </td>
                <td className="py-3 px-4">
                  {tool.rating != null ? (
                    <span className="font-medium text-amber-600">⭐ {tool.rating}/5</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleClick(tool)}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    立即试用
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
