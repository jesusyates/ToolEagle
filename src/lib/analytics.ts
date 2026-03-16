declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

type ToolEvent =
  | "tool_page_view"
  | "tool_generate"
  | "tool_generate_ai"
  | "tool_copy"
  | "conversion"
  | "prompt_improved"
  | "prompt_copied"
  | "prompt_playground_used"
  | "example_view"
  | "example_like"
  | "example_save"
  | "topic_view";

export type ToolAnalyticsPayload = {
  tool_slug?: string;
  tool_category?: string;
  example_slug?: string;
  topic_slug?: string;
  [key: string]: string | number | undefined;
};

export function trackEvent(action: ToolEvent, params?: ToolAnalyticsPayload) {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", action, params ?? {});
  }

  if (window.plausible) {
    const props: Record<string, string | number> = {};
    const p = params ?? {};
    if (p.tool_slug) props.tool_slug = String(p.tool_slug);
    if (p.tool_category) props.tool_category = String(p.tool_category);
    if (p.example_slug) props.example_slug = String(p.example_slug);
    if (p.topic_slug) props.topic_slug = String(p.topic_slug);
    if (p.input_length !== undefined) props.input_length = Number(p.input_length);
    if (p.conversion_label) props.conversion_label = String(p.conversion_label);
    if (p.conversion_value !== undefined) props.conversion_value = Number(p.conversion_value);
    window.plausible(action, { props: Object.keys(props).length ? props : undefined });
  }
}

/** Track conversion (signup, upgrade, etc.) */
export function trackConversion(label: string, value?: number) {
  trackEvent("conversion", { conversion_label: label, ...(value !== undefined && { conversion_value: value }) });
}

