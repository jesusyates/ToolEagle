/**
 * Client-side parsing of normalized usage payload (daily remaining / CN credits).
 * Source: `fetchUsageQuotaToolUi` → shared-core primary, or transitional Next route when no Bearer.
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
