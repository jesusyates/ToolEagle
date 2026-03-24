import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const sid = readSupporterIdFromCookieStore(request.cookies);

  if (!user && !sid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const limit = Math.min(100, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10) || 50));
  const q = admin
    .from("orders")
    .select("order_id, market, currency, amount, order_type, package_id, status, paid_at, created_at, provider, credits_total, expire_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  const { data, error } = user
    ? await q.eq("user_id", user.id)
    : await q.eq("anonymous_user_id", sid as string);

  if (error) {
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
  return NextResponse.json({ orders: data ?? [] });
}

