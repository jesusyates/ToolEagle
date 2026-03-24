import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrderByPublicId } from "@/lib/payment/orders-repository";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "missing_orderId" }, { status: 400 });
  }

  const order = await getOrderByPublicId(orderId);
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const anon = readSupporterIdFromCookieStore(request.cookies);

  const allowed =
    (user && order.user_id === user.id) ||
    (!user && order.anonymous_user_id && order.anonymous_user_id === anon);

  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    orderId: order.order_id,
    status: order.status,
    package_id: order.package_id ?? order.plan,
    order_type: order.order_type,
    amount: order.amount,
    currency: order.currency,
    paidAt: order.paid_at
  });
}
