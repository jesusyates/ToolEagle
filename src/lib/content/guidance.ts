import { analyzeCreatorProfile } from "@/lib/content/analysis";
import { createAdminClient } from "@/lib/supabase/admin";

export type GuidancePriority = "low" | "medium" | "high";

export type GuidanceActions = {
  actions: string[];
  priority: GuidancePriority;
};

export async function generateGuidanceActions(userId: string): Promise<GuidanceActions> {
  const supabase = createAdminClient();

  const profile = await analyzeCreatorProfile(userId);

  const { data: eventRows, error } = await supabase
    .from("content_events")
    .select("content_id, event_type")
    .order("created_at", { ascending: false })
    .limit(500);

  const events = (error || !eventRows ? [] : (eventRows as any[])) as { content_id: string; event_type: string }[];
  const byContent = new Map<string, Set<string>>();
  for (const ev of events) {
    const cid = String(ev.content_id);
    if (!byContent.has(cid)) byContent.set(cid, new Set());
    byContent.get(cid)!.add(String(ev.event_type));
  }

  let uploadCount = 0;
  let copyNoUploadCount = 0;
  let generateNoCopyCount = 0;

  for (const types of byContent.values()) {
    const hasGenerate = types.has("generate");
    const hasCopy = types.has("copy");
    const hasUpload = types.has("upload_redirect");
    if (hasUpload) uploadCount += 1;
    if (hasCopy && !hasUpload) copyNoUploadCount += 1;
    if (hasGenerate && !hasCopy) generateNoCopyCount += 1;
  }

  let priority: GuidancePriority = "low";
  if (uploadCount === 0 || copyNoUploadCount >= 3) {
    priority = "high";
  } else if (copyNoUploadCount > 0 || generateNoCopyCount > 0) {
    priority = "medium";
  } else {
    priority = "low";
  }

  const actions: string[] = [];

  if (uploadCount === 0) {
    actions.push("从最近 3 条生成结果中选 1 条，今天内真实发布一次（完成上传链路）。");
  }
  if (copyNoUploadCount > 0) {
    actions.push("把已经复制过但未发布的内容，挑 1 条立即走完发布流程（含 Go to TikTok）。");
  }
  if (generateNoCopyCount > 0) {
    actions.push("下一次生成后必须至少复制 1 条结果，再决定是否发布，避免只生成不使用。");
  }

  const captionLen = Math.round(profile.avgCaptionLength || 0);
  if (captionLen > 0) {
    const targetMin = Math.max(20, captionLen - 40);
    const targetMax = captionLen + 40;
    actions.push(`接下来 5 条 caption 控制在 ${targetMin}～${targetMax} 字之间，测试稳定长度对完播的影响。`);
  }

  const tiktokLike =
    (profile.contentTypeDist["hook"] ?? 0) + (profile.contentTypeDist["caption"] ?? 0) + (profile.contentTypeDist["hashtag"] ?? 0);
  if (tiktokLike > 0) {
    actions.push("选择 1 种内容类型（如 hook 或 caption），连续发布 5 条同一类型，给算法一个明确学习信号。");
  }

  if (actions.length === 0) {
    actions.push("未来 7 天内，每天至少发布 1 条由当前工具生成的内容，优先统一话题与结构。");
    actions.push("每次生成后记录是否复制、是否上传，用 10 条样本再复盘后续策略。");
  }

  const unique = Array.from(new Set(actions));

  return {
    actions: unique.slice(0, 5),
    priority
  };
}

