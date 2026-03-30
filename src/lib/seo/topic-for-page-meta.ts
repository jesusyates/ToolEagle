import {
  getCachedCaptionForExamples,
  getCachedHashtagForExamples,
  getCachedHookForExamples
} from "@/lib/seo/cached-public-examples";

export async function robotsForCaptionsForTopic(topic: string) {
  const rows = await getCachedCaptionForExamples(topic);
  if (rows.length > 0) return undefined;
  return { index: false, follow: true } as const;
}

export async function robotsForHooksForTopic(topic: string) {
  const rows = await getCachedHookForExamples(topic);
  if (rows.length > 0) return undefined;
  return { index: false, follow: true } as const;
}

export async function robotsForHashtagsForTopic(topic: string) {
  const rows = await getCachedHashtagForExamples(topic);
  if (rows.length > 0) return undefined;
  return { index: false, follow: true } as const;
}
