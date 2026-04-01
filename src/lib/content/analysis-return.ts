import { analyzeCreatorProfile } from "@/lib/content/analysis";
import { getTopPerformingPatterns } from "@/lib/content/optimization";
import type { CaptionLengthType } from "@/lib/content/optimization";

export type AnalysisReturn = {
  stage: "new" | "growing" | "monetizing";
  返回: {
    核心问题: string[];
    下一步建议: string[];
    生成策略: {
      hashtagCount: number;
      captionLengthType: CaptionLengthType;
      topHooks: string[];
    };
  };
};

const DEFAULT_RETURN: AnalysisReturn = {
  stage: "new",
  返回: {
    核心问题: [],
    下一步建议: [],
    生成策略: {
      hashtagCount: 5,
      captionLengthType: "medium",
      topHooks: []
    }
  }
};

export async function buildAnalysisReturn(userId: string, toolSlug: string): Promise<AnalysisReturn> {
  try {
    const profile = await analyzeCreatorProfile(userId);
    const { patterns } = await getTopPerformingPatterns(userId, toolSlug);

    const problems = profile.problems.slice(0, 3);
    const suggestions = profile.suggestions.slice(0, 3);

    const hashtagCount = patterns.hashtagCountRange || 5;
    const captionLengthType = patterns.captionLengthType ?? "medium";
    const topHooks = (patterns.topHooks ?? []).slice(0, 3);

    return {
      stage: profile.stage,
      返回: {
        核心问题: problems,
        下一步建议: suggestions,
        生成策略: {
          hashtagCount,
          captionLengthType,
          topHooks
        }
      }
    };
  } catch {
    return DEFAULT_RETURN;
  }
}

