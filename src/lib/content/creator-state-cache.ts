import { buildCreatorState, DEFAULT_CREATOR_STATE, type CreatorState } from "@/lib/content/creator-state";
import { scoreCreatorStateRefresh } from "@/lib/content/creator-state-trigger-score";
import { createAdminClient } from "@/lib/supabase/admin";

function parseSnapshot(row: any): CreatorState | null {
  try {
    if (!row) return null;
    const strategy = row.strategy_used ?? {};
    return {
      stage: row.stage ?? "new",
      priority: row.priority ?? "low",
      focus: row.focus ?? "",
      problems: Array.isArray(row.problems_used) ? row.problems_used : [],
      actions: Array.isArray(row.actions_used) ? row.actions_used : [],
      strategy: {
        hashtagCount: Number(strategy.hashtagCount ?? 5),
        captionLengthType: (strategy.captionLengthType ?? "medium") as "short" | "medium" | "long",
        topHooks: Array.isArray(strategy.topHooks) ? strategy.topHooks : []
      },
      summary: row.summary ?? ""
    };
  } catch {
    return null;
  }
}

export async function saveCreatorStateSnapshot(userId: string, toolSlug: string, state: CreatorState): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("content_events").insert({
    content_id: `snapshot-${Date.now()}`,
    event_type: "creator_state_snapshot",
    user_id: userId,
    tool_slug: toolSlug,
    stage: state.stage,
    priority: state.priority,
    focus: state.focus,
    problems_used: state.problems,
    actions_used: state.actions,
    strategy_used: state.strategy,
    summary: state.summary
  } as any);
}

export async function getCreatorStateSnapshot(
  userId: string,
  toolSlug: string
): Promise<{ state: CreatorState; source: "fresh" | "cached"; refreshReason: string; triggerScore: number }> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_events")
    .select("stage, priority, focus, problems_used, actions_used, strategy_used, summary, created_at")
    .eq("event_type", "creator_state_snapshot")
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug)
    .order("created_at", { ascending: false })
    .limit(1);

  const cached = parseSnapshot(data?.[0]);
  const score = await scoreCreatorStateRefresh(userId, toolSlug);
  if (cached && !score.shouldRefresh) {
    return { state: cached, source: "cached", refreshReason: score.reason, triggerScore: score.triggerScore };
  }
  try {
    const fresh = await buildCreatorState(userId, toolSlug);
    return { state: fresh, source: "fresh", refreshReason: score.reason, triggerScore: score.triggerScore };
  } catch {
    return {
      state: DEFAULT_CREATOR_STATE,
      source: "fresh",
      refreshReason: score.reason,
      triggerScore: score.triggerScore
    };
  }
}

