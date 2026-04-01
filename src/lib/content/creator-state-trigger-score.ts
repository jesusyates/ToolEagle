import { evaluateCreatorStateRefreshReason } from "@/lib/content/creator-state-refresh";

export type RefreshReason =
  | "no_snapshot"
  | "snapshot_expired"
  | "new_copy"
  | "new_upload"
  | "new_guidance_signal"
  | "stable";

export const CREATOR_STATE_TRIGGER_SCORE: Record<RefreshReason, number> = {
  no_snapshot: 100,
  snapshot_expired: 80,
  new_upload: 70,
  new_copy: 50,
  new_guidance_signal: 40,
  stable: 0
};

export async function scoreCreatorStateRefresh(userId: string, toolSlug: string): Promise<{
  shouldRefresh: boolean;
  reason: RefreshReason;
  triggerScore: number;
}> {
  const reason = (await evaluateCreatorStateRefreshReason(userId, toolSlug)) as RefreshReason;
  const triggerScore = CREATOR_STATE_TRIGGER_SCORE[reason] ?? 0;
  return {
    shouldRefresh: triggerScore > 0,
    reason,
    triggerScore
  };
}

