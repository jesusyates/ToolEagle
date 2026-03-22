"use client";

/**
 * V85: High-intent CTA with variant tracking
 */

import Link from "next/link";
import type { AffiliateTool } from "@/config/affiliate-tools";
import { getGoUrl } from "@/config/affiliate-tools";

type Props = {
  tool: AffiliateTool;
  ctaLabel: string;
};

export function ZhHighIntentCtaButton({ tool, ctaLabel }: Props) {
  const handleClick = () => {
    fetch("/api/zh/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "tool_click",
        event_data: { tool_id: tool.id, cta_variant: ctaLabel, source: "high_intent_banner" }
      })
    }).catch(() => {});
  };

  return (
    <Link
      href={getGoUrl(tool)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-amber-600 transition"
    >
      试用 {tool.name} →
    </Link>
  );
}
