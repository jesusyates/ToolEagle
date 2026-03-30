/**
 * Client-side parsing of GET /api/usage-status JSON for tool UIs
 * (daily remaining / CN credits). Keeps PostPackage + GenericTool in sync.
 */
export type UsageStatusUiSlice = {
  cnBilling: "credits" | "legacy_pro" | "free" | null;
  cnCreditsRemaining: number | null;
  cnCreditsDaysLeft: number | null;
  usageRemaining: number | null;
};

export function parseUsageStatusForToolUi(d: Record<string, unknown>): UsageStatusUiSlice {
  const bm = d.billingModel;
  return {
    cnBilling:
      bm === "credits" ? "credits" : bm === "legacy_pro" ? "legacy_pro" : bm === "free" ? "free" : null,
    cnCreditsRemaining: typeof d.creditsRemaining === "number" ? d.creditsRemaining : null,
    cnCreditsDaysLeft: typeof d.creditsDaysLeft === "number" ? d.creditsDaysLeft : null,
    usageRemaining: typeof d.remaining === "number" ? d.remaining : null
  };
}
