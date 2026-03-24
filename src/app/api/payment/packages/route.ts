import { NextRequest, NextResponse } from "next/server";
import { listCreditPackages, type BillingMarket } from "@/lib/billing/package-config";
import { COOKIE_PREFERRED_MARKET } from "@/config/market";

export async function GET(request: NextRequest) {
  const market = (request.nextUrl.searchParams.get("market") ||
    request.cookies.get(COOKIE_PREFERRED_MARKET)?.value ||
    "global") as BillingMarket;
  const normalized = market === "cn" ? "cn" : "global";
  return NextResponse.json({
    market: normalized,
    packages: listCreditPackages(normalized)
  });
}

