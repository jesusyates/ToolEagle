import { analyzeCreatorProfile } from "@/lib/content/analysis";
import { generateGuidanceActions } from "@/lib/content/guidance";
import { createAdminClient } from "@/lib/supabase/admin";

export type GuidanceMemory = {
  currentPriority: "low" | "medium" | "high";
  currentFocus: string;
  nextActions: string[];
  summary: string;
};

export async function buildGuidanceMemory(userId: string): Promise<GuidanceMemory> {
  try {
    const [analysis, guidance] = await Promise.all([
      analyzeCreatorProfile(userId),
      generateGuidanceActions(userId)
    ]);

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("content_events")
      .select("event_type")
      .order("created_at", { ascending: false })
      .limit(100);
    const uploadCount = (data ?? []).filter((x: any) => String(x.event_type) === "upload_redirect").length;

    const focus = (analysis.problems[0] ?? "缺少稳定发布行为样本。").slice(0, 80);
    const nextActions = guidance.actions.slice(0, 3);
    const summaryBase =
      uploadCount === 0
        ? "当前主要卡在生成后未形成真实发布行为。"
        : "当前主要卡在从生成到发布的稳定转化。";
    const summaryAction = nextActions[0] ?? "先完成一次真实发布。";
    const summary = `${summaryBase} 下一步：${summaryAction}`.slice(0, 120);

    return {
      currentPriority: guidance.priority,
      currentFocus: focus,
      nextActions,
      summary
    };
  } catch {
    return {
      currentPriority: "low",
      currentFocus: "先完成首次发布并积累行为样本。",
      nextActions: ["立即发布 1 条当前生成内容。", "接下来 3 条内容保持同一结构。"],
      summary: "样本不足，先完成一次真实发布，再继续优化。"
    };
  }
}

