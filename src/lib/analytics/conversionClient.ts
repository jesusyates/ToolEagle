"use client";

/**
 * V96: Fire-and-forget conversion events → /api/analytics/conversion
 */

import { getOrCreateSessionId } from "./getSessionId";

export type ConversionEventType = "upgrade_click" | "pricing_open" | "payment_click";

export type ConversionEventMetadata = Record<string, string | number | boolean | null | undefined>;

export type FunnelEventType =
  | "upgrade_click"
  | "pricing_open"
  | "payment_click"
  | "douyin_tool_view"
  | "douyin_generate"
  | "douyin_locked_content_view"
  | "douyin_upgrade_click"
  | "douyin_payment_success"
  | "cn_tool_view"
  | "cn_generate"
  | "cn_locked_content_view"
  | "cn_upgrade_click"
  | "cn_payment_success"
  /** V105.2 — share link copied (China tools) */
  | "tool_share_link_copy";

export function trackConversion(event: FunnelEventType, metadata?: ConversionEventMetadata) {
  if (typeof window === "undefined") return;

  // Best-effort session linkage for funnel analytics.
  const session_id = getOrCreateSessionId();

  fetch("/api/analytics/conversion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      metadata: { ...(metadata ?? {}), ...(session_id ? { session_id } : {}) },
      href: window.location.href
    })
  }).catch(() => {});
}
