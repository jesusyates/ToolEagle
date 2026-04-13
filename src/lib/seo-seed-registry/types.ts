export type AppSeoSeedRecord = {
  id: string;
  feature: string;
  platform: string;
  keywords: string[];
  steps: string[];
  angles: string[];
  markets: string[];
  languages: string[];
  notes?: string;
  sellingPoints?: string[];
};

export type AppSeoSeedStore = {
  /** Numeric (e.g. 1) or label (e.g. "v2") — both accepted by validateSeedStore. */
  version: number | string;
  updatedAt: string;
  seeds: AppSeoSeedRecord[];
};
