declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type ToolEvent = "tool_page_view" | "tool_generate" | "tool_copy";

export type ToolAnalyticsPayload = {
  tool_slug: string;
  tool_category?: string;
  [key: string]: any;
};

export function trackEvent(action: ToolEvent, params: ToolAnalyticsPayload) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", action, params ?? {});
}

