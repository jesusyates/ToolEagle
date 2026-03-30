import { NextRequest } from "next/server";
import { POST as createOrder } from "@/app/api/payment/create-order/route";

/** Compatibility alias: donation now uses shared create-order architecture. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const normalized = {
    market: typeof body.market === "string" ? body.market : "cn",
    order_type: "donation",
    amount: typeof body.amount === "number" ? body.amount : Number(body.amount ?? 0),
    metadata: body.metadata ?? null,
    source_path: typeof body.source_path === "string" ? body.source_path : undefined,
    source_type: typeof body.source_type === "string" ? body.source_type : undefined,
    page_type: typeof body.page_type === "string" ? body.page_type : undefined,
    tool_slug: typeof body.tool_slug === "string" ? body.tool_slug : undefined,
    referrer_path: typeof body.referrer_path === "string" ? body.referrer_path : undefined,
    return_url: typeof body.return_url === "string" ? body.return_url : undefined
  };
  const forwarded = new NextRequest(new URL("/api/payment/create-order", request.url), {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(normalized)
  });
  return createOrder(forwarded);
}
