/**
 * SEO Engine v2 - Config index
 */
export { platforms, PLATFORM_LABELS, type Platform } from "./platforms";
export {
  contentTypes,
  CONTENT_TYPE_LABELS,
  TOOL_MAP,
  type ContentType
} from "./content-types";
export { topics, formatTopicLabel, type Topic } from "./topics";
export { getBaseTopic, getIntent, intents, INTENT_LABELS } from "./intents";

import { platforms } from "./platforms";
import { contentTypes } from "./content-types";
import { topics } from "./topics";
import { getIntent } from "./intents";
import { limitBuildStaticParams } from "@/lib/build-static-params-limit";

export function getAllSeoParams(): { platform: string; type: string; topic: string }[] {
  const params: { platform: string; type: string; topic: string }[] = [];
  for (const platform of platforms) {
    for (const type of contentTypes) {
      for (const topic of topics) {
        params.push({ platform, type, topic });
      }
    }
  }
  return params;
}

/** Params for indexable pages only (guide intent + base topics). Excludes ideas, examples, templates, questions. */
export function getIndexableSeoParams(): { platform: string; type: string; topic: string }[] {
  return getAllSeoParams().filter(({ topic }) => {
    const intent = getIntent(topic);
    return !intent || intent === "guide";
  });
}

/** Vercel: capped static params; sitemap/runtime still use full `getIndexableSeoParams`. */
export function getIndexableSeoStaticParamRoutes(): {
  category: string;
  type: string;
  topic: string;
}[] {
  return limitBuildStaticParams(
    getIndexableSeoParams().map(({ platform, type, topic }) => ({
      category: platform,
      type,
      topic
    }))
  );
}
