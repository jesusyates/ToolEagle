import { buildAnalysisReturn } from "@/lib/content/analysis-return";
import { generateGuidanceActions } from "@/lib/content/guidance";
import { buildGuidanceMemory } from "@/lib/content/guidance-memory";
import { getTopPerformingPatterns } from "@/lib/content/optimization";

export type CreatorState = {
  stage: "new" | "growing" | "monetizing";
  priority: "low" | "medium" | "high";
  focus: string;
  problems: string[];
  actions: string[];
  strategy: {
    hashtagCount: number;
    captionLengthType: "short" | "medium" | "long";
    topHooks: string[];
  };
  summary: string;
};

export const DEFAULT_CREATOR_STATE: CreatorState = {
  stage: "new",
  priority: "low",
  focus: "先完成一次真实发布，建立基础行为样本。",
  problems: ["历史样本不足，当前状态不稳定。"],
  actions: ["选择 1 条内容立即发布。", "接下来 3 条内容固定同一主题与结构。"],
  strategy: {
    hashtagCount: 5,
    captionLengthType: "medium",
    topHooks: []
  },
  summary: "当前样本不足，先把生成内容真正发布出去，再基于复制/上传反馈迭代策略。"
};

export async function buildCreatorState(userId: string, toolSlug: string): Promise<CreatorState> {
  try {
    const [analysisReturn, guidanceMemory, guidance, patterns] = await Promise.all([
      buildAnalysisReturn(userId, toolSlug),
      buildGuidanceMemory(userId),
      generateGuidanceActions(userId),
      getTopPerformingPatterns(userId, toolSlug)
    ]);

    const problems = analysisReturn.返回.核心问题.slice(0, 3);
    const actions = guidanceMemory.nextActions.slice(0, 3);

    const strategy = {
      hashtagCount: analysisReturn.返回.生成策略.hashtagCount || patterns.patterns.hashtagCountRange || 5,
      captionLengthType:
        analysisReturn.返回.生成策略.captionLengthType || patterns.patterns.captionLengthType || "medium",
      topHooks: (analysisReturn.返回.生成策略.topHooks?.slice(0, 3) ?? patterns.patterns.topHooks.slice(0, 3)) || []
    };

    return {
      stage: analysisReturn.stage,
      priority: guidanceMemory.currentPriority ?? guidance.priority,
      focus: guidanceMemory.currentFocus || problems[0] || DEFAULT_CREATOR_STATE.focus,
      problems: problems.length > 0 ? problems : DEFAULT_CREATOR_STATE.problems,
      actions: actions.length > 0 ? actions : guidance.actions.slice(0, 3),
      strategy,
      summary: guidanceMemory.summary || DEFAULT_CREATOR_STATE.summary
    };
  } catch {
    return DEFAULT_CREATOR_STATE;
  }
}

