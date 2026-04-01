import { createAdminClient } from "@/lib/supabase/admin";

export type CreatorStateRefreshReason =
  | "no_snapshot"
  | "snapshot_expired"
  | "new_copy"
  | "new_upload"
  | "new_guidance_signal"
  | "stable";

export async function evaluateCreatorStateRefreshReason(
  userId: string,
  toolSlug: string
): Promise<CreatorStateRefreshReason> {
  const supabase = createAdminClient();

  const { data: snapshotRows } = await supabase
    .from("content_events")
    .select("created_at, tool_slug")
    .eq("event_type", "creator_state_snapshot")
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug)
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = snapshotRows?.[0] as { created_at?: string } | undefined;
  if (!latest?.created_at) return "no_snapshot";

  const snapshotAt = new Date(latest.created_at).getTime();
  const now = Date.now();
  if (!Number.isFinite(snapshotAt) || now - snapshotAt > 24 * 60 * 60 * 1000) {
    return "snapshot_expired";
  }

  const { data: newerEvents } = await supabase
    .from("content_events")
    .select("event_type, created_at")
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug)
    .gt("created_at", new Date(snapshotAt).toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  const types = new Set((newerEvents ?? []).map((e: any) => String(e.event_type)));
  if (types.has("upload_redirect")) return "new_upload";
  if (types.has("copy")) return "new_copy";
  if (types.has("guidance_generated") || types.has("guidance_memory_applied") || types.has("creator_state_applied")) {
    return "new_guidance_signal";
  }

  return "stable";
}

export async function shouldRefreshCreatorState(
  userId: string,
  toolSlug: string,
  _rawReasonOnly?: boolean
): Promise<{ shouldRefresh: boolean; reason: CreatorStateRefreshReason }> {
  const reason = await evaluateCreatorStateRefreshReason(userId, toolSlug);
  const shouldRefresh = reason !== "stable";
  return { shouldRefresh, reason };
}

