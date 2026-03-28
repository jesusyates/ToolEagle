import { trackEvent } from "@/lib/analytics";

type ConversionTrackingContext = {
  tool_slug: string;
  topic?: string;
  intent?: string;
  workflow?: string;
  source?: string;
};

export function trackToolEntry(context: ConversionTrackingContext): void {
  trackEvent("tool_click", {
    tool_slug: context.tool_slug,
    topic_slug: context.topic ?? "",
    prompt_id: context.workflow ?? "",
    source: context.source ?? "direct",
    page_type: context.intent ?? ""
  } as any);
}

export function trackGenerationStart(context: ConversionTrackingContext): void {
  trackEvent("tool_generate_ai", {
    tool_slug: context.tool_slug,
    topic_slug: context.topic ?? "",
    prompt_id: context.workflow ?? "",
    source: context.source ?? "direct",
    page_type: context.intent ?? ""
  } as any);
}

