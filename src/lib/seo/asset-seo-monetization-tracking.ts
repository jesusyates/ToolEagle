import { trackEvent } from "@/lib/analytics";

export function trackUpgradeShown(context: { tool_slug: string; topic?: string; workflow?: string; trigger_type?: string; variant_id?: string }) {
  trackEvent("upgrade_shown", {
    tool_slug: context.tool_slug,
    topic_slug: context.topic ?? "",
    prompt_id: context.workflow ?? "",
    page_type: context.trigger_type ?? "soft",
    variant_id: context.variant_id ?? ""
  } as any);
}

export function trackUpgradeClicked(context: { tool_slug: string; topic?: string; workflow?: string; trigger_type?: string; variant_id?: string }) {
  trackEvent("upgrade_clicked", {
    tool_slug: context.tool_slug,
    topic_slug: context.topic ?? "",
    prompt_id: context.workflow ?? "",
    page_type: context.trigger_type ?? "soft",
    variant_id: context.variant_id ?? ""
  } as any);
}

export function trackUpgradeConverted(context: { tool_slug: string; topic?: string; workflow?: string; variant_id?: string }) {
  trackEvent("upgrade_converted", {
    tool_slug: context.tool_slug,
    topic_slug: context.topic ?? "",
    prompt_id: context.workflow ?? "",
    variant_id: context.variant_id ?? ""
  } as any);
}

