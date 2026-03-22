import { NextResponse } from "next/server";

/**
 * V101.1 — Manual donation registration removed. Records come from payment callbacks only.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "donation_record_deprecated",
      message: "请使用支持者页面的「扫码打赏」创建订单并完成支付，系统会在支付成功后自动记录。",
      hint: "/zh/support — POST /api/payment/create-donation-order"
    },
    { status: 410 }
  );
}
