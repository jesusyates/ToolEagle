import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "@/lib/feedback/constants";

function assertSecret(request: NextRequest): boolean {
  const secret = process.env.FEEDBACK_ADMIN_SECRET?.trim();
  if (!secret) return false;
  const h = request.headers.get("x-feedback-admin-secret");
  return h === secret;
}

/**
 * V100.3 — Internal: recent feedback with optional filters.
 * Header: x-feedback-admin-secret (must match FEEDBACK_ADMIN_SECRET)
 */
export async function GET(request: NextRequest) {
  if (!assertSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));

  const supabase = createAdminClient();
  let q = supabase
    .from("user_feedback")
    .select(
      "id, anonymous_user_id, market, locale, route, source_page, tool_type, user_plan, category, title, message, contact, created_at, status, priority, internal_note"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && (FEEDBACK_STATUSES as readonly string[]).includes(status)) {
    q = q.eq("status", status);
  }
  if (category && (FEEDBACK_CATEGORIES as readonly string[]).includes(category)) {
    q = q.eq("category", category);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({ items: data ?? [] });
}
