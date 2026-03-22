import { createAdminClient } from "@/lib/supabase/admin";

/** Pro purchased via CN aggregator while logged out (te_supporter_id). */
export async function isAnonymousProEntitlement(anonymousUserId: string | null): Promise<boolean> {
  if (!anonymousUserId) return false;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return false;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("anonymous_pro_entitlements")
      .select("expires_at")
      .eq("anonymous_user_id", anonymousUserId)
      .maybeSingle();
    if (!data?.expires_at) return false;
    return new Date(data.expires_at as string).getTime() > Date.now();
  } catch {
    return false;
  }
}
