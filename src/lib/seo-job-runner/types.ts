import type { SeoDraftGenerationJobResult } from "@/lib/seo-draft-generation/types";
import type { SeoPreflightJobResult } from "@/lib/seo-preflight";

export type SeoAutomationJobStepLog = {
  name: string;
  ok: boolean;
  detail?: string;
};

export type SeoAutomationJobResult = {
  startedAt: string;
  finishedAt?: string;
  ok: boolean;
  steps: SeoAutomationJobStepLog[];
  scenarioTopicCount?: number;
  preflight?: SeoPreflightJobResult;
  drafts?: SeoDraftGenerationJobResult;
  error?: string;
};
