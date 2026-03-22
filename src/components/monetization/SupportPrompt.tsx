"use client";

import { trackEvent } from "@/lib/analytics";
import { getSupportClientAnalyticsId } from "@/lib/supporter/client-analytics-id";
import type { SupportPromptMilestone } from "@/lib/supporter/support-prompt-rules";

type SupportPromptProps = {
  milestone: SupportPromptMilestone;
  onOpenSupport: () => void;
  onMarkMilestoneSeen: () => void;
  route: string;
  sourcePage: string;
};

/**
 * V100.2 — Lightweight value-triggered support card (no QR). Opens SupportModal via parent.
 */
export function SupportPrompt({
  milestone,
  onOpenSupport,
  onMarkMilestoneSeen,
  route,
  sourcePage
}: SupportPromptProps) {
  function handleOpen() {
    trackEvent("support_prompt_click", {
      route,
      market: "cn",
      locale: "zh",
      source_page: sourcePage,
      supporter_id: getSupportClientAnalyticsId(),
      milestone
    });
    onMarkMilestoneSeen();
    onOpenSupport();
  }

  function handleDismiss() {
    onMarkMilestoneSeen();
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3 mt-4">
      <p className="text-xs text-slate-600 leading-relaxed">
        这个工具对你有帮助的话，可以支持 ToolEagle ❤️
        <br />
        <span className="text-slate-500">你的支持会帮助我们持续优化并保持免费</span>
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={handleOpen}
          className="text-xs font-medium text-slate-500 hover:text-red-900 underline-offset-2 hover:underline"
        >
          了解如何支持 →
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-[11px] text-slate-400 hover:text-slate-600"
        >
          稍后再说
        </button>
      </div>
    </div>
  );
}
