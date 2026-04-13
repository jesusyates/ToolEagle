import type { SeoPreflightCandidateResult } from "@/lib/seo-preflight";

export type SeoDraftRowResult = {
  topic: string;
  title: string;
  slug: string;
  description: string;
  outline: string[];
  fullContent: string;
  qualityPass: boolean;
  qualityRejectReason: string | null;
  savedAsDraft: boolean;
  saveError: string | null;
};

export type SeoDraftGenerationJobResult = {
  ranAt: string;
  source: "request_body" | "preflight_file" | "automation_pipeline";
  inputCount: number;
  rows: SeoDraftRowResult[];
};

export type SeoDraftGenerationInput = {
  approved: SeoPreflightCandidateResult[];
};
