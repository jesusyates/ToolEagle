import { createAdminClient } from "@/lib/supabase/admin";

export type CreatorStage = "new" | "growing" | "monetizing";

export type CreatorProfileAnalysis = {
  contentTypeDist: Record<string, number>;
  avgHashtagCount: number;
  avgCaptionLength: number;
  stage: CreatorStage;
  problems: string[];
  suggestions: string[];
};

type ContentRow = {
  id: string;
  tool_type: string;
  generated_output: unknown;
};

type EventRow = {
  content_id: string;
  event_type: string;
};

function extractCaptionAndHashtags(row: ContentRow): { caption?: string; hashtags?: string } {
  const out = row.generated_output as any;
  if (!out) return {};
  if (Array.isArray(out) && out.length > 0) {
    const first = out[0] as any;
    return {
      caption: typeof first?.caption === "string" ? first.caption : undefined,
      hashtags: typeof first?.hashtags === "string" ? first.hashtags : undefined
    };
  }
  return {
    caption: typeof (out as any)?.caption === "string" ? (out as any).caption : undefined,
    hashtags: typeof (out as any)?.hashtags === "string" ? (out as any).hashtags : undefined
  };
}

function countHashtags(s?: string): number {
  if (!s) return 0;
  const matches = s.match(/#\w+/g);
  return matches ? matches.length : 0;
}

function classifyStage(total: number, copyNoUploadCount: number, uploadCount: number): CreatorStage {
  if (total < 5) return "new";
  if (uploadCount >= Math.max(3, Math.round(total * 0.4))) return "monetizing";
  if (copyNoUploadCount >= Math.max(3, Math.round(total * 0.4))) return "growing";
  return "new";
}

export async function analyzeCreatorProfile(userId: string): Promise<CreatorProfileAnalysis> {
  const supabase = createAdminClient();

  const { data: contentRows, error: contentError } = await supabase
    .from("content_items")
    .select("id, tool_type, generated_output")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (contentError || !contentRows || contentRows.length === 0) {
    return {
      contentTypeDist: {},
      avgHashtagCount: 0,
      avgCaptionLength: 0,
      stage: "new",
      problems: ["几乎没有可用的历史内容样本。"],
      suggestions: ["先在 hook / caption / hashtag 工具里各生成至少 5 条，再回来做分析。"]
    };
  }

  const ids = (contentRows as any[]).map((r) => String(r.id));

  const { data: eventRows, error: eventError } = await supabase
    .from("content_events")
    .select("content_id, event_type")
    .in("content_id", ids)
    .limit(1000);

  const events = (eventError || !eventRows ? [] : (eventRows as any[])) as EventRow[];

  const byContent = new Map<string, Set<string>>();
  for (const ev of events) {
    const cid = String(ev.content_id);
    if (!byContent.has(cid)) byContent.set(cid, new Set());
    byContent.get(cid)!.add(String(ev.event_type));
  }

  const total = contentRows.length;
  const contentTypeDist: Record<string, number> = {};

  let hashtagSum = 0;
  let hashtagCount = 0;
  let captionLenSum = 0;
  let captionLenCount = 0;

  let uploadCount = 0;
  let copyNoUploadCount = 0;
  let noCopyCount = 0;

  const hashtagPerItem: number[] = [];
  const captionLens: number[] = [];

  for (const row of contentRows as ContentRow[]) {
    contentTypeDist[row.tool_type] = (contentTypeDist[row.tool_type] ?? 0) + 1;

    const { caption, hashtags } = extractCaptionAndHashtags(row);
    const hCount = countHashtags(hashtags);
    if (hCount > 0) {
      hashtagSum += hCount;
      hashtagCount += 1;
      hashtagPerItem.push(hCount);
    }
    if (caption && caption.trim().length > 0) {
      const len = caption.trim().length;
      captionLenSum += len;
      captionLenCount += 1;
      captionLens.push(len);
    }

    const evTypes = byContent.get(String(row.id)) ?? new Set<string>();
    const hasCopy = evTypes.has("copy");
    const hasUpload = evTypes.has("upload_redirect");
    if (hasUpload) uploadCount += 1;
    if (hasCopy && !hasUpload) copyNoUploadCount += 1;
    if (!hasCopy) noCopyCount += 1;
  }

  const avgHashtagCount = hashtagCount > 0 ? hashtagSum / hashtagCount : 0;
  const avgCaptionLength = captionLenCount > 0 ? captionLenSum / captionLenCount : 0;
  const stage = classifyStage(total, copyNoUploadCount, uploadCount);

  const problems: string[] = [];

  if (copyNoUploadCount > 0) {
    problems.push(`已有 ${copyNoUploadCount} 条内容被复制但没有对应的上传（Go to TikTok）记录。`);
  }
  if (uploadCount === 0) {
    problems.push("目前没有任何一次生成最终走到上传（upload_redirect）阶段。");
  }
  if (noCopyCount > 0 && noCopyCount / total > 0.5) {
    problems.push(`超过一半的生成结果从未被复制，说明内容对你当前目标的吸引力不足。`);
  }

  if (hashtagPerItem.length >= 3) {
    const minH = Math.min(...hashtagPerItem);
    const maxH = Math.max(...hashtagPerItem);
    if (maxH - minH >= 4) {
      problems.push(`不同内容的 hashtag 数量差异较大（约 ${minH}～${maxH} 个），难以形成稳定表现。`);
    }
  }

  if (captionLens.length >= 3) {
    const minC = Math.min(...captionLens);
    const maxC = Math.max(...captionLens);
    if (maxC - minC > 200) {
      problems.push(
        `caption 长度在极短 (${minC} 字) 和极长 (${maxC} 字) 之间来回波动，平台算法难以学习稳定的风格。`
      );
    }
  }

  if (problems.length === 0) {
    problems.push("历史内容样本数量有限，尚不足以稳定判断当前创作模式的问题。");
  }
  while (problems.length < 3) {
    problems.push("内容分布略显分散，需要更稳定的主题与结构才能看出清晰趋势。");
  }

  const suggestions: string[] = [];

  if (copyNoUploadCount > 0) {
    suggestions.push("为每次生成设定固定的收口动作：复制后务必完成一次真实上传（Go to TikTok）。");
  }
  if (uploadCount === 0) {
    suggestions.push("选择最近 3 条你最满意的生成结果，今天内实际发布至少 1 条，开始积累可用样本。");
  }
  if (hashtagPerItem.length >= 3) {
    const rounded = Math.max(1, Math.round(avgHashtagCount));
    suggestions.push(`在未来 10 条内容里，尽量将 hashtag 数量稳定在 ${rounded - 1}～${rounded + 1} 个之间。`);
  }
  if (captionLens.length >= 3) {
    const roundedLen = Math.round(avgCaptionLength);
    suggestions.push(`针对 caption，在 ${roundedLen - 40}～${roundedLen + 40} 字范围内反复迭代，避免极短或极长的极端波动。`);
  }
  if (Object.keys(contentTypeDist).length > 1 && (contentTypeDist["hook"] ?? 0) > (contentTypeDist["caption"] ?? 0)) {
    suggestions.push("在保持 hook 生成的同时，多用同一主题直接生成 caption，让平台看到完整的一条内容链路。");
  }

  if (suggestions.length === 0) {
    suggestions.push("继续在单一细分主题上集中生成 10+ 条内容，再根据 copy / upload 行为复盘下一步策略。");
  }

  const uniqueProblems = Array.from(new Set(problems)).slice(0, 5);
  const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 5);

  return {
    contentTypeDist,
    avgHashtagCount,
    avgCaptionLength,
    stage,
    problems: uniqueProblems.slice(0, 5),
    suggestions: uniqueSuggestions.slice(0, 5)
  };
}

