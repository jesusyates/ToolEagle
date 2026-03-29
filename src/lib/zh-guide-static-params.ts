/**
 * V164 — Zh guide `generateStaticParams`: single cache read + bounded scan on capped builds.
 * Avoids N× fs.readFileSync via getZhContent() in tight loops.
 */

import type { GuidePageType } from "@/config/traffic-topics";
import { ZH_PLATFORMS } from "@/config/traffic-topics";
import {
  getBuildStaticPageCap,
  limitBuildStaticParams,
  shouldLimitStaticParamBuild
} from "@/lib/build-static-params-limit";
import {
  getAllZhGuideParams,
  getZhContentFromCache,
  loadZhContentCache
} from "@/lib/generate-zh-content";

function hubTopicsForPageType(pageType: GuidePageType): { topic: string }[] {
  return ZH_PLATFORMS.map((platform) => ({ topic: platform }));
}

function mergeDedupeTopics(a: { topic: string }[], b: { topic: string }[]): { topic: string }[] {
  const seen = new Set<string>();
  const out: { topic: string }[] = [];
  for (const x of [...a, ...b]) {
    if (seen.has(x.topic)) continue;
    seen.add(x.topic);
    out.push(x);
  }
  return out;
}

/**
 * Params for /zh/{how-to|content-strategy|viral-examples|ai-prompts-for}/[topic].
 * On Vercel: scan at most a bounded prefix of the candidate list, then apply global path cap.
 */
export function getZhGuideStaticParamsForBuild(pageType: GuidePageType): { topic: string }[] {
  const cache = loadZhContentCache();
  const childParams = getAllZhGuideParams().filter((p) => p.pageType === pageType);
  const hubs = hubTopicsForPageType(pageType);

  if (shouldLimitStaticParamBuild()) {
    const cap = getBuildStaticPageCap();
    const hubCount = hubs.length;
    const maxChild = Math.max(0, cap - hubCount);
    const scanBudget = Math.min(
      childParams.length,
      Math.max(maxChild * 10, cap * 3, 120)
    );
    const withContent: { topic: string }[] = [];
    for (let i = 0; i < scanBudget && withContent.length < maxChild; i++) {
      const p = childParams[i];
      if (getZhContentFromCache(cache, pageType, p.topic)) {
        withContent.push({ topic: p.topic });
      }
    }
    return limitBuildStaticParams(mergeDedupeTopics(withContent, hubs));
  }

  const withContent = childParams
    .filter((p) => getZhContentFromCache(cache, pageType, p.topic))
    .map((p) => ({ topic: p.topic }));
  return limitBuildStaticParams(mergeDedupeTopics(withContent, hubs));
}
