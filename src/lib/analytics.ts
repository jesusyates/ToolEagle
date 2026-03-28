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
  /** AI path failed (non-limit); template/local fallback used */
  | "tool_generate_ai_fallback"
  | "tool_copy"
  | "conversion"
  | "prompt_improved"
  | "prompt_copied"
  | "prompt_playground_used"
  | "example_view"
  | "example_like"
  | "example_save"
  | "topic_view"
  /** V100.2 — CN support funnel */
  | "support_prompt_view"
  | "support_prompt_click"
  | "support_drawer_open"
  | "support_page_view"
  | "donation_record_create"
  /** V100.3 feedback */
  | "feedback_modal_open"
  | "feedback_submit_success"
  /** V100.4 support contact */
  | "support_contact_view"
  | "support_contact_click"
  | "support_channel_click"
  /** V101 CN aggregator checkout */
  | "payment_order_created"
  | "payment_qr_shown"
  | "payment_success"
  | "payment_failed"
  /** V101.1 donation checkout */
  | "donation_order_created"
  | "donation_payment_success"
  /** V104.2 — Douyin conversion funnel (CN stack, isolated from generic zh) */
  | "douyin_tool_view"
  | "douyin_generate"
  | "douyin_locked_content_view"
  | "douyin_upgrade_click"
  | "douyin_payment_success"
  /** V105.2 — share URL copied (China / zh UI) */
  | "tool_share_link_copy"
  /** V106.2 — external share blocks */
  | "v1062_share_block_copy"
  /** V107 — CN credits */
  | "credit_used"
  | "credit_balance"
  | "pricing_view"
  | "pricing_click"
  | "purchase_click"
  | "purchase_success"
  | "pricing_package_view"
  | "pricing_package_click"
  | "credit_purchase"
  | "donation_purchase"
  | "billing_page_view"
  | "billing_tab_view"
  /** IA — market switcher + auth entry */
  | "market_switch"
  | "login_click"
  /** V108 — SEO blog → tool funnel */
  | "blog_tool_click"
  | "tool_entry_from_blog"
  | "upgrade_shown"
  | "upgrade_clicked"
  | "upgrade_converted"
  | "monetization_trigger_fired"
  | "conversion_completed"
  | "monetization_variant_assigned"
  | "monetization_variant_winner_selected"
  | "trigger_timing_optimized"
  | "monetization_global_winner_applied"
  | "monetization_topic_strategy_applied"
  | "monetization_workflow_strategy_applied"
  | "monetization_server_timing_applied"
  | "monetization_intelligence_computed";

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
    if (p.route) props.route = String(p.route);
    if (p.market) props.market = String(p.market);
    if (p.locale) props.locale = String(p.locale);
    if (p.source_page) props.source_page = String(p.source_page);
    if (p.supporter_id) props.supporter_id = String(p.supporter_id);
    if (p.channel) props.channel = String(p.channel);
    if (p.milestone !== undefined) props.milestone = Number(p.milestone);
    if (p.support_channel) props.support_channel = String(p.support_channel);
    if (p.provider) props.provider = String(p.provider);
    if (p.plan) props.plan = String(p.plan);
    if (p.amount !== undefined) props.amount = Number(p.amount);
    window.plausible(action, { props: Object.keys(props).length ? props : undefined });
  }
}

/** Track conversion (signup, upgrade, etc.) */
export function trackConversion(label: string, value?: number) {
  trackEvent("conversion", { conversion_label: label, ...(value !== undefined && { conversion_value: value }) });
}

