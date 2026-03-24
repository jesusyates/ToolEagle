import { NextRequest } from "next/server";
import { POST as createOrder } from "@/app/api/payment/create-order/route";

/** Compatibility alias: donation now uses shared create-order architecture. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const normalized = {
    market: typeof body.market === "string" ? body.market : "cn",
    order_type: "donation",
    amount: typeof body.amount === "number" ? body.amount : Number(body.amount ?? 0),
    metadata: body.metadata ?? null
  };
  const forwarded = new NextRequest(new URL("/api/payment/create-order", request.url), {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(normalized)
  });
  return createOrder(forwarded);
}
