import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";

/** GET — paid credit-pack orders for current identity (auth or anonymous). */
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
  const q = admin
    .from("orders")
    .select("order_id, plan, amount, currency, status, paid_at, credits_total, credits_expire_at, created_at")
    .eq("order_type", "credits")
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(50);

  const { data, error } = user
    ? await q.eq("user_id", user.id)
    : await q.eq("anonymous_user_id", sid as string);

  if (error) {
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}
