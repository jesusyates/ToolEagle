import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthAction } from "@tooleagle/auth-system";

export type AuthAuditAction = AuthAction;

export type AuthAuditStatus = "ok" | "rate_limited" | "captcha_failed" | "error" | "rejected";

export async function logAuthAudit(row: {
  action: AuthAuditAction;
  email: string | null;
  ip: string;
  userAgent: string | null;
  status: AuthAuditStatus;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("auth_audit_log").insert({
      action: row.action,
      email: row.email,
      ip: row.ip,
      user_agent: row.userAgent,
      status: row.status,
      created_at: new Date().toISOString()
    });
    if (error) console.error("[auth-audit]", error.message);
  } catch (e) {
    console.error("[auth-audit]", e);
  }
}
