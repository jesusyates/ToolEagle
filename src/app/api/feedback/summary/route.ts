import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function assertSecret(request: NextRequest): boolean {
  const secret = process.env.FEEDBACK_ADMIN_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("x-feedback-admin-secret") === secret;
}

/** V100.3 — Rough counts for internal triage */
export async function GET(request: NextRequest) {
  if (!assertSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("user_feedback").select("status, category");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const row of data ?? []) {
    const s = (row as { status?: string }).status ?? "unknown";
    const c = (row as { category?: string }).category ?? "unknown";
    byStatus[s] = (byStatus[s] ?? 0) + 1;
    byCategory[c] = (byCategory[c] ?? 0) + 1;
  }

  return NextResponse.json({ total: data?.length ?? 0, by_status: byStatus, by_category: byCategory });
}
