export type BillingMarket = "cn" | "global";
export type BillingOrderType = "credits" | "donation";

export type CreditPackageDef = {
  market: BillingMarket;
  package_id: string;
  display_name: string;
  currency: "CNY" | "USD";
  amount: number;
  credits_total: number;
  validity_days: number;
  is_primary: boolean;
  is_trial: boolean;
  sort_order: number;
  is_active: boolean;
};

const CREDIT_PACKAGES: CreditPackageDef[] = [
  { market: "cn", package_id: "cn_trial", display_name: "体验", currency: "CNY", amount: 3, credits_total: 25, validity_days: 7, is_primary: false, is_trial: true, sort_order: 10, is_active: true },
  { market: "cn", package_id: "cn_standard", display_name: "标准", currency: "CNY", amount: 29, credits_total: 300, validity_days: 30, is_primary: false, is_trial: false, sort_order: 20, is_active: true },
  { market: "cn", package_id: "cn_advanced", display_name: "推荐", currency: "CNY", amount: 59, credits_total: 800, validity_days: 60, is_primary: true, is_trial: false, sort_order: 30, is_active: true },
  { market: "cn", package_id: "cn_pro", display_name: "专业", currency: "CNY", amount: 99, credits_total: 2000, validity_days: 90, is_primary: false, is_trial: false, sort_order: 40, is_active: true },
  { market: "global", package_id: "global_starter", display_name: "Starter", currency: "USD", amount: 1, credits_total: 40, validity_days: 7, is_primary: false, is_trial: false, sort_order: 10, is_active: true },
  { market: "global", package_id: "global_basic", display_name: "Basic", currency: "USD", amount: 6, credits_total: 300, validity_days: 30, is_primary: false, is_trial: false, sort_order: 20, is_active: true },
  { market: "global", package_id: "global_standard", display_name: "Most Popular", currency: "USD", amount: 12, credits_total: 800, validity_days: 60, is_primary: true, is_trial: false, sort_order: 30, is_active: true },
  { market: "global", package_id: "global_pro", display_name: "Pro", currency: "USD", amount: 24, credits_total: 2000, validity_days: 90, is_primary: false, is_trial: false, sort_order: 40, is_active: true }
];

export function listCreditPackages(market: BillingMarket): CreditPackageDef[] {
  return CREDIT_PACKAGES.filter((p) => p.market === market && p.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export function getCreditPackage(market: BillingMarket, packageId: string): CreditPackageDef | null {
  return CREDIT_PACKAGES.find((p) => p.market === market && p.package_id === packageId && p.is_active) ?? null;
}

