import { createAdminClient } from "@/lib/supabase/admin";

export type CaptionLengthType = "short" | "medium" | "long";

export type OptimizationPatterns = {
  topHooks: string[];
  hashtagCountRange: number;
  captionLengthType: CaptionLengthType;
};

const DEFAULT_PATTERNS: OptimizationPatterns = {
  topHooks: [],
  hashtagCountRange: 5,
  captionLengthType: "medium"
};

type ContentRow = {
  id: string;
  generated_output: unknown;
};

function extractHookText(row: ContentRow): string | null {
  const out = row.generated_output as any;
  if (!out) return null;
  if (Array.isArray(out) && out.length > 0) {
    const first = out[0] as any;
    if (typeof first?.hook === "string") return first.hook;
  }
  if (typeof out.hook === "string") return out.hook;
  return null;
}

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

function classifyCaptionLength(caption?: string): CaptionLengthType {
  if (!caption) return "medium";
  const len = caption.trim().length;
  if (len <= 60) return "short";
  if (len <= 180) return "medium";
  return "long";
}

function pickMajority<T extends string>(values: T[], fallback: T): T {
  if (values.length === 0) return fallback;
  const counts = new Map<T, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = fallback;
  let bestCount = 0;
  for (const [v, c] of counts.entries()) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export async function getTopPerformingPatterns(
  userId: string | null,
  toolSlug: string
): Promise<{ patterns: OptimizationPatterns; patternSource: "user" | "default" }> {
  const supabase = createAdminClient();

  const toolType =
    toolSlug === "hook-generator"
      ? "hook"
      : toolSlug === "tiktok-caption-generator"
        ? "caption"
        : toolSlug === "hashtag-generator"
          ? "hashtag"
          : null;

  if (!toolType) {
    return { patterns: DEFAULT_PATTERNS, patternSource: "default" };
  }

  // Use content_ids that have generate+copy+upload_redirect as "effective" content.
  const { data: eventRows, error: eventError } = await supabase
    .from("content_events")
    .select("content_id, event_type")
    .order("created_at", { ascending: false })
    .limit(500);

  if (eventError || !eventRows || eventRows.length === 0) {
    return { patterns: DEFAULT_PATTERNS, patternSource: "default" };
  }

  const byContent = new Map<string, Set<string>>();
  for (const row of eventRows as any[]) {
    const cid = String(row.content_id);
    if (!byContent.has(cid)) byContent.set(cid, new Set());
    byContent.get(cid)!.add(String(row.event_type));
  }

  const effectiveIds = Array.from(byContent.entries())
    .filter(([, types]) => types.has("generate") && types.has("copy") && types.has("upload_redirect"))
    .map(([cid]) => cid);

  if (effectiveIds.length < 3) {
    return { patterns: DEFAULT_PATTERNS, patternSource: "default" };
  }

  const { data: contentRows, error: contentError } = await supabase
    .from("content_items")
    .select("id, generated_output, tool_type, user_id")
    .in("id", effectiveIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (contentError || !contentRows || contentRows.length === 0) {
    return { patterns: DEFAULT_PATTERNS, patternSource: "default" };
  }

  const filtered = (contentRows as any[]).filter((r) => {
    if (r.tool_type !== toolType) return false;
    if (!userId) return true;
    return r.user_id === userId;
  });

  if (filtered.length < 3) {
    return { patterns: DEFAULT_PATTERNS, patternSource: "default" };
  }

  const patternSource: "user" = "user";

  // Hook patterns
  const hookCandidates: string[] = [];
  const captionLengths: CaptionLengthType[] = [];
  const hashtagCounts: number[] = [];

  for (const row of filtered as ContentRow[]) {
    const { caption, hashtags } = extractCaptionAndHashtags(row);
    const hCount = countHashtags(hashtags);
    if (hCount > 0) hashtagCounts.push(hCount);
    captionLengths.push(classifyCaptionLength(caption));

    const hook = extractHookText(row);
    if (hook) {
      const prefix = hook.trim().slice(0, 40);
      if (prefix.length > 0) hookCandidates.push(prefix);
    }
  }

  const uniqueHooks = Array.from(new Set(hookCandidates)).slice(0, 5);
  const avgHashtags =
    hashtagCounts.length > 0
      ? Math.max(1, Math.round(hashtagCounts.reduce((a, b) => a + b, 0) / hashtagCounts.length))
      : DEFAULT_PATTERNS.hashtagCountRange;

  const captionLengthType = captionLengths.length
    ? pickMajority(captionLengths, DEFAULT_PATTERNS.captionLengthType)
    : DEFAULT_PATTERNS.captionLengthType;

  const patterns: OptimizationPatterns = {
    topHooks: uniqueHooks,
    hashtagCountRange: avgHashtags,
    captionLengthType
  };

  return { patterns, patternSource };
}

