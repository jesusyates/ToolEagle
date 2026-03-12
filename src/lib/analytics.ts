declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type ToolEvent = "caption_generate_click" | "copy_caption" | "tool_page_view";

export function trackEvent(action: ToolEvent, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", action, params ?? {});
}

