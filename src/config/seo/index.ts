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

import { platforms } from "./platforms";
import { contentTypes } from "./content-types";
import { topics } from "./topics";

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
