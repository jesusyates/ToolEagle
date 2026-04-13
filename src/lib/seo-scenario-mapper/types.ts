import type { SeoPreflightContentType } from "@/lib/seo-preflight";

export type ScenarioMappedTopic = {
  topic: string;
  contentType: SeoPreflightContentType;
  intent: string;
  market: string;
  locale: string;
  contentLanguage: string;
  seedId: string;
  feature: string;
  platform: string;
  angle: string;
};

export type SeoScenarioTopicsFile = {
  version: number;
  updatedAt: string;
  topicCount: number;
  topics: ScenarioMappedTopic[];
};
