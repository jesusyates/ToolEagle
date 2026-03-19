declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

type ToolEvent =
  | "guide_view"
  | "prompt_copy"
  | "prompt_view"
  | "idea_view"
  | "tool_click"
  | "cta_click"
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
  prompt_id?: string;
  /** V76.5: Country for future dashboards (US, CN, etc.) */
  country?: string;
  [key: string]: string | number | undefined;
};

/** V71: Server-side usage tracking for tool_generate, tool_copy. V76.5: includes country. */
function trackToolUsageServer(action: "tool_generate" | "tool_copy", params?: ToolAnalyticsPayload) {
  if (typeof window === "undefined") return;
  const slug = params?.tool_slug;
  if (!slug) return;
  fetch("/api/tools/usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: action,
      tool_slug: slug,
      tool_category: params?.tool_category ?? null,
      country: params?.country ?? null
    })
  }).catch(() => {});
}

export function trackEvent(action: ToolEvent, params?: ToolAnalyticsPayload) {
  if (typeof window === "undefined") return;

  if (action === "tool_generate" || action === "tool_generate_ai") {
    trackToolUsageServer("tool_generate", params);
  }
  if (action === "tool_copy") {
    trackToolUsageServer("tool_copy", params);
  }

  if (window.gtag) {
    window.gtag("event", action, params ?? {});
  }

  if (window.plausible) {
    const props: Record<string, string | number> = {};
    const p = params ?? {};
    if (p.tool_slug) props.tool_slug = String(p.tool_slug);
  if (p.page_type) props.page_type = String(p.page_type);
  if (p.tool_category) props.tool_category = String(p.tool_category);
    if (p.example_slug) props.example_slug = String(p.example_slug);
    if (p.topic_slug) props.topic_slug = String(p.topic_slug);
    if (p.prompt_id) props.prompt_id = String(p.prompt_id);
    if (p.input_length !== undefined) props.input_length = Number(p.input_length);
    if (p.conversion_label) props.conversion_label = String(p.conversion_label);
    if (p.conversion_value !== undefined) props.conversion_value = Number(p.conversion_value);
    if (p.country) props.country = String(p.country);
    window.plausible(action, { props: Object.keys(props).length ? props : undefined });
  }
}

/** Track conversion (signup, upgrade, etc.) */
export function trackConversion(label: string, value?: number) {
  trackEvent("conversion", { conversion_label: label, ...(value !== undefined && { conversion_value: value }) });
}

